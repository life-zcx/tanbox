"""Prepare an isolated sanitized repository and bundle; never rewrite source refs/index or push."""
from pathlib import Path
import argparse
import io
import os
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True, help='New .bundle file outside the repository')
args = parser.parse_args()
output = args.output.resolve()
if output.exists() or output.is_relative_to(ROOT):
    raise SystemExit('Output must be a new file outside the source repository')


def git(*arguments, cwd=ROOT, data=None):
    result = subprocess.run(['git', *arguments], cwd=cwd, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError('Git operation failed: ' + ' '.join(arguments[:2]))
    return result.stdout


values = set()
for path in [ROOT / '.env', ROOT / 'backend/.env']:
    if path.is_file():
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            match = re.match(r'\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$', line)
            if match and any(word in match[1] for word in ['SECRET', 'PASSWORD', 'TOKEN', 'API_KEY', 'SMTP_PASS']):
                value = match[2].strip().strip('"\'')
                if len(value) >= 6:
                    values.add(value.encode())
old_config = git('show', 'HEAD:backend/src/config/env.ts')
values.update(re.findall(rb"return '([^']{16,})';", old_config))
old_compose = git('show', 'HEAD:docker-compose.dev.yml')
values.update(re.findall(rb'\$\{(?:INITIAL_ADMIN_PASSWORD|POSTGRES_PASSWORD|JWT_SECRET|ENCRYPTION_SECRET):-([^}]+)\}', old_compose))
token = re.compile(rb'\b[0-9]{8,12}:[A-Za-z0-9_-]{30,50}\b')


def scrub(data):
    if b'-- PostgreSQL database dump' in data and b'COPY ' in data:
        return b'-- Historical database dump removed\n'
    for value in sorted(values, key=len, reverse=True):
        data = data.replace(value, b'REDACTED_SECRET_ROTATE_BEFORE_USE')
    return token.sub(b'REDACTED_BOT_TOKEN', data)


def private_path(name):
    value = name.strip('"')
    basename = value.rsplit('/', 1)[-1]
    return ('/backups/' in '/' + value or value.endswith(('.sql.gz', '.env'))
            or (basename.startswith('.env.') and basename != '.env.example')
            or (value.endswith('.sql') and '/migrations/' not in '/' + value))


workspace = Path(tempfile.mkdtemp(prefix='tanbox-clean-history-')).resolve()
clean = workspace / 'repository'
clean.mkdir()
branch = git('symbolic-ref', '--short', 'HEAD').decode().strip()
git('init', '-q', '--initial-branch=' + branch, cwd=clean)
git('config', 'commit.gpgsign', 'false', cwd=clean)
git('config', 'core.hooksPath', str(workspace / 'disabled-hooks'), cwd=clean)
print('Exporting history into an isolated repository...', flush=True)
source = io.BytesIO(git('fast-export', '--all', '--signed-tags=strip'))
filtered = io.BytesIO()
while line := source.readline():
    if line.startswith(b'data '):
        length = int(line[5:].strip())
        content = scrub(source.read(length))
        filtered.write(b'data ' + str(len(content)).encode() + b'\n')
        filtered.write(content)
    elif line.startswith(b'M ') and private_path(line.decode('utf-8', errors='replace').split(' ', 3)[-1].rstrip('\n')):
        continue
    elif line.startswith(b'D ') and private_path(line[2:].decode('utf-8', errors='replace').rstrip('\n')):
        continue
    else:
        filtered.write(line)
git('fast-import', '--quiet', cwd=clean, data=filtered.getvalue())
git('checkout', '-f', branch, cwd=clean)

# Overlay the reviewable current fixes, including new migrations/tests, without copying local secrets.
paths = git('ls-files', '-z').split(b'\0') + git('ls-files', '--others', '--exclude-standard', '-z').split(b'\0')
for raw in set(paths):
    if not raw:
        continue
    name = raw.decode('utf-8')
    if Path(name).name in ['history-preparation.json', 'history-preparation.log']:
        continue
    if private_path(name):
        continue
    original, target = ROOT / name, clean / name
    if not target.resolve().is_relative_to(clean):
        raise RuntimeError('Unsafe export path')
    if original.is_file():
        target.parent.mkdir(parents=True, exist_ok=True)
        content = original.read_bytes()
        target.write_bytes(scrub(content) if b'\0' not in content else content)
    elif target.is_file():
        target.unlink()
git('add', '-A', cwd=clean)
if git('diff', '--cached', '--name-only', cwd=clean).strip():
    git('-c', 'user.name=Security remediation', '-c', 'user.email=security@localhost',
        'commit', '-qm', 'Apply audited security and integrity corrections', cwd=clean)
git('reflog', 'expire', '--expire=now', '--all', cwd=clean)
git('gc', '--prune=now', cwd=clean)
objects = git('rev-list', '--objects', '--all', cwd=clean).splitlines()
print(f'Verifying {len(objects)} reachable objects without printing values...', flush=True)
hashes = []
for item in objects:
    sha, _, filename = item.partition(b' ')
    if filename and private_path(filename.decode('utf-8', errors='replace')):
        raise RuntimeError('Private historical path survived sanitization')
    hashes.append(sha)
listing = git('cat-file', '--batch-check', cwd=clean, data=b'\n'.join(hashes) + b'\n')
blobs = [line.split()[0] for line in listing.splitlines() if line.split()[1] == b'blob']
reader = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=clean, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
try:
    for sha in blobs:
        reader.stdin.write(sha + b'\n')
        reader.stdin.flush()
        header = reader.stdout.readline().split()
        payload = reader.stdout.read(int(header[2]))
        reader.stdout.read(1)
        if token.search(payload) or any(value in payload for value in values):
            raise RuntimeError('Credential survived sanitization [REDACTED]')
finally:
    reader.stdin.close()
    reader.wait()
output.parent.mkdir(parents=True, exist_ok=True)
git('bundle', 'create', str(output), '--all', cwd=clean)
git('bundle', 'verify', str(output), cwd=clean)
print(f'Sanitized repository: {clean}')
print(f'Verified bundle: {output}')
print('Source refs/index and remotes unchanged; nothing pushed.')
