// Minimal Node 22 SQLite surface used here; @types/node 20 lacks this module.
declare module "node:sqlite" {
  type Value = string | number | bigint | null | Uint8Array;
  interface Statement {
    all(...values: Value[]): Record<string, Value>[];
    get(...values: Value[]): Record<string, Value> | undefined;
    run(...values: Value[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  }
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }
}
