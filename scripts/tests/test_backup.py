"""Regression tests use a fake Docker command and never contact a database."""
import os
import pathlib
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASH = os.environ.get("BASH_PATH") or ("C:/Program Files/Git/bin/bash.exe" if os.name == "nt" else shutil.which("bash"))


class BackupTests(unittest.TestCase):
    def run_backup(self, fail=False, empty=False):
        with tempfile.TemporaryDirectory(prefix="tanbox-backup-test-") as temp:
            root = pathlib.Path(temp)
            (root / "scripts").mkdir()
            (root / "bin").mkdir()
            shutil.copyfile(ROOT / "scripts/backup-db.sh", root / "scripts/backup-db.sh")
            (root / ".env").write_text("POSTGRES_USER=test_user\nPOSTGRES_DB=test_db\n", encoding="utf-8")
            docker = root / "bin/docker"
            docker.write_text("#!/bin/bash\nif [ \"$1\" = inspect ]; then echo true; exit 0; fi\n"
                              "if [ \"${PG_DUMP_FAIL:-0}\" = 1 ]; then exit 9; fi\n"
                              "if [ \"${EMPTY_DUMP:-0}\" = 1 ]; then exit 0; fi\n"
                              "printf '%s\\n' '-- PostgreSQL database dump' 'CREATE TABLE test(id int);'\n",
                              encoding="utf-8", newline="\n")
            docker.chmod(0o755)
            env = dict(os.environ, PATH=str(root / "bin") + os.pathsep + os.environ["PATH"],
                       DOCKER_BIN=str(docker).replace("\\", "/"),
                       PG_DUMP_FAIL="1" if fail else "0", EMPTY_DUMP="1" if empty else "0")
            result = subprocess.run([BASH, str(root / "scripts/backup-db.sh")], env=env,
                                    capture_output=True, text=True, encoding="utf-8", errors="replace")
            published = list((root / "backups").glob("*.sql.gz"))
            temporary = list((root / "backups").glob(".tanbox-backup.*"))
            return result.returncode, len(published), len(temporary), result.stderr

    def test_dump_failure_cannot_publish_a_successful_backup(self):
        code, published, temporary, error = self.run_backup(fail=True)
        self.assertNotEqual(code, 0, error)
        self.assertEqual((published, temporary), (0, 0))

    def test_empty_dump_is_rejected(self):
        code, published, temporary, error = self.run_backup(empty=True)
        self.assertNotEqual(code, 0, error)
        self.assertEqual((published, temporary), (0, 0))

    def test_valid_dump_is_published_only_after_validation(self):
        code, published, temporary, error = self.run_backup()
        self.assertEqual(code, 0, error)
        self.assertEqual((published, temporary), (1, 0))


if __name__ == "__main__":
    unittest.main()
