"""Build and validate an isolated SQLite copy, then publish without overwrite."""
from contextlib import closing
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import tempfile


def initialize(source: Path, target: Path) -> dict:
    source, target = source.resolve(), target.resolve()
    if not source.is_file() or source == target or target.exists():
        raise ValueError("Source must exist; target must be a new, separate file.")
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as original:
        original.row_factory = sqlite3.Row
        if original.execute("pragma integrity_check").fetchone()[0] != "ok":
            raise ValueError("Source integrity check failed")
        works = [dict(row) for row in original.execute("select * from works")]
        votes = [dict(row) for row in original.execute("select * from vote_events")]
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=".gallery-init-", suffix=".sqlite", dir=target.parent)
    os.close(fd)
    temporary = Path(temporary_name)
    try:
        with closing(sqlite3.connect(temporary)) as db:
            db.executescript("""PRAGMA foreign_keys=ON;
            CREATE TABLE works(id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, votes_count INTEGER NOT NULL CHECK(votes_count >= 0), tags TEXT);
            CREATE TABLE vote_events(id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES works(id), fingerprint TEXT, created_at TEXT);
            CREATE INDEX vote_events_work_id ON vote_events(work_id);""")
            for row in works:
                tags = row.get("tags")
                if isinstance(tags, str):
                    if tags.startswith("{") and tags.endswith("}"):
                        tags = next(csv.reader([tags[1:-1]], escapechar="\\")) if tags != "{}" else []
                    else:
                        tags = json.loads(tags)
                if tags is not None and (not isinstance(tags, list) or not all(isinstance(tag, str) for tag in tags)):
                    raise ValueError("Tags must be a string array or null")
                db.execute("insert into works values(?,?,?,?,?)", (row["id"], row["title"], row.get("description"), row["votes_count"], None if tags is None else json.dumps(tags, ensure_ascii=False)))
            for row in votes:
                db.execute("insert into vote_events values(?,?,?,?)", (row["id"], row["work_id"], row.get("fingerprint"), row.get("created_at")))
            db.commit()
            if db.execute("pragma integrity_check").fetchone()[0] != "ok" or db.execute("pragma foreign_key_check").fetchall():
                raise ValueError("Working copy validation failed")
            if db.execute("select count(*) from works").fetchone()[0] != len(works) or db.execute("select count(*) from vote_events").fetchone()[0] != len(votes):
                raise ValueError("Working copy row count mismatch")
        if hashlib.sha256(source.read_bytes()).hexdigest() != before:
            raise ValueError("Source changed during initialization")
        # Same-directory hard link is atomic and refuses an existing target.
        # Never fall back to replace/rename-overwrite or copy into the target.
        os.link(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)
    return {"works": len(works), "votes": len(votes), "source_sha256": before, "source_unchanged": True}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--target", required=True)
    args = parser.parse_args()
    print(json.dumps(initialize(Path(args.source), Path(args.target))))
