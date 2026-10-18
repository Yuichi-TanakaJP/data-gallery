"""Manual, read-only SQLite online backup. Never restore/overwrite the live DB."""
import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import time
from uuid import uuid4


def inspect(db):
    if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        raise ValueError('SQLite integrity check failed')
    if db.execute('PRAGMA foreign_key_check').fetchone() is not None:
        raise ValueError('SQLite foreign key check failed')
    return {table: db.execute(f'SELECT count(*) FROM {table}').fetchone()[0]
            for table in ('works', 'vote_events')}


def backup(source, backup_root, timeout=30):
    source, backup_root = Path(source).resolve(), Path(backup_root).resolve()
    if not source.is_file():
        raise ValueError('Existing working SQLite DB required')
    if not 0 < timeout <= 300:
        raise ValueError('Timeout must be between 0 and 300 seconds')
    if backup_root == source or source in backup_root.parents:
        raise ValueError('Backup directory must be separate from the source file')
    # Exclusive directory; an existing backup can never be replaced.
    folder = backup_root / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid4().hex[:12])
    completed_folder = folder
    folder = folder.with_name(folder.name + '.partial')
    folder.mkdir(parents=True, exist_ok=False)
    partial = folder / 'gallery.sqlite.partial'
    deadline = time.monotonic() + timeout
    def progress(status, remaining, total):
        if time.monotonic() > deadline:
            raise TimeoutError('Backup timed out; .partial is not a usable backup')
    with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True, timeout=1)) as original:
        with closing(sqlite3.connect(partial)) as copy:
            original.backup(copy, pages=128, progress=progress, sleep=0.05)
            counts = inspect(copy)
    # Validate through a fresh read-only connection, then mark complete.
    with closing(sqlite3.connect(partial.as_uri() + '?mode=ro', uri=True)) as verify:
        if inspect(verify) != counts:
            raise ValueError('Backup readback mismatch')
    digest = hashlib.sha256(partial.read_bytes()).hexdigest()
    target = folder / 'gallery.sqlite'
    partial.rename(target)
    receipt = {'status': 'verified', 'created_at': datetime.now(timezone.utc).isoformat(),
               'method': 'sqlite_online_backup_readonly_source', 'counts': counts,
               'sha256': digest, 'backup_file': 'gallery.sqlite',
               'source_modified_by_tool': False, 'automatic_schedule': False,
               'off_device_protection': False}
    (folder / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    if json.loads((folder / 'receipt.json').read_text(encoding='utf-8')) != receipt:
        raise ValueError('Receipt readback mismatch')
    folder.rename(completed_folder)
    return {'backup_directory': str(completed_folder), **receipt}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--backup-root', type=Path, required=True)
    parser.add_argument('--timeout', type=float, default=30)
    args = parser.parse_args()
    try:
        print(json.dumps(backup(args.source, args.backup_root, args.timeout)))
    except (OSError, sqlite3.Error, ValueError, TimeoutError) as exc:
        # Avoid printing SQL, private row contents or arbitrary DB exception strings.
        parser.exit(1, 'Backup failed (' + type(exc).__name__ + '); inspect the local .partial directory. Live DB was not restored.\n')


if __name__ == '__main__':
    main()
