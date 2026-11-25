/* Original, dependency-free freestyle Gomoku search engine. */
'use strict';
const GomokuEngine = (() => {
  const N=15, SIZE=225, WIN=100000000, DIRS=[[1,0],[0,1],[1,1],[1,-1]];
  const table=new Map();
  function lineValue(a) {
    let key=0; for(let i=0;i<9;i++)key=key*3+a[i];
    if(table.has(key))return table.get(key);
    const five=()=>{for(let s=0;s<=4;s++){let ok=true;for(let j=s;j<s+5;j++)if(a[j]!==1){ok=false;break;}if(ok)return true;}return false;};
    const winning=()=>{let n=0;for(let i=0;i<9;i++)if(a[i]===0){a[i]=1;if(five())n++;a[i]=0;}return n;};
    let v;
    if(five())v=6;
    else {const w=winning();if(w>=2)v=5;else if(w===1)v=4;else {
      let threes=0,twos=0;
      for(let i=0;i<9;i++)if(a[i]===0){a[i]=1;const q=winning();if(q>=2)threes++;else if(q===1)twos++;a[i]=0;}
      v=threes?3:twos?2:1;
    }}
    table.set(key,v);return v;
  }
  function won(b,p,s){const x=p%N,y=(p/N)|0;for(const [dx,dy] of DIRS){let n=1;for(const sign of [-1,1])for(let k=1;k<5;k++){const xx=x+dx*k*sign,yy=y+dy*k*sign;if(xx<0||xx>=N||yy<0||yy>=N||b[yy*N+xx]!==s)break;n++;}if(n>=5)return true;}return false;}
  function analyze(b,p,s){
    let fours=0,threes=0,score=0,rank=0;const x=p%N,y=(p/N)|0;
    for(const [dx,dy] of DIRS){const a=[];for(let k=-4;k<=4;k++){const xx=x+dx*k,yy=y+dy*k;a.push(k===0?1:xx<0||xx>=N||yy<0||yy>=N?2:b[yy*N+xx]===s?1:b[yy*N+xx]===0?0:2);}
      const v=lineValue(a);rank=Math.max(rank,v);score+=[0,3,90,1400,16000,180000,20000000][v];if(v===4)fours++;if(v===3)threes++;
    }
    if(fours>=2 || fours&&threes){score+=130000;rank=Math.max(rank,5);}else if(threes>=2)score+=15000;
    return {score,rank};
  }
  function candidates(b,s){
    const near=new Uint8Array(SIZE);let count=0;
    for(let i=0;i<SIZE;i++)if(b[i]){count++;const x=i%N,y=i/N|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<N&&yy>=0&&yy<N&&!b[yy*N+xx])near[yy*N+xx]=1;}}
    if(!count)return [{p:112,a:{score:0,rank:0},d:{score:0,rank:0},order:0}];
    const list=[];for(let p=0;p<SIZE;p++)if(near[p]){const a=analyze(b,p,s),d=analyze(b,p,3-s);list.push({p,a,d,order:Math.max(a.score,d.score*.96)+Math.min(a.score,d.score)*.12-((p%15-7)**2+((p/15|0)-7)**2)*.03});}
    list.sort((a,b)=>b.order-a.order);return list;
  }
  function choose(input,side,options={}){
    const b=Int8Array.from(input),start=Date.now(),budget=options.timeMs||4500,deadline=start+budget;
    let nodes=0,completed=0,best=-1,bestScore=0;const tt=new Map(),STOP={};
    let seed=0x12345678;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
    const z=Array.from({length:SIZE},()=>[0,rand(),rand()]);let hash=0;for(let i=0;i<SIZE;i++)if(b[i])hash^=z[i][b[i]];
    const put=(p,s)=>{b[p]=s;hash^=z[p][s];}; const take=(p,s)=>{b[p]=0;hash^=z[p][s];};
    const check=()=>{if(Date.now()>=deadline)throw STOP;};
    const leaf=(list)=>{if(!list.length)return 0;let a=0,d=0,a2=0,d2=0;for(const m of list){if(m.a.score>a){a2=a;a=m.a.score;}else a2=Math.max(a2,m.a.score);if(m.d.score>d){d2=d;d=m.d.score;}else d2=Math.max(d2,m.d.score);}return Math.round(a+a2*.16-d*.94-d2*.14);};
    function search(depth,alpha,beta,s,ply,ext){
      nodes++;if((nodes&31)===0)check();
      const key=(hash>>>0)+':'+s+':'+ext,old=tt.get(key),original=alpha;
      if(old&&old.depth>=depth){if(old.flag===0)return old.score;if(old.flag===1)alpha=Math.max(alpha,old.score);else beta=Math.min(beta,old.score);if(alpha>=beta)return old.score;}
      let list=candidates(b,s);if(!list.length)return 0;
      if(list.some(m=>m.a.rank===6))return WIN-ply;
      const blocks=list.filter(m=>m.d.rank===6);
      if(blocks.length>1)return -WIN+ply+1;
      if(blocks.length){list=blocks;if(depth<=0&&ext>0){depth=1;ext--;}}
      if(depth<=0)return leaf(list);
      const limit=blocks.length?1:ply<=1?16:depth>=3?10:7;
      if(old){const i=list.findIndex(m=>m.p===old.move);if(i>0)list.unshift(list.splice(i,1)[0]);}
      list=list.slice(0,limit);let score=-Infinity,move=list[0].p;
      for(const m of list){put(m.p,s);let v;try{v=-search(depth-1,-beta,-alpha,3-s,ply+1,ext);}finally{take(m.p,s);}if(v>score){score=v;move=m.p;}alpha=Math.max(alpha,v);if(alpha>=beta)break;}
      if(tt.size>100000)tt.clear();tt.set(key,{depth,score,move,flag:score<=original?2:score>=beta?1:0});return score;
    }
    let root=candidates(b,side);if(!root.length)return {move:-1,depth:0,nodes:0,elapsed:0,score:0};
    const wins=root.filter(m=>m.a.rank===6),blocks=root.filter(m=>m.d.rank===6);
    if(wins.length)return {move:wins[0].p,depth:1,nodes:1,elapsed:Date.now()-start,score:WIN};
    if(blocks.length)root=blocks;else root=root.slice(0,options.width||20);
    best=root[0].p;
    if(b.every(v=>v===0))return {move:112,depth:0,nodes:0,elapsed:Date.now()-start,score:0};
    for(let depth=1;depth<=(options.maxDepth||10);depth++){
      try {let alpha=-Infinity,iteration=-Infinity,choice=best;const results=[];
        root.sort((a,b)=>(b.p===best)-(a.p===best));
        for(const m of root){check();put(m.p,side);let value;try{value=-search(depth-1,-WIN*2,-alpha,3-side,1,4);}finally{take(m.p,side);}results.push([m.p,value]);if(value>iteration){iteration=value;choice=m.p;}alpha=Math.max(alpha,value);}
        best=choice;bestScore=iteration;completed=depth;
        if(options.onProgress)options.onProgress({depth,nodes,elapsed:Date.now()-start});
        if(Math.abs(bestScore)>WIN-100)break;
      }catch(e){if(e!==STOP)throw e;break;}
    }
    return {move:best,depth:completed,nodes,elapsed:Date.now()-start,score:bestScore};
  }
  return {choose,won,analyze,candidates};
})();
if(typeof module!=='undefined')module.exports=GomokuEngine;
