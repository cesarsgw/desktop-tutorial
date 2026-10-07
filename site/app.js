const $=s=>document.querySelector(s);
const fmt=(n,d=2)=>n==null?'—':n.toLocaleString('fr-FR',{maximumFractionDigits:d});
const usd=n=>n==null?'—':'$'+(n>=1e12?fmt(n/1e12)+' T':n>=1e9?fmt(n/1e9)+' Md':fmt(n));
const cls=v=>v>=0?'up':'dn', sgn=v=>(v>=0?'+':'')+fmt(v)+'%';

/* ---- liquid metaball canvas ---- */
const cv=$('#liquid'),cx=cv.getContext('2d');let W,H;
const cols=['#00e5ff','#7c4dff','#ff3d9a','#2dffa6'];
const balls=Array.from({length:9},(_,i)=>({x:Math.random(),y:Math.random(),r:90+Math.random()*130,vx:(Math.random()-.5)*.0007,vy:(Math.random()-.5)*.0007,c:cols[i%4]}));
const mouse={x:.5,y:.5};
function rs(){W=cv.width=innerWidth/2;H=cv.height=innerHeight/2}rs();addEventListener('resize',rs);
(function loop(t){
  cx.clearRect(0,0,W,H);cx.globalAlpha=.55;
  for(const b of balls){
    b.x+=b.vx+Math.sin(t/3000+b.r)*.0004;b.y+=b.vy+Math.cos(t/2600+b.r)*.0004;
    const dx=mouse.x-b.x,dy=mouse.y-b.y,d=Math.hypot(dx,dy);if(d<.25){b.x-=dx*.01;b.y-=dy*.01}
    if(b.x<0||b.x>1)b.vx*=-1;if(b.y<0||b.y>1)b.vy*=-1;
    const R=b.r/2,x=b.x*W,y=b.y*H,g=cx.createRadialGradient(x,y,0,x,y,R);
    g.addColorStop(0,b.c);g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,R,0,7);cx.fill();
  }
  requestAnimationFrame(loop)
})(0);

/* ---- cursor + wave + reveal ---- */
const cur=$('#cursor');
addEventListener('pointermove',e=>{mouse.x=e.clientX/innerWidth;mouse.y=e.clientY/innerHeight;cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px'});
document.addEventListener('pointerover',e=>cur.classList.toggle('big',!!e.target.closest('.glass,a')));
const w1=$('#w1');
(function wv(t){const a=Math.sin(t/900)*40,b=Math.cos(t/1200)*50;
  w1.setAttribute('d',`M0,60 C360,${60+a+50} 1080,${60+b-50} 1440,60 L1440,120 L0,120Z`);requestAnimationFrame(wv)})(0);
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.15});
const watch=()=>document.querySelectorAll('.rv:not(.in)').forEach(el=>io.observe(el));watch();

/* ---- count-up ---- */
function count(el,to,f){const s=performance.now(),from=+el.dataset.v||0;el.dataset.v=to;
  (function st(n){const k=Math.min(1,(n-s)/900),e=1-Math.pow(1-k,3);el.textContent=f(from+(to-from)*e);k<1&&requestAnimationFrame(st)})(s)}

/* ---- sparkline ---- */
function spark(a,up){if(!a||!a.length)return'';const mn=Math.min(...a),mx=Math.max(...a),p=a.map((v,i)=>`${i/(a.length-1)*200},${46-(v-mn)/(mx-mn||1)*42-2}`).join(' ');
  const c=up?'#2dffa6':'#ff4d6d';return`<svg viewBox="0 0 200 46" preserveAspectRatio="none"><polyline points="${p}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/></svg>`}

/* ---- live crypto (CoinGecko) ---- */
const G=['#f7931a','#627eea','#26a17b','#f3ba2f','#00e5ff','#7c4dff','#ff3d9a','#2dffa6'];
async function crypto(){
  try{
    const r=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&sparkline=true&price_change_percentage=24h');
    const d=await r.json();if(!Array.isArray(d))throw 0;
    const box=$('#coins');
    if(!box.children.length)box.innerHTML=d.map((c,i)=>`<div class="glass coin rv" style="--g:${G[i%8]}" id="c-${c.id}"><h3><img src="${c.image}" alt="">${c.name} <small>${c.symbol.toUpperCase()}</small></h3><div class="p"></div><div class="v"></div><div class="s"></div></div>`).join('');
    d.forEach(c=>{const el=$('#c-'+c.id);if(!el)return;const p=el.querySelector('.p'),old=+p.dataset.v;
      count(p,c.current_price,v=>'$'+fmt(v,v<1?4:2));if(old&&old!==c.current_price){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
      const v=c.price_change_percentage_24h;el.querySelector('.v').innerHTML=`<b class="${cls(v)}">${sgn(v)}</b> 24h`;
      el.querySelector('.s').innerHTML=spark(c.sparkline_in_7d?.price,v>=0)});
    $('#ticker').innerHTML=(h=>h+h)(d.map(c=>`<span>${c.symbol.toUpperCase()} $${fmt(c.current_price,c.current_price<1?4:2)} <b class="${cls(c.price_change_percentage_24h)}">${sgn(c.price_change_percentage_24h)}</b></span>`).join(''));
    watch();
    $('#upd').textContent='maj '+new Date().toLocaleTimeString('fr-FR');
  }catch(e){$('#upd').textContent='API indispo (réessai…)'}
  try{
    const g=(await (await fetch('https://api.coingecko.com/api/v3/global')).json()).data;
    count($('#mcap'),g.total_market_cap.usd,usd);count($('#vol'),g.total_volume.usd,usd);count($('#dom'),g.market_cap_percentage.btc,v=>fmt(v,1)+'%');
  }catch(e){}
  try{const f=(await (await fetch('https://api.alternative.me/fng/')).json()).data[0];$('#fng').textContent=f.value+' · '+f.value_classification}catch(e){}
}
crypto();setInterval(crypto,60000);

/* ---- recaps + indices (data/recaps.json, à actualiser) ---- */
fetch('data/recaps.json?'+Date.now()).then(r=>r.json()).then(({recaps})=>{
  $('#timeline').innerHTML=recaps.map(r=>`<article class="glass rc rv"><time>${new Date(r.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</time><h3>${r.titre}</h3><div class="cols"><div><b>Crypto</b><p>${r.crypto}</p></div><div><b>Bourse</b><p>${r.bourse}</p></div></div><div class="chips">${r.chiffres.map(c=>`<span class="chip">${c.nom} ${c.val} <b class="${cls(c.var)}">${sgn(c.var)}</b></span>`).join('')}</div></article>`).join('');
  const last=recaps[0];
  $('#indices').innerHTML=last.chiffres.filter(c=>!['BTC','ETH'].includes(c.nom)).map((c,i)=>`<div class="glass coin rv" style="--g:${G[i+4]}"><h3>${c.nom}</h3><div class="p">${c.val}</div><b class="${cls(c.var)}">${sgn(c.var)}</b></div>`).join('');
  watch();
});

/* ---- partenaires (data/partners.json) ---- */
fetch('data/partners.json?'+Date.now()).then(r=>r.json()).then(({partners})=>{
  $('#partners').innerHTML=partners.map(p=>`<a class="glass coin partner rv" style="--g:${p.couleur}" href="${p.url}" target="_blank" rel="sponsored noopener"><span class="tag">Pub</span><h3>${p.nom}</h3><p>${p.desc}</p><b class="go">Découvrir →</b></a>`).join('');
  watch();
});
