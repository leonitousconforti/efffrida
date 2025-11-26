/**
 * This is some of the jankiest code I have written, but getting vitest to run
 * in frida was really hard. This is highly single purpose and there will,
 * without a doubt, be bugs in here and features from vitest that don't work.
 */

import "core-js/stable/url";
import "event-target-polyfill";

import type { CancelReason, VitestRunner } from "@vitest/runner";
import type { ModuleRunnerTransport } from "vite/module-runner";
import type { ContextRPC, RunnerRPC, RuntimeRPC, WorkerGlobalState } from "vitest";
import type { WorkerRequest, WorkerResponse } from "vitest/node";

import { collectTests, startTests } from "@vitest/runner";
import { serializeError } from "@vitest/utils/error";
import { createStackString, parseStacktrace } from "@vitest/utils/source-map";
import { createBirpc } from "birpc";
import { ModuleRunner } from "vite/module-runner";
import { EvaluatedModules } from "vitest";
import { VitestTestRunner } from "vitest/runners";

// There should only ever be one test running at a time in a worker and these
// need to be shared across multiple rpc calls anyways so they will live up here
// in the module scope.
let runPromise: Promise<unknown> | undefined;
let setupContext!: Omit<ContextRPC, "files" | "providedContext" | "invalidates" | "workerId">;

// How to post messages to the parent process
const postMessage = (message: unknown): void => send(message);
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
    testRunner.onBeforeRunSuite = () => {};

    // patch some methods, so custom runners don't need to call RPC
    const originalOnTaskUpdate = testRunner.onTaskUpdate;
    testRunner.onTaskUpdate = async (task, events) => {
        const p = birpc.onTaskUpdate(task, events);
        await originalOnTaskUpdate?.call(testRunner, task, events);
        return p;
    };

    // patch some methods, so custom runners don't need to call RPC
    const originalOnTestAnnotate = testRunner.onTestAnnotate;
    testRunner.onTestAnnotate = async (test, annotation) => {
        const p = birpc.onTaskArtifactRecord(test.id, {
            type: "internal:annotation",
            location: annotation.location!,
            annotation,
        });
        const overriddenResult = await originalOnTestAnnotate?.call(testRunner, test, annotation);
        const vitestResult = await p;
        return overriddenResult || vitestResult.annotation;
    };

    const originalOnTestArtifactRecord = testRunner.onTestArtifactRecord;
    testRunner.onTestArtifactRecord = async (test, artifact) => {
        const p = birpc.onTaskArtifactRecord(test.id, artifact);
        const overriddenResult = await originalOnTestArtifactRecord?.call(testRunner, test, artifact);
        const vitestResult = await p;
        return (overriddenResult as typeof artifact) || vitestResult;
    };

    const originalOnCollectStart = testRunner.onCollectStart;
    testRunner.onCollectStart = async (file) => {
        await birpc.onQueued(file);
        await originalOnCollectStart?.call(testRunner, file);
    };

    const originalOnCollected = testRunner.onCollected;
    testRunner.onCollected = async (files) => {
        // const state = getWorkerState();
        // files.forEach((file) => {
        //     file.prepareDuration = state.durations.prepare;
        //     file.environmentLoad = state.durations.environment;
        //     // should be collected only for a single test file in a batch
        //     state.durations.prepare = 0;
        //     state.durations.environment = 0;
        // });
        birpc.onCollected(files);
        await originalOnCollected?.call(testRunner, files);
    };

    const originalOnAfterRun = testRunner.onAfterRunFiles;
    testRunner.onAfterRunFiles = async (files) => {
        await originalOnAfterRun?.call(testRunner, files);
    };

    const originalOnAfterRunTask = testRunner.onAfterRunTask;
    testRunner.onAfterRunTask = async (test) => {
        const config = { bail: 0 };
        if (config.bail && test.result?.state === "fail") {
            const previousFailures = await birpc.getCountOfFailedTests();
            const currentFailures = 1 + previousFailures;

            if (currentFailures >= config.bail) {
                birpc.onCancel("test-failure");
                testRunner.cancel?.("test-failure");
            }
        }
        await originalOnAfterRunTask?.call(testRunner, test);
    };

    return testRunner;
}

/** @see https://github.com/vitest-dev/vitest/blob/9ca74cfb2060d8bc1c7a319ba3cba1578517adb0/packages/vitest/src/runtime/moduleRunner/moduleTransport.ts#L9-L36 */
class NoopTransport implements ModuleRunnerTransport {
    async invoke(event: any): Promise<{ result: any } | { error: any }> {
        if (event.type !== "custom") {
            return { error: new Error(`Vitest Module Runner doesn't support Vite HMR events.`) };
        }
        if (event.event !== "vite:invoke") {
            return { error: new Error(`Vitest Module Runner doesn't support ${event.event} event.`) };
        }
        const { data, name } = event.data;
        if (name === "getBuiltins") {
            // we return an empty array here to avoid client-side builtin check,
            // as we need builtins to go through `fetchModule`
            return { result: [] };
        }
        if (name !== "fetchModule") {
            return { error: new Error(`Unknown method: ${name}. Expected "fetchModule".`) };
        }
        try {
            // const result = await this.options.fetchModule(...(data as Parameters<FetchFunction>));
            const result = `
import { describe, expect, it } from "vitest";

describe("vitest-pool", () => {
    it("placeholder test", () => {
        expect(true).toBe(true);
    });
});
            `;
            console.log("fetchModule called with", data);
            return { result };
        } catch (error) {
            return { error };
        }
    }
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
            try {
                const { config, environment, pool } = message.context;
                setupContext = { environment, config, pool, rpc: birpc, projectName: config.name ?? "" };
                return postWorkerResponse({ type: "started" });
            } catch (error) {
                return postWorkerResponse({ type: "started", error: serializeError(error) });
            }
        }

        case "stop": {
            if (runPromise !== undefined) await runPromise;
            await Promise.allSettled(
                setupContext.rpc.$rejectPendingCalls(({ method, reject }) => {
                    reject(new Error(`[vitest-worker]: Closing rpc while ${method} was pending`));
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
                    error: serializeError(new Error("[vitest-worker]: Worker is already running tests")),
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

            const transport = new NoopTransport();
            const moduleRunner = new ModuleRunner({ transport, hmr: false });
            const testRunner = new VitestTestRunner(setupContext.config) as VitestRunner;
            const entrypoint = message.type === "run" ? startTests : collectTests;

            /** @see https://github.com/vitest-dev/vitest/blob/9ca74cfb2060d8bc1c7a319ba3cba1578517adb0/packages/vitest/src/runtime/runners/index.ts#L40-L45 */
            (testRunner as any).moduleRunner = moduleRunner;

            /** @see https://github.com/vitest-dev/vitest/blob/9ca74cfb2060d8bc1c7a319ba3cba1578517adb0/packages/vitest/src/runtime/runners/test.ts#L239-L242 */
            (testRunner as any).trace = <T>(
                _name: string,
                attributes: Record<string, any> | (() => T),
                cb?: () => T
            ): T => {
                return cb ? cb() : (attributes as () => T)();
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
