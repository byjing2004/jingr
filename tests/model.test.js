import test from 'node:test';
import assert from 'node:assert/strict';
import {models,results,normalize,sample,residualForecast,forecast,demoMetrics} from '../src/model.js';
test('weights sum to one, including all-zero fallback',()=>{
  for(const input of [[1,1,1,1,1,1],[0,0,0,0,0,0],[1,2,7,0,0,10]]){
    const w=normalize(input);assert.ok(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-12);assert.ok(w.every(v=>v>=0));
  }
  assert.throws(()=>normalize([-1,0,0,0,0,0]));assert.throws(()=>normalize([1]));
});
test('a single active model reconstructs its own residual forecast',()=>{
  for(let i=0;i<6;i++){
    const w=Array(6).fill(0);w[i]=1;const s=sample(60);
    assert.equal(forecast(60,w),Math.exp(s.trend+s.season+residualForecast(60,i)));
  }
});
test('combine in log-residual space, then exponentiate',()=>{
  const s=sample(60),w=[2,3,4,5,6,7],n=normalize(w);
  const expected=Math.exp(s.trend+s.season+n.reduce((a,v,i)=>a+v*residualForecast(60,i),0));
  assert.equal(forecast(60,w),expected);
  const predictions=models.map((_,i)=>Math.exp(s.trend+s.season+residualForecast(60,i)));
  assert.ok(forecast(60,w)>=Math.min(...predictions));assert.ok(forecast(60,w)<=Math.max(...predictions));
});
test('demo metrics match an independent absolute-error computation',()=>{
  const w=[100,0,0,0,0,0],pairs=Array.from({length:24},(_,i)=>[sample(36+i).price,forecast(36+i,w)]);
  const expected=pairs.reduce((a,[actual,pred])=>a+Math.abs(actual-pred)/actual,0)/24*100;
  assert.ok(Math.abs(demoMetrics(w).mape-expected)<1e-12);
});
test('paper comparisons retain Table 2 values and metric-specific winners',()=>{
  assert.equal(results.length,9);assert.equal(results.find(r=>r.id==='Ensemble O').mape,.025278);
  assert.equal(results.reduce((a,b)=>a.mape<b.mape?a:b).id,'Ensemble O');
  assert.equal(results.reduce((a,b)=>a.rmse<b.rmse?a:b).id,'Ensemble I');
  const esm=results.find(r=>r.id==='ESM');const equal=results.find(r=>r.id==='Ensemble E');assert.ok(equal.mape>esm.mape);
});
