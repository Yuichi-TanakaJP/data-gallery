from contextlib import contextmanager, closing
import importlib.util
import pathlib
import sqlite3
import tempfile
import unittest
import hashlib
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('backup', pathlib.Path(__file__).parents[1] / 'scripts/backup-local-db.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

@contextmanager
def connection(*args, **kwargs):
    with closing(sqlite3.connect(*args, **kwargs)) as db:
        with db:
            yield db

class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.source = self.root / 'live.sqlite'
        with connection(self.source) as db:
            db.executescript('CREATE TABLE works(id TEXT PRIMARY KEY); CREATE TABLE vote_events(work_id TEXT REFERENCES works(id)); INSERT INTO works VALUES ("one"); INSERT INTO vote_events VALUES ("one");')
    def test_backup_and_new_connection_restore_readback(self):
        before = self.source.read_bytes()
        result = module.backup(self.source, self.root / 'backups')
        path = pathlib.Path(result['backup_directory']) / 'gallery.sqlite'
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), result['sha256'])
        with connection(path.as_uri() + '?mode=ro', uri=True) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM vote_events').fetchone()[0], 1)
        self.assertEqual(self.source.read_bytes(), before)
        second = module.backup(self.source, self.root / 'backups')
        self.assertNotEqual(result['backup_directory'], second['backup_directory'])
        self.assertTrue(path.exists())
    def test_wal_committed_data_is_included(self):
        with connection(self.source) as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('INSERT INTO works VALUES ("two")')
            db.commit()
            result = module.backup(self.source, self.root / 'backups')
            self.assertEqual(result['counts']['works'], 2)
    def test_missing_source_never_created(self):
        missing = self.root / 'missing.sqlite'
        with self.assertRaises(ValueError): module.backup(missing, self.root / 'backups')
        self.assertFalse(missing.exists())
    def test_corrupt_or_wrong_schema_not_published(self):
        self.source.write_bytes(b'not a database')
        with self.assertRaises(sqlite3.Error): module.backup(self.source, self.root / 'backups')
        self.assertFalse(list((self.root / 'backups').rglob('receipt.json')))
    def test_invalid_foreign_keys_not_published(self):
        with connection(self.source) as db: db.execute('INSERT INTO vote_events VALUES ("missing")')
        with self.assertRaises(ValueError): module.backup(self.source, self.root / 'backups')
        self.assertFalse(list((self.root / 'backups').rglob('receipt.json')))
    def test_receipt_failure_keeps_entire_generation_partial(self):
        with patch.object(pathlib.Path, 'write_text', side_effect=OSError('fixture')):
            with self.assertRaises(OSError): module.backup(self.source, self.root / 'backups')
        folders = list((self.root / 'backups').iterdir())
        self.assertTrue(folders)
        self.assertTrue(all(p.name.endswith('.partial') for p in folders))
    def test_deadline_does_not_publish(self):
        with patch.object(module.time, 'monotonic', side_effect=[0, 100]):
            with self.assertRaises(TimeoutError): module.backup(self.source, self.root / 'backups')
        self.assertFalse(list((self.root / 'backups').rglob('receipt.json')))

if __name__ == '__main__': unittest.main()
