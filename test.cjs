const assert=require('node:assert/strict'),E=require('./engine.js');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS',name);};
function position(black=[],white=[]){const b=Array(225).fill(0);black.forEach(p=>b[p]=1);white.forEach(p=>b[p]=2);return b;}
test('empty board opens at center',()=>assert.equal(E.choose(position(),2).move,112));
for(const [name,stones,block,win] of [['horizontal',[108,109,110,111],107,112],['vertical',[37,52,67,82],22,97],['diagonal',[32,48,64,80],16,96],['anti diagonal',[42,56,70,84],28,98],['edge',[0,1,2,3],null,4],['broken four',[108,109,111,112],107,110]]){
  test(name+' immediate win',()=>{const b=position(block===null?[]:[block],stones);const r=E.choose(b,2,{timeMs:150,maxDepth:4});b[r.move]=2;assert(E.won(b,r.move,2));});
  test(name+' compulsory block',()=>{const b=position(stones,block===null?[]:[block]);assert.equal(E.choose(b,2,{timeMs:150,maxDepth:4}).move,win);});
}
test('win takes priority over blocking',()=>{const b=position([30,31,32,33],[108,109,110,111]);const r=E.choose(b,2,{timeMs:200});b[r.move]=2;assert(E.won(b,r.move,2));});
test('double threat attack',()=>{const b=position([0,2,4],[110,111,97,127]);assert.equal(E.choose(b,2,{timeMs:600,maxDepth:6}).move,112);});
test('no wraparound win across rows',()=>assert.equal(E.won(position([13,14,15,16,17]),15,1),false));
test('overline allowed',()=>assert(E.won(position([105,106,107,108,109,110]),108,1)));
test('search preserves input and respects time',()=>{const b=position([112,113,128,98],[96,114,97,143]),before=b.slice(),t=Date.now();const r=E.choose(b,1,{timeMs:250,maxDepth:12});assert.deepEqual(b,before);assert.equal(b[r.move],0);assert(Date.now()-t<1500);assert(r.depth>=2);});
test('full board returns no move',()=>assert.equal(E.choose(Array(225).fill(1),2,{timeMs:100}).move,-1));
test('AI selfplay legal moves',()=>{let b=position();for(let ply=0;ply<40;ply++){const s=ply%2+1,r=E.choose(b,s,{timeMs:45,maxDepth:4});assert(r.move>=0&&r.move<225);assert.equal(b[r.move],0);b[r.move]=s;if(E.won(b,r.move,s))break;}});
console.log(`${checks} checks passed`);
