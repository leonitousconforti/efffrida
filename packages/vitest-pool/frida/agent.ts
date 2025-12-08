/* eslint-disable import-x/first */
// AbortController polyfill - must be set up before any other imports that use it
// The abort-controller/polyfill checks for self, window, global but not globalThis
// So we set up `global` to point to globalThis, then require the polyfill
(globalThis as any).global = globalThis;

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("abort-controller/polyfill");

// Other polyfills
import "core-js/stable/url";
import "event-target-polyfill";

import type { CancelReason, VitestRunner } from "@vitest/runner";
import type { ContextRPC, RunnerRPC, RuntimeRPC, WorkerGlobalState } from "vitest";
import type { WorkerRequest, WorkerResponse } from "vitest/node";

import { collectTests, startTests } from "@vitest/runner";
import { serializeError } from "@vitest/utils/error";
import { createStackString, parseStacktrace } from "@vitest/utils/source-map";
import { createBirpc } from "birpc";
import { stringify as flattedStringify } from "flatted";
import { EvaluatedModules } from "vitest";

// There should only ever be one test running at a time in a worker and these
// need to be shared across multiple rpc calls anyways so they will live up here
// in the module scope.
let runPromise: Promise<unknown> | undefined;
let setupContext!: Omit<ContextRPC, "files" | "providedContext" | "invalidates" | "workerId">;

// How to post messages to the parent process - use flatted to handle circular references
const postMessage = (message: unknown): void => send(flattedStringify(message));
const postWorkerResponse = (response: Omit<WorkerResponse, "__vitest_worker_response__">): void =>
    postMessage({ ...response, __vitest_worker_response__: true });

// Collections of listeners
const cleanupListeners = new Set<() => unknown>();
const cancelListeners = new Set<(reason: CancelReason) => unknown>();
const messageListeners = new Set<(data: any, ...extras: Array<any>) => void>();
const birpc = createBirpc<RuntimeRPC, RunnerRPC>(
    {
        async onCancel(reason: CancelReason) {
            await Promise.allSettled([...cancelListeners.values()].map((listener) => listener(reason)));
        },
    },
    {
        // How to serialize and deserialize messages.
        serialize: (data) => data,
        deserialize: (data) => data,

        // How to send and receive messages.
        post: postMessage,
        on: (rpcListener) => messageListeners.add(rpcListener),
        off: (rpcListener) => messageListeners.delete(rpcListener),

        // Names of remote functions that do not need response.
        // These are fire-and-forget messages to the vitest pool coordinator.
        eventNames: ["onUserConsoleLog", "onCollected", "onCancel"],

        // Maximum timeout for waiting for response, in milliseconds.
        timeout: -1,
    }
);

/** @see https://github.com/vitest-dev/vitest/blob/8508296e9adcd2d9859e8073ac76c0bcb7d78f50/packages/vitest/src/runtime/utils.ts#L23-L32 */
function provideWorkerState(context: unknown, state: WorkerGlobalState): WorkerGlobalState {
    const NAME_WORKER_STATE = "__vitest_worker__";
    Object.defineProperty(context, NAME_WORKER_STATE, {
        value: state,
        configurable: true,
        writable: true,
        enumerable: false,
    });
    return state;
}

/** @see https://github.com/vitest-dev/vitest/blob/9ca74cfb2060d8bc1c7a319ba3cba1578517adb0/packages/vitest/src/runtime/runners/index.ts#L65-L139 */
function patchTestRunner(testRunner: VitestRunner): VitestRunner {
    const originalOnTaskUpdate = testRunner.onTaskUpdate;
    testRunner.onTaskUpdate = async (task, events) => {
        await birpc.onTaskUpdate(task, events);
        await originalOnTaskUpdate?.call(testRunner, task, events);
    };

    const originalOnCollectStart = testRunner.onCollectStart;
    testRunner.onCollectStart = async (file) => {
        await birpc.onQueued(file);
        await originalOnCollectStart?.call(testRunner, file);
    };

    const originalOnCollected = testRunner.onCollected;
    testRunner.onCollected = async (files) => {
        await birpc.onCollected(files);
        await originalOnCollected?.call(testRunner, files);
    };

    return testRunner;
}

/** @see https://github.com/vitest-dev/vitest/blob/4f58c77147796d48bf70579222a577df977300f8/packages/vitest/src/runtime/workers/init.ts#L20-L235 */
rpc.exports["onMessage"] = async (message: unknown): Promise<void> => {
    // Predicate to check if a message is a worker request
    const isWorkerRequest = (u: unknown): u is WorkerRequest =>
        typeof u === "object" && u !== null && "__vitest_worker_request__" in u && u.__vitest_worker_request__ === true;

    // Handle non-worker messages
    if (!isWorkerRequest(message)) {
        return messageListeners.forEach((listener) => {
            listener(message);
        });
    }

    // Handle worker messages
    switch (message.type) {
        case "start": {
            process.env.VITEST_POOL_ID = String(message.poolId);
            process.env.VITEST_WORKER_ID = String(message.workerId);
            const { config, environment, pool } = message.context;
            setupContext = { environment, config, pool, rpc: birpc, projectName: config.name ?? "" };
            return postWorkerResponse({ type: "started" });
        }

        case "stop": {
            if (runPromise !== undefined) await runPromise;
            await Promise.allSettled(
                setupContext.rpc.$rejectPendingCalls(({ method, reject }) => {
                    reject(`Closing rpc while ${method} was pending`);
                })
            );
            await Promise.allSettled([...cleanupListeners.values()].map((listener) => listener()));
            cancelListeners.clear();
            cleanupListeners.clear();
            return postWorkerResponse({ type: "stopped" });
        }

        case "run":
        case "collect": {
            if (runPromise !== undefined) {
                return postWorkerResponse({
                    type: "testfileFinished",
                    error: serializeError("Worker is already running tests"),
                });
            }

            /** @see https://github.com/vitest-dev/vitest/blob/4f58c77147796d48bf70579222a577df977300f8/packages/vitest/src/runtime/worker.ts#L28-L49 */
            provideWorkerState(globalThis, {
                rpc: birpc,
                environment: null!,
                config: setupContext.config,
                durations: { environment: 0, prepare: 0 },
                ctx: { ...setupContext, ...message.context },
                providedContext: message.context.providedContext,
                metaEnv: process.env as WorkerGlobalState["metaEnv"],

                resolvingModules: new Set(), // TODO: share this between runs? https://github.com/vitest-dev/vitest/blob/8508296e9adcd2d9859e8073ac76c0bcb7d78f50/packages/vitest/src/runtime/worker.ts#L9
                moduleExecutionInfo: new Map(), // TODO: share this between runs? https://github.com/vitest-dev/vitest/blob/4f58c77147796d48bf70579222a577df977300f8/packages/vitest/src/runtime/workers/base.ts#L18-L19
                evaluatedModules: new EvaluatedModules(), // TODO: share this between runs? https://github.com/vitest-dev/vitest/blob/4f58c77147796d48bf70579222a577df977300f8/packages/vitest/src/runtime/workers/base.ts#L18-L19

                onCancel: (listener) => cancelListeners.add(listener),
                onCleanup: (listener) => cleanupListeners.add(listener),
                onFilterStackTrace: (stack) => createStackString(parseStacktrace(stack)),
            } satisfies WorkerGlobalState);

            // Create a minimal runner without snapshot support
            const entrypoint = message.type === "run" ? startTests : collectTests;
            const testRunner: VitestRunner = {
                config: setupContext.config as VitestRunner["config"],
                importFile: async (file: string, _source: string): Promise<void> => {
                    const { describe, it } = await import("@vitest/runner");
                    const { expect } = await import("vitest");
                    (globalThis as any).__vitest_describe = describe;
                    (globalThis as any).__vitest_it = it;
                    (globalThis as any).__vitest_expect = expect;
                    const testSource = `
                        const describe = globalThis.__vitest_describe;
                        const it = globalThis.__vitest_it;
                        const expect = globalThis.__vitest_expect;

                        describe("vitest-pool", () => {
                            it("placeholder test using Script.evaluate", () => {
                                expect(true).toBe(false);
                            });

                            it("can access Frida APIs", () => {
                                expect(Frida.version).toBe("17.5.1");
                            });
                        });
                    `;
                    await Script.evaluate(file, testSource);
                },
            };

            try {
                for (const file of message.context.files) {
                    runPromise = entrypoint([file], patchTestRunner(testRunner));
                    await runPromise;
                }
                postWorkerResponse({ type: "testfileFinished" });
            } catch (error: unknown) {
                postWorkerResponse({ type: "testfileFinished", error: serializeError(error) });
            } finally {
                runPromise = undefined;
            }
        }
    }
};
