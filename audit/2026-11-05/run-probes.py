"""Run audit fixtures in a new temporary directory; never start the real API."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--browser', choices=['original', 'canonical'], help='Run only the selected browser fixture; original is expected to fail at A18.')
args = parser.parse_args()
audit = Path(__file__).resolve().parent
root = audit.parents[1]
assert (root / 'backend/dist/controllers/orders.controller.js').is_file(), 'Build backend first.'
work = Path(tempfile.mkdtemp(prefix='tanbox-audit-replay-'))
env = dict(os.environ)
env.update(AUDIT_REPO=str(root), NODE_ENV='test', DATABASE_URL='postgresql://audit:audit@127.0.0.1:1/audit', JWT_SECRET='audit-fixture-secret-over-thirty-two-characters', ENCRYPTION_SECRET='audit-encryption-fixture-over-thirty-two-characters')
for key in ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CLIENT_BOT_TOKEN', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'FREEDOMPAY_SECRET_KEY']:
    env[key] = ''
scripts = [f'browser-smoke{"-canonical" if args.browser == "canonical" else ""}.cjs'] if args.browser else ['probes.cjs', 'route-matrix.cjs', 'db-invariants.cjs', 'backup-probe.cjs']
failed = False
print(f'Isolated fixtures and logs: {work}', flush=True)
for name in scripts:
    shutil.copy2(audit / 'evidence' / name, work / name)
    command = ['node', '--test', str(work / name)] if name == 'probes.cjs' else ['node', str(work / name)]
    result = subprocess.run(command, cwd=work, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8', errors='replace', timeout=180)
    (work / (name + '.log')).write_text(result.stdout, encoding='utf-8')
    print(f'{name}: exit {result.returncode}', flush=True)
    if result.returncode:
        print(result.stdout[-5000:], flush=True)
        failed = True
raise SystemExit(1 if failed else 0)
