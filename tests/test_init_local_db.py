from contextlib import closing
import importlib.util
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("initializer", Path(__file__).resolve().parents[1] / "scripts/init-local-db.py")
initializer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(initializer)


class InitializerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="gallery-init-test-")
        self.root = Path(self.temporary.name)
        self.source = self.root / "source.sqlite"
        self.target = self.root / "working.sqlite"
        with closing(sqlite3.connect(self.source)) as db:
            db.executescript("CREATE TABLE works(id TEXT,title TEXT,description TEXT,votes_count INTEGER,tags TEXT); CREATE TABLE vote_events(id TEXT,work_id TEXT,fingerprint TEXT,created_at TEXT);")
            db.execute("INSERT INTO works VALUES('00000000-0000-4000-8000-000000000001','Fixture',NULL,7,'{SQLite}')")
            db.execute("INSERT INTO vote_events VALUES('event','00000000-0000-4000-8000-000000000001',NULL,NULL)")
            db.commit()
        self.before = self.source.read_bytes()

    def tearDown(self):
        self.assertEqual(self.source.read_bytes(), self.before)
        self.temporary.cleanup()

    def test_success_and_existing_target_refusal(self):
        result = initializer.initialize(self.source, self.target)
        self.assertEqual((result["works"], result["votes"]), (1, 1))
        before = self.target.read_bytes()
        with self.assertRaises(ValueError): initializer.initialize(self.source, self.target)
        self.assertEqual(self.target.read_bytes(), before)
        self.assertFalse(list(self.root.glob('.gallery-init-*')))

    def test_failed_copy_leaves_no_target_and_can_retry(self):
        # Inject failure after schema/data construction, without changing input.
        real_link = os.link
        with patch.object(initializer.os, 'link', side_effect=OSError('fixture failure')):
            with self.assertRaises(OSError): initializer.initialize(self.source, self.target)
        self.assertFalse(self.target.exists())
        self.assertFalse(list(self.root.glob('.gallery-init-*')))
        initializer.initialize(self.source, self.target)
        self.assertTrue(self.target.exists())
        self.assertIs(os.link, real_link)

    def test_existing_target_created_during_copy_is_preserved(self):
        real_link = os.link
        def competing_target(src, dst):
            Path(dst).write_bytes(b'existing fixture')
            return real_link(src, dst)
        with patch.object(initializer.os, 'link', side_effect=competing_target):
            with self.assertRaises(FileExistsError): initializer.initialize(self.source, self.target)
        self.assertEqual(self.target.read_bytes(), b'existing fixture')
        self.assertFalse(list(self.root.glob('.gallery-init-*')))

    def test_invalid_tags_leave_no_formal_database(self):
        bad = self.root / 'bad.sqlite'
        bad.write_bytes(self.before)
        with closing(sqlite3.connect(bad)) as db:
            db.execute("UPDATE works SET tags='not json'")
            db.commit()
        before = bad.read_bytes()
        with self.assertRaises(ValueError): initializer.initialize(bad, self.target)
        self.assertFalse(self.target.exists())
        self.assertEqual(bad.read_bytes(), before)
        self.assertFalse(list(self.root.glob('.gallery-init-*')))

    def test_foreign_key_failure_leaves_no_formal_database(self):
        bad = self.root / 'bad.sqlite'
        bad.write_bytes(self.before)
        with closing(sqlite3.connect(bad)) as db:
            db.execute("UPDATE vote_events SET work_id='missing'")
            db.commit()
        before = bad.read_bytes()
        with self.assertRaises(sqlite3.IntegrityError): initializer.initialize(bad, self.target)
        self.assertFalse(self.target.exists())
        self.assertEqual(bad.read_bytes(), before)
        self.assertFalse(list(self.root.glob('.gallery-init-*')))

    def test_source_cannot_be_target(self):
        with self.assertRaises(ValueError): initializer.initialize(self.source, self.source)


    def test_non_string_tags_are_not_published(self):
        bad = self.root / 'bad.sqlite'
        bad.write_bytes(self.before)
        with closing(sqlite3.connect(bad)) as db:
            db.execute("UPDATE works SET tags='[42]'")
            db.commit()
        before = bad.read_bytes()
        with self.assertRaises(ValueError): initializer.initialize(bad, self.target)
        self.assertFalse(self.target.exists())
        self.assertEqual(bad.read_bytes(), before)
        self.assertFalse(list(self.root.glob('.gallery-init-*')))
