#!/usr/bin/env python3
"""Verify actual paper-a.json answers; temporary compile/mutation only, no bank edits."""
import collections, copy, hashlib, heapq, itertools, json, math, random, re, shutil, sqlite3, subprocess, tempfile
from fractions import Fraction
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PATH=ROOT/'scripts/gbits-sprint/paper-a.json'
QUESTIONS=json.loads(PATH.read_text())
Q={q['id']:q for q in QUESTIONS}
COUNTS=collections.Counter()

def qid(n):return f'gbits-{n:03}'
def cpp(q,field):
    found=re.findall(r'```cpp\n(.*?)\n```',q[field],re.S)
    assert len(found)==1,(q['id'],field,len(found))
    return found[0]
def answer_choice(n,expected):
    q=Q[qid(n)]
    assert q['type']=='single_choice'
    found=[o['id'] for o in q['payload']['options'] if o['text']==str(expected)]
    assert len(found)==1,(q['id'],expected,found)
    assert q['solution']['correctOptionIds']==found,(q['id'],q['solution']['correctOptionIds'],found)
    COUNTS['objective_model_checks']+=1

def compile_cpp(code,folder,name):
    src=folder/(name+'.cpp');exe=folder/name
    src.write_text(code)
    run=subprocess.run(['c++','-std=c++17','-O2','-Wall','-Wextra','-pedantic',str(src),'-o',str(exe)],capture_output=True,text=True)
    assert run.returncode==0,(name,run.stderr)
    COUNTS['C++17_compilations']+=1
    return exe

def run_cpp(exe,stdin=''):
    run=subprocess.run([str(exe)],input=stdin,capture_output=True,text=True,timeout=5)
    assert run.returncode==0,(exe,run.stderr)
    COUNTS['C++17_executions']+=1
    return run.stdout.strip()

def assert_raises(fn):
    try:fn()
    except AssertionError:COUNTS['negative_probes']+=1
    else:raise AssertionError('negative probe unexpectedly passed')

# All 20 choices are computed from independent models, not copied fixture answers.
def verify_objectives(folder):
    edges=[(1,2),(3,4),(2,3),(5,6),(1,4),(6,7)]
    adj={i:set() for i in range(1,9)}
    for a,b in edges:adj[a].add(b);adj[b].add(a)
    seen=set();components=0
    for start in adj:
        if start in seen:continue
        components+=1;todo=[start];seen.add(start)
        while todo:
            for v in adj[todo.pop()]:
                if v not in seen:seen.add(v);todo.append(v)
    answer_choice(43,components)
    # AVL insertion, height computed recursively after every change.
    rotations=0
    def height(t):return 0 if t is None else 1+max(height(t[1]),height(t[2]))
    def rotleft(t):
        nonlocal rotations
        rotations+=1;y=t[2];t[2]=y[1];y[1]=t;return y
    def rotright(t):
        nonlocal rotations
        rotations+=1;y=t[1];t[1]=y[2];y[2]=t;return y
    def insert(t,k):
        if t is None:return [k,None,None]
        side=1 if k<t[0] else 2;t[side]=insert(t[side],k)
        balance=height(t[1])-height(t[2])
        if balance>1:
            if k>t[1][0]:t[1]=rotleft(t[1])
            return rotright(t)
        if balance< -1:
            if k<t[2][0]:t[2]=rotright(t[2])
            return rotleft(t)
        return t
    tree=None
    for k in [30,10,20,40,50]:tree=insert(tree,k)
    def balanced(t):return t is None or (abs(height(t[1])-height(t[2]))<=1 and balanced(t[1]) and balanced(t[2]))
    assert balanced(tree)
    answer_choice(44,f'{tree[0]}，{rotations}')
    for n in [45,59,60,61]:
        out=run_cpp(compile_cpp(cpp(Q[qid(n)],'question'),folder,'q'+str(n)))
        answer_choice(n,out)
    heap=[3,8,5,14,11,9,7]
    assert all(heap[(i-1)//2]<=heap[i] for i in range(1,len(heap)))
    assert heapq.heappop(heap)==3
    answer_choice(46,'['+','.join(map(str,heap))+']')
    left=[1,4,8];right=[2,3,9,10];i=j=checks=0;out=[]
    while i<len(left) and j<len(right):
        checks+=1
        if left[i]<right[j]:out.append(left[i]);i+=1
        else:out.append(right[j]);j+=1
    out+=left[i:]+right[j:];assert out==sorted(left+right)
    answer_choice(47,checks)
    edges=[(1,2),(1,2),(1,3),(2,3),(3,1),(3,4)]
    indeg=collections.Counter(v for u,v in edges);outdeg=collections.Counter(u for u,v in edges)
    assert sum(indeg.values())==sum(outdeg.values())==len(edges)
    answer_choice(48,f'{indeg[2]}，{outdeg[3]}，{len(edges)}')
    legal=set()
    def enumerate_stack(nextval,stack,out):
        if len(out)==5:legal.add(tuple(out));return
        if nextval<=5:enumerate_stack(nextval+1,stack+[nextval],out)
        if stack:enumerate_stack(nextval,stack[:-1],out+[stack[-1]])
    enumerate_stack(1,[],[])
    invalid=[o for o in Q[qid(49)]['payload']['options'] if tuple(map(int,o['text'].split(','))) not in legal]
    assert len(invalid)==1;answer_choice(49,invalid[0]['text'])
    jobs=[('A',0,6),('B',1,2),('C',2,1),('D',3,3)];time=wait=0;order=[]
    while jobs:
        ready=[j for j in jobs if j[1]<=time]
        if not ready:time=min(j[1] for j in jobs);continue
        job=min(ready,key=lambda j:(j[2],j[1],j[0]));jobs.remove(job)
        wait+=time-job[1];time+=job[2];order.append(job[0])
    assert order==list('ACBD');answer_choice(50,wait//4)
    page,offset=divmod(2500,1024);physical={0:5,1:9,2:3}[page]*1024+offset
    assert divmod(physical,1024)==(3,452);answer_choice(51,physical)
    answer_choice(52,max(size for size in range(1601) if size+20+8<=1500))
    db=sqlite3.connect(':memory:')
    db.executescript('CREATE TABLE A(k INTEGER); CREATE TABLE B(k INTEGER); INSERT INTO A VALUES(1),(1),(2); INSERT INTO B VALUES(1),(1),(3);')
    sql=re.search(r'```sql\n(.*?)\n```',Q[qid(53)]['question'],re.S).group(1)
    rows=db.execute(sql).fetchall();db.close();assert rows==[(1,)]*4
    answer_choice(53,len(rows))
    held=set();waiting=[];free=2
    for proc,op in [(1,'P'),(2,'P'),(3,'P'),(1,'V'),(4,'P')]:
        if op=='P':
            if free:held.add(proc);free-=1
            else:waiting.append(proc)
        else:
            assert proc in held;held.remove(proc)
            if waiting:held.add(waiting.pop(0))
            else:free+=1
        assert len(held)+free==2
    result='、'.join('P'+str(p) for p in sorted(held))+'；'+'、'.join('P'+str(p) for p in waiting)
    answer_choice(54,result)
    returns=[12 if a==b else 6 if a+b==7 else 0 for a in range(1,7) for b in range(1,7)]
    expected=Fraction(sum(returns),36)-4;assert expected==-1
    answer_choice(55,'−'+str(-expected))
    valid=0
    for ups in itertools.combinations(range(9),4):
        x=y=0;passed=False
        for step in range(9):
            if step in ups:y+=1
            else:x+=1
            passed|=(x,y)==(2,2)
        assert (x,y)==(5,4)
        valid+=passed
    answer_choice(56,valid)
    overlap=[t for t in range(math.lcm(5,7)) if t%5==2 and t%7==3]
    assert len(overlap)==1;answer_choice(57,overlap[0])
    positions=[p for p in 'ABC' if sum([p=='B',p!='C',p!='B'])==1]
    assert len(positions)==1;answer_choice(58,positions[0]+'箱')
    velocity=Fraction(2*3+1*(-3),3)
    loss=Fraction(2*3**2+1*3**2,2)-Fraction(3,2)*velocity**2
    assert 3*velocity==3 and loss==12
    answer_choice(62,f'+{velocity} m/s，{loss} J')
    # This assertion path must reject a deliberately wrong answer assignment.
    original=copy.deepcopy(Q[qid(55)]['solution']['correctOptionIds'])
    Q[qid(55)]['solution']['correctOptionIds']=['B']
    assert_raises(lambda:answer_choice(55,'−1'))
    Q[qid(55)]['solution']['correctOptionIds']=original


def verify_fills(folder):
    # Distinct models: recursive encoded-tree parser, list slicing, DFS, inversions.
    s='AB..CD..E..'
    def parse(pos,depth):
        if s[pos]=='.':return pos+1,0,0
        pos,nl,sl=parse(pos+1,depth+1);pos,nr,sr=parse(pos,depth+1)
        return pos,1+nl+nr,depth if nl==nr==0 else sl+sr
    pos,nodes,depthsum=parse(0,0)
    expected={63:[nodes,depthsum,pos]}
    a=[2,4,6,8,10];total=0
    for start,length in [(1,3),(0,4)]:
        window=a[start:start+length];window=window[1:]+window[:1]
        a[start:start+length]=window;total+=a[start]
    expected[64]=[total,sum((i+1)*v for i,v in enumerate(a))]
    left=[1,3,-1,-1,-1,6,-1];right=[2,4,5,-1,-1,-1,-1];value=[4,2,7,5,1,3,6]
    depths=collections.Counter();leafsum=0
    def visit(u,depth):
        nonlocal leafsum
        depths[depth]+=1
        if left[u]==right[u]==-1:leafsum+=value[u]
        for child in [left[u],right[u]]:
            if child!=-1:visit(child,depth+1)
    visit(0,0);expected[65]=[max(depths.values()),leafsum]
    a=[5,2,4,2,1];inversions=sum(a[i]>a[j] for i in range(5) for j in range(i+1,5))
    trace=[];sorted_prefix=[]
    for val in a:
        if not sorted_prefix:sorted_prefix=[val];continue
        # Compare right-to-left until <= val, independently keeping a separate list.
        compared=[]
        for old in reversed(sorted_prefix):
            compared.append(old)
            if old<=val:break
        trace.append(len(compared));sorted_prefix=sorted(sorted_prefix+[val])
    assert trace==[1,2,3,4];expected[66]=[inversions,sum(trace)]
    for n,values in expected.items():
        q=Q[qid(n)]
        code=cpp(q,'question')
        assert 15<=len([line for line in code.splitlines() if line.strip()])<=35,(n,len(code.splitlines()))
        got=run_cpp(compile_cpp(code,folder,'q'+str(n)))
        assert got==' '.join(map(str,values)),(n,got,values)
        for blank,value in zip(q['payload']['blanks'],values,strict=True):
            assert q['solution']['acceptedAnswers'][blank['id']]==[str(value)]
        COUNTS['fill_blank_models']+=1
    mutated=cpp(Q[qid(66)],'question').replace('++moves;','moves += 2;')
    assert mutated!=cpp(Q[qid(66)],'question')
    out=run_cpp(compile_cpp(mutated,folder,'q66_mutation'))
    assert_raises(lambda:(_ for _ in ()).throw(AssertionError()) if out!='8 10' else None)


def reduce_brute(s,k):
    while True:
        for i in range(len(s)-k+1):
            if len(set(s[i:i+k]))==1:s=s[:i]+s[i+k:];break
        else:return s or 'EMPTY'

def wall_brute(grid):
    # Enumerate a fixed wall removal, then an ordinary 2-D BFS. No used state.
    n=len(grid);m=len(grid[0]);walls=[None]+[(x,y) for x in range(n) for y in range(m) if grid[x][y]=='#']
    best=None
    for removed in walls:
        todo=collections.deque([(0,0,0)]);seen={(0,0)}
        while todo:
            x,y,d=todo.popleft()
            if (x,y)==(n-1,m-1):best=d if best is None else min(best,d);break
            for nx,ny in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
                if 0<=nx<n and 0<=ny<m and (nx,ny) not in seen and (grid[nx][ny]=='.' or (nx,ny)==removed):
                    seen.add((nx,ny));todo.append((nx,ny,d+1))
    return -1 if best is None else best

def verify_algorithms(folder):
    exe67=compile_cpp(cpp(Q[qid(67)],'answer'),folder,'q67')
    exe68=compile_cpp(cpp(Q[qid(68)],'answer'),folder,'q68')
    for n,exe in [(67,exe67),(68,exe68)]:
        q=Q[qid(n)]
        inp=re.search(r'### 样例输入\n```text\n(.*?)\n```',q['question'],re.S).group(1)+'\n'
        expected=re.search(r'### 样例输出\n```text\n(.*?)\n```',q['question'],re.S).group(1)
        assert run_cpp(exe,inp)==expected
        COUNTS['algorithm_samples']+=1
    for length in range(1,10):
        for chars in itertools.product('ab',repeat=length):
            s=''.join(chars)
            for k in range(2,6):
                got=run_cpp(exe67,f'{k}\n{s}\n')
                assert got==reduce_brute(s,k),(k,s,got)
                COUNTS['stack_exhaustive_cases']+=1
    rng=random.Random(20261015)
    for _ in range(350):
        s=''.join(rng.choice('abcd') for _ in range(rng.randint(1,80)));k=rng.randint(2,10)
        assert run_cpp(exe67,f'{k}\n{s}\n')==reduce_brute(s,k),(k,s)
        COUNTS['stack_random_cases']+=1
    for n in range(1,4):
        for m in range(1,4):
            cells=[(x,y) for x in range(n) for y in range(m) if (x,y) not in [(0,0),(n-1,m-1)]]
            for mask in itertools.product('.#',repeat=len(cells)):
                grid=[['.']*m for _ in range(n)]
                for (x,y),c in zip(cells,mask):grid[x][y]=c
                grid=[''.join(row) for row in grid]
                inp=f'{n} {m}\n'+'\n'.join(grid)+'\n'
                got=int(run_cpp(exe68,inp));expected=wall_brute(grid)
                assert got==expected,(grid,got,expected)
                COUNTS['wall_exhaustive_cases']+=1
    for _ in range(300):
        n=rng.randint(1,7);m=rng.randint(1,7)
        grid=[[rng.choice('.#') for _ in range(m)] for _ in range(n)]
        grid[0][0]=grid[-1][-1]='.';grid=[''.join(row) for row in grid]
        inp=f'{n} {m}\n'+'\n'.join(grid)+'\n'
        assert int(run_cpp(exe68,inp))==wall_brute(grid),grid
        COUNTS['wall_random_cases']+=1
    # Actual upper constraints, known independent outcomes.
    for k,s,expected in [(2,'a'*200000,'EMPTY'),(10,'a'*199999,'a'*9),(2,'ab'*100000,'ab'*100000)]:
        assert run_cpp(exe67,f'{k}\n{s}\n')==expected;COUNTS['algorithm_max_boundary_cases']+=1
    for g,expected in [(['.'*200]*200,398),(['.'+'#'*199]+['#'*200]*198+['#'*199+'.'],-1)]:
        assert int(run_cpp(exe68,'200 200\n'+'\n'.join(g)+'\n'))==expected;COUNTS['algorithm_max_boundary_cases']+=1
    mut67=cpp(Q[qid(67)],'answer').replace('st.back().second == k','st.back().second > k')
    assert mut67!=cpp(Q[qid(67)],'answer')
    out=run_cpp(compile_cpp(mut67,folder,'q67_mutation'),'3\naabbbacccaa\n')
    assert out!='aa';COUNTS['negative_probes']+=1
    mut68=cpp(Q[qid(68)],'answer').replace('next > 1','next > 0')
    assert mut68!=cpp(Q[qid(68)],'answer')
    out=run_cpp(compile_cpp(mut68,folder,'q68_mutation'),'3 4\n.#..\n###.\n....\n')
    assert out!='5';COUNTS['negative_probes']+=1


def main():
    before=hashlib.sha256(PATH.read_bytes()).hexdigest()
    assert len(QUESTIONS)==26
    assert [q['id'] for q in QUESTIONS]==[qid(n) for n in range(43,69)]
    assert collections.Counter(q['type'] for q in QUESTIONS)=={'single_choice':20,'fill_blank':4,'algorithm':2}
    for q in QUESTIONS:
        assert q['answer']==q['solution']['referenceAnswerMd']
        assert any(tag in q['question'] for tag in ['【历年考点·原创变式】','【预测考点·原创训练】'])
        assert all(tag in q['tags'] for tag in ['吉比特冲刺预测','冲刺A卷'])
        assert '### 验证' in q['answer'] and '### 来源与适用范围' in q['answer']
    assert shutil.which('c++'),'C++17 compiler missing'
    with tempfile.TemporaryDirectory(prefix='gbits-paper-a-') as tmp:
        folder=Path(tmp)
        verify_objectives(folder);verify_fills(folder);verify_algorithms(folder)
    assert hashlib.sha256(PATH.read_bytes()).hexdigest()==before,'verification modified its input'
    print('PASS paper A: 26 questions, 20 choices / 4 fills / 2 algorithms')
    print(json.dumps(dict(COUNTS),sort_keys=True))
    print('SHA256 unchanged:',before)
if __name__=='__main__':main()
