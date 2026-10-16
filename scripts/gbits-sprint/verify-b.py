#!/usr/bin/env python3
"""Read the actual paper JSON, compile embedded C++17, and compare independent models.
No source/bank edits. --negative-probes mutates temporary in-memory copies only.
"""
import argparse
import collections
import copy
import fractions
import itertools
import json
import os
from pathlib import Path
import random
import re
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--paper', type=Path, default=Path(__file__).with_name('paper-b.json'))
parser.add_argument('--negative-probes', action='store_true')
args = parser.parse_args()
rows = json.loads(args.paper.read_text())
questions = {q['id']: q for q in rows}
assert sorted(questions) == [f'gbits-{i:03}' for i in range(69, 90)]
assert collections.Counter(q['type'] for q in rows) == {'single_choice': 16, 'fill_blank': 2, 'algorithm': 3}
assert [q['order'] for q in rows] == list(range(247, 268))
for q in rows:
    assert q['answer'] == q['solution']['referenceAnswerMd']
    assert all(tag in q['tags'] for tag in ['吉比特冲刺预测', '冲刺B卷'])
    assert ('历年考点·原创变式' in q['tags']) ^ ('预测考点·原创训练' in q['tags'])
    for heading in ['参考回答', '评分点', '易错点', '验证', '来源与适用范围']:
        assert f'### {heading}' in q['answer']


def qid(i): return questions[f'gbits-{i:03}']
def selected(q):
    ids = q['solution']['correctOptionIds']
    assert len(ids) == 1
    return next(o['text'] for o in q['payload']['options'] if o['id'] == ids[0])
def code(q, field):
    found = re.findall(r'```cpp\n(.*?)\n```', q[field], re.S)
    assert len(found) == 1, (q['id'], field, len(found))
    return found[0]
def normalized(s): return ' '.join(s.split())

with tempfile.TemporaryDirectory(prefix='gbits-b-') as tmp:
    tmp = Path(tmp)
    compiler = os.environ.get('CXX', 'clang++')
    compiled = 0
    def compile_cpp(source, name):
        global compiled
        cpp, exe = tmp / (name + '.cpp'), tmp / name
        cpp.write_text(source)
        p = subprocess.run([compiler, '-std=c++17', '-O2', '-Wall', '-Wextra', str(cpp), '-o', str(exe)], capture_output=True, text=True)
        assert p.returncode == 0, p.stderr
        compiled += 1
        return exe
    def run(exe, data=''):
        p = subprocess.run([str(exe)], input=data, capture_output=True, text=True, timeout=8)
        assert p.returncode == 0, p.stderr
        return normalized(p.stdout)
    def check_code(q, name=None):
        exe = compile_cpp(code(q, 'question'), name or q['id'])
        out = run(exe)
        expect = selected(q) if q['type'] == 'single_choice' else q['solution']['acceptedAnswers']['out'][0]
        assert out == normalized(expect), (q['id'], out, expect)
    for i in list(range(69, 74)) + [85, 86]: check_code(qid(i))
    assert all(15 <= len(code(qid(i), 'question').splitlines()) <= 35 for i in [85, 86])

    # Independent DS/scheduling/arithmetic models, checked against chosen option text.
    adj = [[] for _ in range(6)]
    for a,b in [(0,1),(0,3),(1,2),(1,4),(3,4),(4,5)]: adj[a].append(b); adj[b].append(a)
    queue=collections.deque([0]); seen={0}; order=[]
    while queue:
        a=queue.popleft(); order.append(a)
        for b in sorted(adj[a]):
            if b not in seen: seen.add(b); queue.append(b)
    assert selected(qid(74)) == ','.join(map(str,order))
    import heapq
    heap=[9,4,7,1,3]; heapq.heapify(heap)
    assert selected(qid(75)) == str(heap).replace(' ','')
    table=[None]*7
    for key in [10,17,24]:
        pos=key%7
        while table[pos] is not None: pos=(pos+1)%7
        table[pos]=key
    assert table[3:6] == [10,17,24]
    # Model chosen deletion marker versus wrong "never used" marker.
    table[4]='deleted'
    def lookup(t,key):
        pos=key%7
        for _ in range(7):
            if t[pos] is None: return False
            if t[pos] == key: return True
            pos=(pos+1)%7
        return False
    assert lookup(table,24)
    table[4]=None
    assert not lookup(table,24)
    assert qid(76)['solution']['correctOptionIds'] == ['C']
    def check_graph_and_schedule(qmap):
        # Read actual edge triples and compare Floyd to all simple-path enumeration.
        graph_question=qmap['gbits-077']
        edges=[tuple(map(int,t)) for t in re.findall(r'\((\d),(\d),(\d)\)',graph_question['question'])]
        assert len(edges)==6
        distance=[[0 if i==j else 10**9 for j in range(5)] for i in range(5)]
        adjacency=[[] for _ in range(5)]
        for a,b,w in edges:
            assert w>=0
            distance[a][b]=distance[b][a]=w
            adjacency[a].append((b,w));adjacency[b].append((a,w))
        for k in range(5):
            for i in range(5):
                for j in range(5):distance[i][j]=min(distance[i][j],distance[i][k]+distance[k][j])
        all_lengths=[]
        def explore(vertex,seen,total):
            if vertex==4:all_lengths.append(total);return
            for neighbor,weight in adjacency[vertex]:
                if neighbor not in seen:explore(neighbor,seen|{neighbor},total+weight)
        explore(0,{0},0)
        assert distance[0][4]==min(all_lengths)==int(selected(graph_question))
        # Unit-time preemptive simulation, using parameters parsed from actual JSON.
        scheduling=qmap['gbits-078']
        jobs=[(name,int(arrival),int(service)) for name,arrival,service in re.findall(r'(P[123])\((\d+),(\d+)\)',scheduling['question'])]
        assert len(jobs)==3
        remaining={name:service for name,arrival,service in jobs};completed={};trace=[];now=0
        while len(completed)<len(jobs):
            ready=[j for j in jobs if j[1]<=now and remaining[j[0]]>0]
            if not ready:trace.append(None);now+=1;continue
            name,arrival,service=min(ready,key=lambda j:(remaining[j[0]],j[1],j[0]))
            trace.append(name);remaining[name]-=1;now+=1
            if remaining[name]==0:completed[name]=now
        waiting=sum(completed[name]-arrival-service for name,arrival,service in jobs)
        assert str(fractions.Fraction(waiting,len(jobs)))==selected(scheduling)
        assert trace==['P1']*2+['P2']*2+['P3']+['P2']*2+['P1']*5
    check_graph_and_schedule(questions)
    assert int(selected(qid(79))) == 900-(1600-1000)
    leaves=[None]
    for _ in range(3): leaves=[None for _ in leaves for _ in range(4)]
    assert int(selected(qid(80))) == len(leaves)*32
    maxima=[max(a,b) for a,b in itertools.product(range(1,5),repeat=2)]
    assert selected(qid(81)) == str(fractions.Fraction(sum(maxima),len(maxima)))
    # Iterative modular multiplication, independent of the cycle explanation.
    a=b=1
    for _ in range(2027): a=a*7%10; b=b*3%10
    assert int(selected(qid(82))) == (a+b)%10
    triples=[(a,b,c) for a,b,c in itertools.product(range(1,6),repeat=3) if a+b+c==5]
    assert int(selected(qid(83))) == len(triples)
    v=(3,-4); n=(0,1); dot=sum(a*b for a,b in zip(v,n)); reflected=tuple(a-2*dot*b for a,b in zip(v,n))
    assert selected(qid(84)) == str(reflected).replace(' ','')

    exes={i:compile_cpp(code(qid(i),'answer'),f'algorithm-{i}') for i in [87,88,89]}
    # Actual samples are parsed from JSON rather than copied as our own fixture.
    for i in [87,88,89]:
        samples=re.findall(r'```text\n(.*?)\n```',qid(i)['question'],re.S)
        assert len(samples)==2
        assert run(exes[i],samples[0]+'\n') == normalized(samples[1]), (i,'sample')

    rng=random.Random(20261015)
    def compare87(exe):
        cases=[(2,'-0',10,'+000'),(10,'9'*200,2,'1'*200),(10,'-'+'9'*200,2,'-'+'1'*200),(10,'1'+'0'*199,10,'9'*199),(10,'-'+'1'+'0'*199,10,'-'+'9'*199)]
        for _ in range(1600):
            b1,b2=rng.randint(2,10),rng.randint(2,10)
            def number(base):
                return rng.choice(['','+','-'])+''.join(str(rng.randrange(base)) for _ in range(rng.randint(1,200)))
            cases.append((b1,number(b1),b2,number(b2)))
        def tobase(n,b):
            if n==0:return '0'
            s=''
            while n:s=str(n%b)+s;n//=b
            return s
        for _ in range(200):
            n=rng.randrange(10**50); b1,b2=rng.randint(2,10),rng.randint(2,10); sign=rng.choice(['','-'])
            cases.append((b1,sign+'000'+tobase(n,b1),b2,sign+tobase(n,b2)))
        for j in range(0,len(cases),100):
            batch=cases[j:j+100]
            data=str(len(batch))+'\n'+'\n'.join(f'{a} {s} {b} {t}' for a,s,b,t in batch)+'\n'
            expected=[]
            for a,s,b,t in batch:
                x,y=int(s,a),int(t,b);expected.append('<' if x<y else '>' if x>y else '=')
            assert run(exe,data).split() == expected, ('gbits-087',j)
        return len(cases)
    count87=compare87(exes[87])

    def brute88(grid):
        # Enumerate paths and shield sites, then derive requirement from minimum prefix.
        n,m=len(grid),len(grid[0]); best=10**30
        def path(i,j,values):
            nonlocal best
            values=values+[grid[i][j]]
            if i==n-1 and j==m-1:
                for shield in [-1]+[k for k,x in enumerate(values) if x<0]:
                    running=0; low=0
                    for k,x in enumerate(values):
                        running+=-((-x)//2) if k==shield else x
                        low=min(low,running)
                    best=min(best,1-low)
                return
            if i+1<n:path(i+1,j,values)
            if j+1<m:path(i,j+1,values)
        path(0,0,[]);return best
    grids=[[[v]] for v in range(-10,11)]
    grids += [[[a,b]] for a,b in itertools.product(range(-3,4),repeat=2)]
    grids += [[list(x[:2]),list(x[2:])] for x in itertools.product([-1,0,1],repeat=4)]
    for _ in range(400):
        n,m=rng.randint(1,4),rng.randint(1,4)
        grids.append([[rng.randint(-12,12) for _ in range(m)] for _ in range(n)])
    def compare88(exe,small=True):
        for k,grid in enumerate(grids):
            data=f'{len(grid)} {len(grid[0])}\n'+'\n'.join(' '.join(map(str,row)) for row in grid)+'\n'
            assert int(run(exe,data)) == brute88(grid), ('gbits-088',k,grid)
        for value,expected in [(10**6,1),(-10**6,398500001)]:
            data='200 200\n'+((' '.join([str(value)]*200)+'\n')*200)
            assert int(run(exe,data)) == expected
        return len(grids)+2
    count88=compare88(exes[88])

    def brute89(s):
        best=0;starts=[]
        for i in range(len(s)):
            for j in range(i+1,len(s)+1):
                t=s[i:j]
                if len(set(t))==len(t):
                    if len(t)>best:best=len(t);starts=[i]
                    elif len(t)==best:starts.append(i)
        return best,len(starts)
    strings=[''.join(p) for n in range(1,8) for p in itertools.product('abc',repeat=n)]
    strings += [''.join(rng.choice('abcdef') for _ in range(rng.randint(1,30))) for _ in range(500)]
    def compare89(exe):
        for j in range(0,len(strings),20):
            batch=strings[j:j+20]
            got=run(exe,str(len(batch))+'\n'+'\n'.join(batch)+'\n').split()
            expected=[str(v) for s in batch for v in brute89(s)]
            assert got==expected,('gbits-089',j)
        for s,expected in [('a'*200000,'1 200000'),(('abcdefghijklmnopqrstuvwxyz'*7693)[:200000],'26 199975')]:
            assert run(exe,'1\n'+s+'\n')==expected
        return len(strings)+2
    count89=compare89(exes[89])
    negative=0
    if args.negative_probes:
        for i in [77,78]:
            wrongmap=copy.deepcopy(questions)
            target=wrongmap[f'gbits-{i:03}']
            key=target['solution']['correctOptionIds'][0]
            next(o for o in target['payload']['options'] if o['id']==key)['text']='999'
            try:check_graph_and_schedule(wrongmap)
            except AssertionError:negative+=1
            else:raise AssertionError(f'{i} wrong answer escaped detection')
        wrong=copy.deepcopy(qid(85));wrong['solution']['acceptedAnswers']['out']=['999 4']
        try:check_code(wrong,'negative-answer')
        except AssertionError:negative+=1
        else:raise AssertionError('wrong fill answer escaped detection')
        mutants=[(87,'a.sign * compareMagnitude','1 * compareMagnitude',compare87),
                 (88,'a[i][j]/2','a[i][j]',compare88),
                 (89,'left=max(left,last[c]+1);','left=last[c]+1;',compare89)]
        for i,old,new,checker in mutants:
            source=code(qid(i),'answer'); assert old in source
            exe=compile_cpp(source.replace(old,new),f'negative-{i}')
            try:checker(exe)
            except AssertionError:negative+=1
            else:raise AssertionError(f'{i} mutant escaped detection')
    print(f'PASS paper B: 21 metadata; 7 C++ output programs; 11 independent DS/math/system checks; algorithms 087={count87}, 088={count88}, 089={count89}; samples=3; negative probes={negative}; compiled={compiled}')
