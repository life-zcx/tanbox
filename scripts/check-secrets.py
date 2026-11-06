"""Scan tracked working-tree files without printing secret values."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
TOKEN = re.compile(rb'\b[0-9]{8,12}:[A-Za-z0-9_-]{30,50}\b')


def scan():
    paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).split(b'\0')
    hits = []
    for raw in paths:
        if not raw:
            continue
        relative = raw.decode('utf-8')
        path = ROOT / relative
        if not path.is_file():
            continue
        if path.name in ['.env', '.env.local'] or ('backups/' in relative and relative.endswith(('.sql', '.sql.gz'))):
            hits.append((relative, 'sensitive file'))
            continue
        content = path.read_bytes()
        if b'\0' not in content and TOKEN.search(content):
            hits.append((relative, 'credential pattern [REDACTED]'))
    for name, kind in hits:
        print(f'{name}: {kind}')
    print(f'Secret scan: {len(hits)} finding(s)')
    return bool(hits)


if __name__ == '__main__':
    sys.exit(1 if scan() else 0)
