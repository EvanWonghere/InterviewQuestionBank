#!/usr/bin/env python3
"""Check published content identity, old 14 algorithms and all three new packs."""
import json
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
bank = {q['id']: q for q in json.loads((ROOT / 'public/questions.json').read_text())['questions']}
for letter in 'abc':
    for question in json.loads((ROOT / f'scripts/gbits-sprint/paper-{letter}.json').read_text()):
        assert bank[question['id']] == question, question['id']
for path in ['scripts/check-gbits-reference.py'] + [f'scripts/gbits-sprint/verify-{letter}.py' for letter in 'abc']:
    subprocess.run([sys.executable, str(ROOT / path)], cwd=ROOT, check=True)
print('PASS: actual bank identity; original 14 + new 8 algorithm reference implementations verified')
