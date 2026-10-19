import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

export type GalleryWork = {
  id: string;
  title: string;
  description: string | null;
  votes_count: number;
  tags: string[] | null;
};

function openDatabase(path: string): DatabaseSync {
  if (!existsSync(path)) throw new Error("SQLite database is missing. Initialize a working copy first.");
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  return db;
}

export function listSqliteWorks(path: string): GalleryWork[] {
  const db = openDatabase(path);
  try {
    return db.prepare("SELECT id, title, description, votes_count, tags FROM works ORDER BY votes_count DESC, id").all().map((row) => ({
      id: String(row.id), title: String(row.title),
      description: row.description === null ? null : String(row.description),
      votes_count: Number(row.votes_count),
      tags: row.tags === null ? null : JSON.parse(String(row.tags)),
    }));
  } finally { db.close(); }
}

export function voteSqlite(path: string, workId: string): number | null {
  const db = openDatabase(path);
  try {
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!db.prepare("SELECT id FROM works WHERE id = ?").get(workId)) {
        db.exec("ROLLBACK");
        return null;
      }
      db.prepare("INSERT INTO vote_events (id, work_id, created_at) VALUES (?, ?, ?)").run(randomUUID(), workId, new Date().toISOString());
      db.prepare("UPDATE works SET votes_count = votes_count + 1 WHERE id = ?").run(workId);
      const row = db.prepare("SELECT votes_count FROM works WHERE id = ?").get(workId);
      db.exec("COMMIT");
      return Number(row?.votes_count);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally { db.close(); }
}
