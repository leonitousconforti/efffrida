# @efffrida/sql

A SQLite driver for the `effect/sql` modules that runs inside Frida agents,
backed by Frida's built-in `SqliteDatabase`. It provides both
`FridaSqlClient.SqliteClient` and the generic `SqlClient.SqlClient` service from
`effect/sql`.

```ts
import { Effect, Stream } from "effect";
import { SqlClient } from "effect/sql";

import { FridaSqlClient } from "@efffrida/sql";

const program = Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY, symbol TEXT)`;
    yield* sql`INSERT INTO hits ${sql.insert({ symbol: "open" })}`;
    yield* Stream.runForEach(sql`SELECT * FROM hits`.stream, (row) => Effect.log(row));
});

program.pipe(Effect.provide(FridaSqlClient.layer({ filename: `${Process.getTmpDir()}/hits.db` })), Effect.runFork);
```

Use `{ inlineData }` instead of `{ filename }` to open a database dumped with
`SqliteClient.dump`.
