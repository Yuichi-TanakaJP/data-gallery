import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import ts from 'typescript';

const dir = mkdtempSync(join(tmpdir(), 'gallery-store-test-'));
const compiled = join(dir, 'sqlite-store.mjs');
writeFileSync(compiled, ts.transpileModule(readFileSync(new URL('../src/lib/sqlite-store.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
const { listSqliteWorks, voteSqlite } = await import(pathToFileURL(compiled).href);
const id = '00000000-0000-4000-8000-000000000001';

test('persists one event and one increment; unknown work leaves state unchanged', () => {
  const path = join(dir, 'gallery.sqlite');
  const db = new DatabaseSync(path);
  db.exec('CREATE TABLE works(id TEXT PRIMARY KEY,title TEXT,description TEXT,votes_count INTEGER,tags TEXT); CREATE TABLE vote_events(id TEXT PRIMARY KEY,work_id TEXT,created_at TEXT);');
  db.prepare('INSERT INTO works VALUES(?,?,?,?,?)').run(id, 'Example', null, 7, '["SQLite"]');
  assert.equal(voteSqlite(path, id), 8);
  assert.equal(voteSqlite(path, 'missing'), null);
  assert.equal(db.prepare('SELECT count(*) AS n FROM vote_events').get().n, 1);
  assert.deepEqual(listSqliteWorks(path)[0].tags, ['SQLite']);
  db.close();
  assert.equal(listSqliteWorks(path)[0].votes_count, 8);
});

test('rolls back inserted event if increment fails', () => {
  const path = join(dir, 'gallery.sqlite');
  const db = new DatabaseSync(path);
  db.exec("CREATE TRIGGER reject_increment BEFORE UPDATE ON works BEGIN SELECT RAISE(ABORT, 'test failure'); END;");
  assert.throws(() => voteSqlite(path, id), /test failure/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM vote_events').get().n, 1);
  assert.equal(listSqliteWorks(path)[0].votes_count, 8);
  db.close();
});

test('missing database fails without creating an empty replacement', () => {
  const path = join(dir, 'missing.sqlite');
  assert.throws(() => listSqliteWorks(path), /missing/);
  assert.equal(existsSync(path), false);
});

process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
