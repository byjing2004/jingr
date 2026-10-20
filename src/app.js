import {models,results,normalize,sample,residualForecast,forecast,demoMetrics} from './model.js';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let weights=Array(6).fill(1),selected=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,phase=0;
const controls=$('#weight-controls');
models.forEach((m,i)=>{
  const row=document.createElement('div');row.className='weight-row';row.style.setProperty('--node-color',m.color);
  row.innerHTML=`<label for="weight-${i}"><span class="color-dot"></span>${m.id}</label><output id="output-${i}" for="weight-${i}"></output><input id="weight-${i}" aria-label="${m.id} raw influence" type="range" min="0" max="100" step="1" value="50">`;
  row.querySelector('input').addEventListener('input',e=>{weights[i]=Number(e.target.value);setPreset('custom');selectModel(i);update();});
  row.querySelector('label').addEventListener('click',()=>selectModel(i));controls.append(row);
  const button=document.createElement('button');button.className='orbit-label';button.style.setProperty('--node-color',m.color);button.innerHTML=`<span></span>${m.id} <small></small>`;button.setAttribute('aria-label',`Explore ${m.name}`);button.addEventListener('click',()=>selectModel(i));$('#orbit-labels').append(button);
});
function selectModel(i){selected=i;const m=models[i];$('#model-name').textContent=m.name;$('#model-description').textContent=m.description;$('#model-formula').textContent=m.formula;$('#insight-dot').style.setProperty('--node-color',m.color);$$('.orbit-label').forEach((b,j)=>b.classList.toggle('selected',i===j));}
function setPreset(name){$$('[data-preset]').forEach(b=>b.classList.toggle('selected',b.dataset.preset===name));}
$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.preset==='custom'){setPreset('custom');return;}weights=b.dataset.preset==='equal'?Array(6).fill(50):[15,15,100,10,10,15];setPreset(b.dataset.preset);update();}));
$('#reset').addEventListener('click',()=>{weights=Array(6).fill(50);setPreset('equal');selectModel(0);update();});
function update(){
  const w=normalize(weights);
  w.forEach((v,i)=>{const input=$(`#weight-${i}`);input.value=weights[i];input.style.setProperty('--fill',`${weights[i]}%`);$(`#output-${i}`).textContent=(v*100).toFixed(1)+'%';$$('.orbit-label')[i].querySelector('small').textContent=Math.round(v*100)+'%';});
  $('#total-weight').textContent=weights.every(w=>w===0)?'100% · equal fallback':'100.0%';
  const next=forecast(60,weights).toFixed(2);$('#central-price').textContent=next;$('#next-price').textContent=next;
  const metric=demoMetrics(weights);$('#demo-mape').textContent=metric.mape.toFixed(2)+'%';$('#math-mape').textContent=metric.mape.toFixed(2)+'%';
  $('#weight-equation').innerHTML=w.map((v,i)=>`<span style="color:${models[i].color}">${v.toFixed(3)} × ${residualForecast(60,i).toFixed(4)}</span>`).join(' +<br>')+`<br><strong>= ${w.reduce((a,v,i)=>a+v*residualForecast(60,i),0).toFixed(5)} (log residual)</strong>`;
  drawChart();
}
function showView(name,scroll=false){$$('.view').forEach(v=>v.classList.toggle('active',v.id===name));$$('.tab').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name));});if(scroll)$('.workspace-top').scrollIntoView({behavior:'smooth',block:'start'});if(name==='observatory')resize();}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go,true)));
$('#source-link').addEventListener('click',()=>{showView('research');$('#citation').scrollIntoView({behavior:'smooth'});});
const canvas=$('#space'),ctx=canvas.getContext('2d');let width=800,height=565;
function resize(){const r=canvas.getBoundingClientRect();if(!r.width)return;width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);paint();}
const stars=Array.from({length:145},(_,i)=>({x:((Math.sin(i*127.1+3)*43758.5453)%1+1)%1,y:((Math.sin(i*311.7+7)*12731.919)%1+1)%1,r:i%9===0?1:.5}));
function orbit(angle,r){const rot=-.22,x=Math.cos(angle)*r,y=Math.sin(angle)*r*(width<500?.78:.42);return [width*.5+x*Math.cos(rot)-y*Math.sin(rot),height*.47+x*Math.sin(rot)+y*Math.cos(rot)];}
function paint(){
  ctx.clearRect(0,0,width,height);
  for(const s of stars){ctx.fillStyle=s.r===1?'#8eabb666':'#6d8d9d55';ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill();}
  const cx=width*.5,cy=height*.47,radius=Math.min(width*.34,height*.52),core=Math.min(79,width*.15);
  // Dim projected orbital planes give depth without requiring a WebGL runtime.
  for(let k=0;k<5;k++){ctx.strokeStyle=k===3?'#456b6d55':'#34495555';ctx.lineWidth=.65;ctx.beginPath();for(let j=0;j<=120;j++){const [x,y]=orbit(j/120*Math.PI*2,radius*(.57+k*.17));j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.22);ctx.strokeStyle='#4e74752b';ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(-radius*1.4,0);ctx.lineTo(radius*1.4,0);ctx.moveTo(0,-radius*.7);ctx.lineTo(0,radius*.7);ctx.stroke();ctx.restore();
  const normalized=normalize(weights);
  const positions=models.map((_,i)=>orbit(i/6*Math.PI*2+phase-.7,radius*(i%2===0?1.13:.88)));
  positions.forEach(([x,y],i)=>{const strength=normalized[i];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx,cy);ctx.strokeStyle=models[i].color+(i===selected?'66':'24');ctx.lineWidth=.5+strength*2;ctx.stroke();for(let j=0;j<3;j++){const t=((phase*1.9+j/3+i*.1)%1+1)%1;ctx.beginPath();ctx.arc(x+(cx-x)*t,y+(cy-y)*t,1.4,0,Math.PI*2);ctx.fillStyle=models[i].color+'a0';ctx.fill();}});
  const halo=ctx.createRadialGradient(cx,cy,core*.4,cx,cy,core*1.9);halo.addColorStop(0,'#82e5bc22');halo.addColorStop(.6,'#62c4ac0b');halo.addColorStop(1,'#62c4ac00');ctx.fillStyle=halo;ctx.fillRect(cx-core*2,cy-core*2,core*4,core*4);
  const globe=ctx.createRadialGradient(cx-core*.4,cy-core*.5,0,cx,cy,core);globe.addColorStop(0,'#264f4c');globe.addColorStop(.5,'#173c3b');globe.addColorStop(1,'#0a1c24');ctx.beginPath();ctx.arc(cx,cy,core,0,Math.PI*2);ctx.fillStyle=globe;ctx.fill();ctx.strokeStyle='#9ad9bb77';ctx.lineWidth=1;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,core-1,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#a2e8cd16';ctx.lineWidth=.6;
  for(let j=-2;j<=2;j++){ctx.beginPath();ctx.ellipse(cx,cy+j*core*.32,core,core*.17,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,cy,core*(.2+Math.abs(j)*.3),core,.25,0,Math.PI*2);ctx.stroke();}ctx.restore();
  positions.forEach(([x,y],i)=>{const color=models[i].color,r=5+normalized[i]*16;const glow=ctx.createRadialGradient(x,y,0,x,y,r*3);glow.addColorStop(0,color+'55');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r*.55,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color+'55';ctx.beginPath();ctx.arc(x,y,r+4,0,Math.PI*2);ctx.stroke();
    const label=$$('.orbit-label')[i];label.style.left=Math.max(48,Math.min(width-48,x))+'px';label.style.top=Math.max(70,Math.min(height-55,y+(y<cy?-25:25)))+'px';});
}
new ResizeObserver(resize).observe(canvas.parentElement);
let orbitInteracting=false;
$$('.orbit-label').forEach(button=>{button.addEventListener('pointerenter',()=>orbitInteracting=true);button.addEventListener('pointerleave',()=>orbitInteracting=false);button.addEventListener('focus',()=>orbitInteracting=true);button.addEventListener('blur',()=>orbitInteracting=false);});
let last=0;function animate(time){if(last&&!paused&&!orbitInteracting&&$('#observatory').classList.contains('active')&&!document.hidden)phase+=Math.min((time-last)/1000,.1)*.027;last=time;if($('#observatory').classList.contains('active'))paint();requestAnimationFrame(animate);}requestAnimationFrame(animate);
function motionLabel(){$('#motion').textContent=paused?'▷ Resume motion':'II Pause motion';$('#motion').setAttribute('aria-label',paused?'Resume orbital animation':'Pause orbital animation');}
$('#motion').addEventListener('click',()=>{paused=!paused;motionLabel();});motionLabel();
const svgNS='http://www.w3.org/2000/svg';function element(name,attrs,text){const e=document.createElementNS(svgNS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
const X=t=>48+(t/60)*924,Y=p=>180-(p-5.5)/3.2*152;
function path(points){return points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');}
function drawChart(){
 const svg=$('#forecast-chart');svg.replaceChildren();
 svg.append(element('rect',{x:X(36),y:18,width:X(60)-X(36),height:162,fill:'#b5e9d204'}));
 [6,7,8].forEach(v=>{svg.append(element('line',{x1:48,y1:Y(v),x2:972,y2:Y(v),stroke:'#23343e','stroke-width':.6}));svg.append(element('text',{x:30,y:Y(v)+3,'text-anchor':'end'},v.toFixed(1)));});
 svg.append(element('text',{x:48,y:13},'ILLUSTRATIVE PRICE INDEX'));
 [0,12,24,36,48,60].forEach(t=>svg.append(element('text',{x:X(t),y:208,'text-anchor':t===0?'start':t===60?'end':'middle'},t===60?'NEXT':`MONTH ${t+1}`)));
 svg.append(element('line',{x1:X(36),y1:24,x2:X(36),y2:185,stroke:'#526b77','stroke-dasharray':'3 5','stroke-width':.7}));svg.append(element('text',{x:X(36)+8,y:30},'ONE-STEP DEMONSTRATION →'));
 models.forEach((m,i)=>svg.append(element('path',{d:path(Array.from({length:25},(_,j)=>{const t=36+j,s=sample(t);return [X(t),Y(Math.exp(s.trend+s.season+residualForecast(t,i)))];})),fill:'none',stroke:m.color,'stroke-opacity':.24,'stroke-width':1})));
 svg.append(element('path',{d:path(Array.from({length:60},(_,t)=>[X(t),Y(sample(t).price)])),fill:'none',stroke:'#d6e0e8','stroke-width':1.5}));
 svg.append(element('path',{d:path(Array.from({length:25},(_,j)=>[X(36+j),Y(forecast(36+j,weights))])),fill:'none',stroke:'#b5e9d2','stroke-width':2}));
 svg.append(element('circle',{cx:X(60),cy:Y(forecast(60,weights)),r:3,fill:'#b5e9d2'}));
}
$('#forecast-chart').addEventListener('pointermove',e=>{const r=e.currentTarget.getBoundingClientRect(),t=Math.max(0,Math.min(60,Math.round(((e.clientX-r.left)/r.width*1000-48)/924*60)));const tip=$('#chart-tooltip');tip.hidden=false;tip.textContent=t<36?`Month ${t+1} · example ${sample(t).price.toFixed(2)}`:t===60?`Next · ensemble ${forecast(t,weights).toFixed(2)}`:`Month ${t+1} · observed ${sample(t).price.toFixed(2)} · ensemble ${forecast(t,weights).toFixed(2)}`;tip.style.left=Math.min(55,Math.max(2,(e.clientX-r.left)/r.width*70))+'%';});
$('#forecast-chart').addEventListener('pointerleave',()=>$('#chart-tooltip').hidden=true);
function drawDecomposition(){const svg=$('#decomposition');svg.replaceChildren();const on=Object.fromEntries($$('[data-component]').map(c=>[c.dataset.component,c.checked]));[0,1,2,3].forEach(i=>svg.append(element('line',{x1:10,y1:25+i*40,x2:540,y2:25+i*40,stroke:'#263843','stroke-width':.5})));const points=Array.from({length:60},(_,t)=>{const s=sample(t);return [10+t*530/59,150-((on.trend?s.trend-1.7:0)+(on.season?s.season:0)+(on.residual?s.residual:0))/.38*115];});svg.append(element('path',{d:path(points),fill:'none',stroke:'#b5e9d2','stroke-width':2}));svg.append(element('text',{x:10,y:175},'MONTH 1'));svg.append(element('text',{x:540,y:175,'text-anchor':'end'},'MONTH 60'));}
$$('[data-component]').forEach(c=>c.addEventListener('change',drawDecomposition));
function drawResults(){const metric=$('#metric').value,scale=metric==='mape'?100:1,max=Math.max(...results.map(r=>r[metric])),best=Math.min(...results.map(r=>r[metric]));$('#results-bars').innerHTML=results.map(r=>`<div class="result-row ${r[metric]===best?'best':''} ${r.id.startsWith('Ensemble')?'ensemble-row':''}"><span>${r.id}${r[metric]===best?' ✧':''}</span><div class="result-bar-track"><div class="result-bar" style="width:${r[metric]/max*100}%"></div></div><output>${(r[metric]*scale).toFixed(metric==='mape'?4:6)}${metric==='mape'?'%':''}</output></div>`).join('');}
$('#metric').addEventListener('change',drawResults);
const slides=[
 ['Can mathematics see the next month?','Electricity prices change with many interacting conditions. This paper studies one-month-ahead forecasting for Peru using monthly prices from 2001 to 2022. Our question: can combining different forecasts improve accuracy?','Open with the glowing ensemble: six models, one combined prediction.','observatory'],
 ['Separate the signal from the noise.','First take logarithms, then estimate a nonlinear trend and annual seasonality. Subtract those patterns to obtain the residual. Six models forecast this remaining short-term component.','Open “The mathematics” and toggle the decomposition layers.','math'],
 ['Six perspectives. One forecast.','The ensemble is a weighted sum of residual forecasts. The paper compares equal weights, training-based weights, and validation-based weights. Better validation performance receives greater influence.','In the Observatory, switch from Equal to Favor ESM. Explain that these are educational weights, not the paper’s fitted values.','observatory'],
 ['Validation weighting helped—but averaging is not magic.','Table 2 reports a MAPE of 2.5278% for Ensemble O, versus 3.1869% for ESM: a 20.68% relative reduction. Equal weighting is worse than ESM. Combining models does not guarantee improvement.','Show the reported MAPE bars. Switch to RMSE: Ensemble I is best in Table 2.','research'],
 ['The bridge to renewable energy.','Forecasts can help plan electricity purchases, battery schedules, and renewable energy revenue. The authors propose weather and demand inputs as future work. This study does not yet optimize PV or storage.','Close with a possible next project: forecast prices, then optimize battery charging under uncertainty.','research'],
 ['Be precise about the evidence.','The demo uses synthetic data. Published results come from Table 2. The paper has inconsistent split counts and RMSE entries; it does not establish that Ensemble O wins every metric or always works best in other markets.','Cite Gonzales, Iftikhar & López-Gonzales (2024), DOI 10.3934/math.20241067.','research']
];
let slide=0;function drawSlide(){const [title,body,action,view]=slides[slide];$('#slide-content').innerHTML=`<h2>${title}</h2><p>${body}</p><p class="speaker-action">${action}</p>`;$('#slide-counter').textContent=`${slide+1} / ${slides.length}`;$('#previous-slide').disabled=slide===0;$('#next-slide').textContent=slide===slides.length-1?'Finish ✓':'Next →';showView(view);}
$('#present').addEventListener('click',()=>{slide=0;drawSlide();$('#presentation').showModal();});$('#close-presentation').addEventListener('click',()=>$('#presentation').close());$('#previous-slide').addEventListener('click',()=>{if(slide>0){slide--;drawSlide();}});$('#next-slide').addEventListener('click',()=>{if(slide===slides.length-1){$('#presentation').close();return;}slide++;drawSlide();});
$('#presentation').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('#next-slide').click();}if(e.key==='ArrowLeft'){e.preventDefault();$('#previous-slide').click();}});
weights=Array(6).fill(50);selectModel(0);update();drawDecomposition();drawResults();showView('observatory');resize();
