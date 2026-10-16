#!/usr/bin/env python3
"""Compile actual JSON snippets and independently verify C-paper answers.
No third party packages, no production writes; all compilation is in temp dirs.
"""
import argparse,copy,itertools,json,math,random,re,shutil,sqlite3,subprocess,tempfile
from collections import Counter,deque
from fractions import Fraction
from pathlib import Path

DEFAULT=Path(__file__).with_name('paper-c.json')

def verify(path, probe=False):
    rows=json.loads(Path(path).read_text()); by={int(q['id'].split('-')[1]):q for q in rows}; count=Counter()
    assert list(by)==list(range(90,121)), 'C IDs/order'
    assert Counter(q['type'] for q in rows)==Counter(single_choice=24,fill_blank=4,algorithm=3)
    assert [q['order'] for q in rows]==list(range(268,299))
    for q in rows:
        assert q['answer']==q['solution']['referenceAnswerMd']
        assert '冲刺C卷' in q['tags'] and '吉比特冲刺预测' in q['tags']
        assert ('【历年考点·原创变式】' in q['question']) != ('【预测考点·原创训练】' in q['question'])
        for heading in ('参考回答','评分点','易错点','验证','来源与适用范围'):assert '### '+heading in q['answer']
    def selected(i):
        q=by[i]; ids=q['solution']['correctOptionIds'];assert len(ids)==1
        return next(o['text'] for o in q['payload']['options'] if o['id']==ids[0])
    def choice(i,value):
        assert selected(i)==str(value),f'{i}: selected {selected(i)!r}, oracle {value!r}'
        count['choice_oracles']+=1
    def code(q,answer=False):
        matches=re.findall(r'```cpp\n(.*?)```',q['answer'] if answer else q['question'],re.S)
        assert len(matches)==1,q['id'];return matches[0]
    compiler=shutil.which('clang++') or shutil.which('g++');assert compiler,'C++17 compiler missing'
    with tempfile.TemporaryDirectory(prefix='gbits-c-') as tmp:
        tmp=Path(tmp);bins={}
        for i in [90,91,92,93,94,114,115,116,117,118,119,120]:
            src=tmp/f'{i}.cpp';src.write_text(code(by[i],i>=118));exe=tmp/str(i)
            subprocess.run([compiler,'-std=c++17','-O2','-Wall','-Wextra','-pedantic-errors',str(src),'-o',str(exe)],check=True,capture_output=True,text=True)
            bins[i]=exe;count['compiled_programs']+=1
        def run(i,data=''):
            count['cpp_runs']+=1
            return subprocess.run([str(bins[i])],input=data,text=True,capture_output=True,check=True,timeout=5).stdout.strip()
        for i in range(90,95):choice(i,run(i))
        for i in range(114,118):
            actual=run(i);assert actual in by[i]['solution']['acceptedAnswers']['output'],(i,actual);count['fill_outputs']+=1
        # Structural independent models, not explanations reused as fixtures.
        head,tail,cap=6,2,8
        cursor=head;length=0
        while cursor!=tail:cursor=(cursor+1)%cap;length+=1
        choice(95,length)
        def post(pre,ino):
            if not pre:return []
            r=pre[0];j=ino.index(r)
            return post(pre[1:j+1],ino[:j])+post(pre[j+1:],ino[j+1:])+[r]
        choice(96,' '.join(post('M G D J T P W'.split(),'D G J M P T W'.split())))
        legal=[]
        for o in by[97]['payload']['options']:
            a=o['text'].split();pos={v:i for i,v in enumerate(a)}
            if all(pos[u]<pos[v] for u,v in [('A','C'),('B','C'),('C','D'),('B','E')]):legal.append(o['text'])
        assert len(legal)==1;choice(97,legal[0])
        choice(98,min(sum(es) for es in itertools.combinations([2,5,9],2)))
        table=[None]*7
        for key in (10,17,24,5):
            p=key%7
            while table[p] is not None:p=(p+1)%7
            table[p]=key
        probes=1;p=24%7
        while table[p]!=24:p=(p+1)%7;probes+=1
        choice(99,probes)
        keys=[40,20,60,50,70,45,55];choice(100,sorted(k for k in keys if k>40)[0])
        todo=deque([(1,5),(2,3),(3,1)]);t=0;finish={}
        while todo:
            p,left=todo.popleft();used=min(2,left);left-=used;t+=used
            if left:todo.append((p,left))
            else:finish[p]=t
        choice(101,finish[2])
        lru=[];faults=0
        for x in (1,2,3,1,4,2,5):
            if x in lru:lru.remove(x)
            else:
                faults+=1
                if len(lru)==3:lru.pop(0)
            lru.append(x)
        choice(102,faults)
        received=set(range(1000,1100))|set(range(1200,1300));ack=1000
        while ack in received:ack+=1
        choice(103,ack)
        con=sqlite3.connect(':memory:');con.execute('create table t(v)');con.executemany('insert into t values (?)',[(None,),(0,),(0,),(7,)]);choice(104,' '.join(map(str,con.execute('select count(*), count(v), sum(v) from t').fetchone())));con.close()
        balls='RRRBB';pairs=list(itertools.combinations(range(5),2));given=[p for p in pairs if any(balls[j]=='R' for j in p)]
        choice(105,Fraction(sum(all(balls[j]=='R' for j in p) for p in given),len(given)))
        # 3 equally likely outcomes per trial, exactly one treated as hit.
        patterns=list(itertools.product(range(3),repeat=4));choice(106,Fraction(sum(x.count(0)==2 for x in patterns),len(patterns)))
        choice(107,sum(i%4==0 or i%6==0 for i in range(1,121)))
        choice(108,sum(math.gcd(a,b)==6 and a*b//math.gcd(a,b)==180 for a in range(1,181) for b in range(a+1,181)))
        x=1
        for _ in range(2026):x=(2*x+1)%7
        choice(109,x)
        choice(110,sum(abs(p.index('A')-p.index('B'))>1 for p in itertools.permutations('ABCDE')))
        choice(111,Fraction(abs(2*2-1+2*4-6),math.isqrt(2**2+(-1)**2+2**2)))
        # Convex scalar distance minimization: endpoint/interior candidates.
        candidates=[Fraction(0),Fraction(1),max(Fraction(0),min(Fraction(1),Fraction(5,3)))]
        dist=min((5-3*t)**2+2**2 for t in candidates);choice(112,dist)
        points=[(1,1),(5,2),(2,4)];shoelace=sum(points[i][0]*points[(i+1)%3][1]-points[i][1]*points[(i+1)%3][0] for i in range(3));choice(113,Fraction(abs(shoelace),2))
        rng=random.Random(120251015)
        # 118 oracle materializes each update, then sums each query directly.
        def check118(a,updates,queries):
            expected=a[:]
            for l,r,x in updates:
                for j in range(l-1,r):expected[j]+=x
            data=f'{len(a)} {len(updates)} {len(queries)}\n'+' '.join(map(str,a))+'\n'+''.join(f'{l} {r} {x}\n' for l,r,x in updates)+''.join(f'{l} {r}\n' for l,r in queries)
            wanted='\n'.join(str(sum(expected[l-1:r])) for l,r in queries)
            assert run(118,data)==wanted,'118 independent update oracle';count['algorithm_118_cases']+=1
        check118([3,0,2,1,4],[(2,5,3),(1,3,-2)],[(1,5),(2,3),(5,5)])
        check118([-1000000],[(1,1,-1000000)],[(1,1)])
        for _ in range(250):
            n=rng.randint(1,12);a=[rng.randint(-9,9) for _ in range(n)]
            updates=[];queries=[]
            for _ in range(rng.randint(1,14)):
                l=rng.randint(1,n);r=rng.randint(l,n);updates.append((l,r,rng.randint(-9,9)))
            for _ in range(rng.randint(1,12)):
                l=rng.randint(1,n);queries.append((l,rng.randint(l,n)))
            check118(a,updates,queries)
        # 119 oracle enumerates every subset, chronological sort, checks compatibility.
        def check119(jobs,c):
            best=0
            for mask in range(1<<len(jobs)):
                chosen=sorted(jobs[i] for i in range(len(jobs)) if mask>>i&1)
                if all(chosen[j][0]>=chosen[j-1][1]+c for j in range(1,len(chosen))):best=max(best,len(chosen))
            data=f'{len(jobs)} {c}\n'+''.join(f'{s} {e}\n' for s,e in jobs)
            assert run(119,data)==str(best),'119 exhaustive subset oracle';count['algorithm_119_cases']+=1
        check119([(0,3),(2,4),(5,6),(7,9),(8,10)],2)
        check119([(0,1),(1,2),(2,3)],0)
        check119([(0,1000000000)],1000000000)
        for _ in range(250):
            jobs=[]
            for _ in range(rng.randint(1,10)):
                s=rng.randrange(15);jobs.append((s,s+rng.randint(1,8)))
            check119(jobs,rng.randrange(5))
        # 120 oracle enumerates every k-1 cut position; never binary-searches.
        def check120(a,k):
            best=None
            for cuts in itertools.combinations(range(1,len(a)),k-1):
                bounds=(0,)+cuts+(len(a),);value=max(sum(a[bounds[i]:bounds[i+1]]) for i in range(k));best=value if best is None else min(best,value)
            data=f'{len(a)} {k}\n'+' '.join(map(str,a))+'\n'
            assert run(120,data)==str(best),'120 exhaustive partitions oracle';count['algorithm_120_cases']+=1
        check120([4,0,7,2,5],3);check120([0,0,0],2);check120([10**9]*10,1);check120([1,2,3],3)
        for _ in range(300):
            n=rng.randint(1,10);check120([rng.randint(0,30) for _ in range(n)],rng.randint(1,n))
        # Scale + int64 probes, expected values derived without target algorithm.
        n=200000
        data=f'{n} 1 1\n'+' '.join(['1000000']*n)+f'\n1 {n} 1000000\n1 {n}\n';assert run(118,data)==str(n*2000000);count['scale_cases']+=1
        data=f'{n} 0\n'+''.join(f'{2*i} {2*i+1}\n' for i in range(n));assert run(119,data)==str(n);count['scale_cases']+=1
        data=f'{n} 1\n'+' '.join(['1000000000']*n)+'\n';assert run(120,data)==str(n*10**9);count['scale_cases']+=1
    return dict(count)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=DEFAULT);ap.add_argument('--negative-probes',action='store_true');args=ap.parse_args()
    result=verify(args.input)
    if args.negative_probes:
        raw=json.loads(args.input.read_text());mutations=[]
        wrong=copy.deepcopy(raw);wrong[0]['solution']['correctOptionIds']=['A'];mutations.append(('wrong_choice',wrong))
        wrong=copy.deepcopy(raw);wrong[24]['solution']['acceptedAnswers']['output']=['12 5'];mutations.append(('wrong_fill',wrong))
        wrong=copy.deepcopy(raw)
        for f in ('answer',):wrong[28][f]=wrong[28][f].replace('pref[r] - pref[l - 1]','pref[r] - pref[l]')
        wrong[28]['solution']['referenceAnswerMd']=wrong[28]['answer'];mutations.append(('difference_off_by_one',wrong))
        wrong=copy.deepcopy(raw);wrong[29]['answer']=wrong[29]['answer'].replace('s >= ready','s > ready');wrong[29]['solution']['referenceAnswerMd']=wrong[29]['answer'];mutations.append(('cooldown_equality',wrong))
        wrong=copy.deepcopy(raw);wrong[30]['answer']=wrong[30]['answer'].replace('groups <= k','groups < k');wrong[30]['solution']['referenceAnswerMd']=wrong[30]['answer'];mutations.append(('partition_count',wrong))
        with tempfile.TemporaryDirectory(prefix='gbits-c-negative-') as tmp:
            for name,rows in mutations:
                path=Path(tmp)/f'{name}.json';path.write_text(json.dumps(rows,ensure_ascii=False))
                try:verify(path)
                except (AssertionError,subprocess.CalledProcessError):print('negative probe detected:',name)
                else:raise AssertionError('negative probe was not detected: '+name)
        result['negative_probes_detected']=len(mutations)
    print(json.dumps({'status':'PASS','file':str(args.input),'counts':result},ensure_ascii=False))
if __name__=='__main__':main()
