#!/usr/bin/env python3
"""Compile actual published C++17 answers; compare against independent small models."""
import itertools
import json
import math
import random
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'public/questions.json').read_text())
FIXTURES = json.loads((ROOT / 'scripts/fixtures/gbits-reference-cases.json').read_text())
RNG = random.Random(20261013)
CASES = {key: list(value) for key, value in FIXTURES['cases'].items()}

def case(number, text, answer):
    CASES[f'gbits-{number:03}'].append({'input': text, 'output': str(answer)})

def sequence(values):
    return ' '.join(map(str, values))

# Deterministic edges and independently calculated reference results.
for s, ans in [('(', 'no'), (')', 'no'), ('([)]', 'no'), ('{[()]}', 'yes'), ('()[]{}', 'yes')]:
    case(25, f'1\n{s}\n', ans)
for values in [[5, 2], [-7], [10**9]*5, [-10**9]*5]:
    case(26, f'{len(values)}\n{sequence(values)}\n', min(sum(values[i:j]) for i in range(len(values)) for j in range(i+1, len(values)+1)))
for s in ['0', '10', '0'*55, '1'*56, '101'*100]:
    result = []; pos = 0
    for size in itertools.cycle(range(1, 11)):
        block = s[pos:pos+size]
        if len(block) < size: break
        result.append(int(block, 2)); pos += size
    case(28, s+'\n', str(len(result))+'\n'+sequence(result))
for a, b in [('', ''), ('abc', ''), ('abc', 'abc'), ('abc', 'xabc'), ('abcdef', 'adef'), ('abc', 'acb')]:
    valid = any(a[:i]+a[j:] == b for i in range(len(a)+1) for j in range(i, len(a)+1))
    case(29, f'1\n{a}\n{b}\n', 'YES' if valid else 'NO')
case(30, '8\nabcde\nabcdef\nabcdefghijkl\nabcdefghijklm\nabcde1\nabcdef\nABCDEF\nabc_def\n', 'LENGTH\nOK\nOK\nLENGTH\nCHAR\nDUPLICATE\nOK\nCHAR')
for value in [-5, 5, 0]: case(31, f'1 1\n{value}\n', max(1, 1-value))
for a,b in [(0,0), (0,2**32-1), (2**32-1,2**32-1)]: case(32, f'{a} {b}\n', (a^b).bit_count())
for m,n in [(1,1), (2,2), (14,16)]:
    case(33, f'{m} {n}\n', sum(x>=2 and all(x%d for d in range(2, math.isqrt(x)+1)) for x in range(m,n+1)))
for a in [[0], [7,7,7], [0,10**9], [1,1,100,100]]:
    b=sorted(a); case(34,f'{len(a)}\n{sequence(a)}\n', max([y-x for x,y in zip(b,b[1:])] or [0]))
case(35, '3 3\nab\nb\naab\naab\nab\na\n', 'YES\nYES\nNO')
for times,c,deadline in [([0,0,0],4,8), ([0,0,0],4,7), ([10],2,10), ([2,1,1],1,3)]:
    # Enumerate all possible distinct kill ticks and monster assignments (small cases).
    feasible=any(all(t>=a for t,a in zip(ticks,sorted(times))) and all(y-x>=c for x,y in zip(ticks,ticks[1:])) for ticks in itertools.combinations(range(deadline+1),len(times)))
    case(36,f'{len(times)} {c} {deadline}\n{sequence(times)}\n','YES' if feasible else 'NO')
case(37,'1 6\n3 8\n',8)
case(38,'2 8\n4 4\n','1.00000')

for _ in range(30):
    a=[RNG.randint(-8,8) for _ in range(RNG.randint(1,10))]
    case(26,f'{len(a)}\n{sequence(a)}\n',min(sum(a[i:j]) for i in range(len(a)) for j in range(i+1,len(a)+1)))
    queries=[sorted([RNG.randrange(len(a)),RNG.randrange(len(a))]) for _ in range(5)]
    case(27,f'{len(a)} 5\n{sequence(a)}\n'+''.join(f'{l+1} {r+1}\n' for l,r in queries),'\n'.join(str(sum(a[l:r+1])) for l,r in queries))
    a=''.join(RNG.choice('ab') for _ in range(RNG.randint(0,8))); b=''.join(RNG.choice('ab') for _ in range(RNG.randint(0,8)))
    valid=any(a[:i]+a[j:]==b for i in range(len(a)+1) for j in range(i,len(a)+1))
    case(29,f'1\n{a}\n{b}\n','YES' if valid else 'NO')
    m,n=RNG.randint(1,4),RNG.randint(1,4);grid=[[RNG.randint(-8,8) for _ in range(n)] for _ in range(m)]
    paths=[]
    def visit(i,j,total,lowest):
        total+=grid[i][j];lowest=min(lowest,total)
        if i==m-1 and j==n-1: paths.append(max(1,1-lowest));return
        if i+1<m: visit(i+1,j,total,lowest)
        if j+1<n: visit(i,j+1,total,lowest)
    visit(0,0,0,0)
    case(31,f'{m} {n}\n'+'\n'.join(sequence(row) for row in grid)+'\n',min(paths))
    a,b=RNG.randrange(2**32),RNG.randrange(2**32);case(32,f'{a} {b}\n',(a^b).bit_count())
    m,n=sorted([RNG.randint(1,150),RNG.randint(1,150)])
    case(33,f'{m} {n}\n',sum(x>=2 and all(x%d for d in range(2,math.isqrt(x)+1)) for x in range(m,n+1)))
    a=[RNG.randint(0,1000) for _ in range(RNG.randint(1,12))];b=sorted(a)
    case(34,f'{len(a)}\n{sequence(a)}\n',max([y-x for x,y in zip(b,b[1:])] or [0]))
    patterns=[''.join(RNG.choice('abc') for _ in range(RNG.randint(1,5))) for _ in range(6)]
    texts=[''.join(RNG.choice('abc') for _ in range(RNG.randint(1,30))) for _ in range(8)]
    case(35,'6 8\n'+'\n'.join(patterns+texts)+'\n','\n'.join('YES' if any(p in t for p in patterns) else 'NO' for t in texts))
    n,B=RNG.randint(1,8),RNG.randint(1,15);items=[(RNG.randint(1,B),RNG.randint(1,100)) for _ in range(n)]
    ans=max(sum(v for i,(_,v) in enumerate(items) if mask>>i&1) for mask in range(1<<n) if sum(c for i,(c,_) in enumerate(items) if mask>>i&1)<=B)
    case(37,f'{n} {B}\n'+'\n'.join(f'{c} {v}' for c,v in items)+'\n',ans)

with tempfile.TemporaryDirectory(prefix='gbits-cpp-') as temp:
    folder=Path(temp)
    def check(question):
        key=question['id'];code=re.search(r'```cpp\n(.*?)```',question['answer'],re.S).group(1)
        assert code==FIXTURES['programs'][key],key
        source=folder/(key+'.cpp');binary=folder/key;source.write_text(code)
        subprocess.run(['c++','-std=c++17','-O2','-Wall','-Wextra',str(source),'-o',str(binary)],check=True,capture_output=True,text=True)
        for item in CASES[key]:
            result=subprocess.run([str(binary)],input=item['input'],text=True,capture_output=True,check=True,timeout=3)
            assert result.stdout.strip()==item['output'].strip(),(key,item,result.stdout)
        return len(CASES[key])
    algorithms=[q for q in DATA['questions'] if q['id'].startswith('gbits-') and q['type']=='algorithm']
    with ThreadPoolExecutor(max_workers=4) as pool: counts=list(pool.map(check,algorithms))
    print(f'PASS: {len(algorithms)} actual C++17 answers; {sum(counts)} sample, boundary and differential cases')
