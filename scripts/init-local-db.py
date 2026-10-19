"""Create an isolated working DB from the recovered SQLite snapshot; never overwrite."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
parser.add_argument('--target', required=True)
args = parser.parse_args()
source, target = Path(args.source).resolve(), Path(args.target).resolve()
if not source.is_file() or source == target or target.exists():
    raise SystemExit('Source must exist; target must be a new, separate file.')
before = hashlib.sha256(source.read_bytes()).hexdigest()
with sqlite3.connect(source.as_uri()+'?mode=ro', uri=True) as original:
    original.row_factory = sqlite3.Row
    assert original.execute('pragma integrity_check').fetchone()[0] == 'ok'
    works = [dict(row) for row in original.execute('select * from works')]
    votes = [dict(row) for row in original.execute('select * from vote_events')]
target.parent.mkdir(parents=True, exist_ok=True)
# Reserve the name exclusively so another initialization cannot overwrite it.
with target.open('xb'):
    pass
with sqlite3.connect(target) as db:
    db.executescript('''PRAGMA foreign_keys=ON;
    CREATE TABLE works(id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, votes_count INTEGER NOT NULL CHECK(votes_count >= 0), tags TEXT);
    CREATE TABLE vote_events(id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES works(id), fingerprint TEXT, created_at TEXT);
    CREATE INDEX vote_events_work_id ON vote_events(work_id);''')
    for row in works:
        tags = row.get('tags')
        if isinstance(tags, str):
            if tags.startswith('{') and tags.endswith('}'):
                tags = next(csv.reader([tags[1:-1]], escapechar='\\')) if tags != '{}' else []
            else:
                tags = json.loads(tags)
        assert tags is None or isinstance(tags, list)
        db.execute('insert into works values(?,?,?,?,?)', (row['id'], row['title'], row.get('description'), row['votes_count'], None if tags is None else json.dumps(tags, ensure_ascii=False)))
    for row in votes:
        db.execute('insert into vote_events values(?,?,?,?)', (row['id'], row['work_id'], row.get('fingerprint'), row.get('created_at')))
    assert not db.execute('pragma foreign_key_check').fetchall()
assert hashlib.sha256(source.read_bytes()).hexdigest() == before
print(json.dumps({'works': len(works), 'votes': len(votes), 'source_sha256': before, 'source_unchanged': True}))
