import * as Channel from "effect/Channel";

export const fromIOStream = (
    iostream: IOStream
): Channel.Channel<Uint8Array, Uint8Array, never, never, void, unknown, never> => {
    Channel.embedInput();

    return {} as any;
};
