/* ===============================
   Yan の小宇宙 — 前端互動腳本（最終優化版）
   功能：
   - 主題切換（記憶）
   - Drawer（行動選單）
   - Scroll reveal
   - 表單提示
   - 年份自動更新
   - Hero 貼紙浮動（節能）
   - 相簿：篩選 + 燈箱 <dialog>
   - ★ 背景漂浮 Emoji（可愛風，效能優化）
   =============================== */

/* ---------- 主題切換（記憶） ---------- */
const html = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const THEME_KEY = 'yan-theme';

function setTheme(mode){
  if(mode==='dark'){ html.classList.add('dark'); html.setAttribute('data-theme','dark'); }
  else{ html.classList.remove('dark'); html.setAttribute('data-theme','light'); }
  try{ localStorage.setItem(THEME_KEY, mode); }catch{}
}
(()=>{ // init
  const saved = (()=>{ try{ return localStorage.getItem(THEME_KEY); }catch{ return null; }})();
  if(saved){ setTheme(saved); }
  else{
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
})();
themeBtn?.addEventListener('click', ()=> setTheme(html.classList.contains('dark') ? 'light' : 'dark'));

/* ---------- Drawer ---------- */
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
function openDrawer(){ drawer?.classList.add('open'); overlay?.classList.add('show'); drawer?.setAttribute('aria-hidden','false'); }
function closeDrawer(){ drawer?.classList.remove('open'); overlay?.classList.remove('show'); drawer?.setAttribute('aria-hidden','true'); }
if(menuBtn && drawer && overlay){
  menuBtn.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });
}

/* ---------- Scroll reveal ---------- */
const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const io = !prefersReduce ? new IntersectionObserver(entries=>{
  for(const e of entries){ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } }
},{threshold:.12}) : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('show'));

/* ---------- 表單提示 ---------- */
const form = document.getElementById('msgForm');
form?.addEventListener('submit', e=>{
  e.preventDefault();
  const t = document.getElementById('toast');
  if(t){ t.style.display='block'; setTimeout(()=> t.style.display='none', 1800); }
  form.reset();
});

/* ---------- 年份 ---------- */
const y = document.getElementById('y');
if(y) y.textContent = new Date().getFullYear();

/* ---------- Hero 漂浮貼紙（節能） ---------- */
const stickers = document.querySelectorAll('.sticker');
let rafIdSticker = null, tick = 0, pausedSticker = false;
function bob(){
  if(pausedSticker || prefersReduce) return;
  tick += .02;
  stickers.forEach((s,i)=>{
    const yy = Math.sin(tick + i*1.2) * 4;
    const xx = Math.cos(tick + i*0.9) * 3;
    s.style.transform = `translate(${xx}px,${yy}px) rotate(${i===0?-12:i===1?8:5}deg)`;
  });
  rafIdSticker = requestAnimationFrame(bob);
}
function startBob(){ if(!rafIdSticker && stickers.length && !prefersReduce) rafIdSticker = requestAnimationFrame(bob); }
function stopBob(){ if(rafIdSticker){ cancelAnimationFrame(rafIdSticker); rafIdSticker = null; } }
document.addEventListener('visibilitychange', ()=>{ pausedSticker = document.hidden; pausedSticker ? stopBob() : startBob(); });
startBob();

/* ---------- 相簿：分類篩選 ---------- */
const filterBar = document.getElementById('filters');
const gallery = document.getElementById('gallery');
if(filterBar && gallery){
  filterBar.addEventListener('click', e=>{
    const btn = e.target.closest('[data-filter]');
    if(!btn) return;
    filterBar.querySelectorAll('.chip').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const key = btn.getAttribute('data-filter');
    gallery.querySelectorAll('.pin').forEach(item=>{
      if(key==='all'){ item.hidden = false; }
      else{
        const tags = (item.getAttribute('data-tags') || '').split(/\s+/);
        item.hidden = !tags.includes(key);
      }
    });
  }, {passive:true});
}

/* ---------- 燈箱：<dialog> + 鍵盤左右 + 預載 ---------- */
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbCap = document.getElementById('lightbox-cap');
const lbClose = document.querySelector('.lightbox-close');
const links = [...document.querySelectorAll('[data-lightbox]')];
let curIdx = -1;
function preload(src){ const i = new Image(); i.src = src; }
function openLB(idx){
  if(!lb || !lbImg || !links.length) return;
  curIdx = Math.max(0, Math.min(idx, links.length-1));
  const a = links[curIdx];
  const src = a.getAttribute('href');
  const cap = a.getAttribute('data-caption') || '';
  lbImg.src = src; lbImg.alt = cap; if(lbCap) lbCap.textContent = cap;
  lb.showModal(); document.body.style.overflow = 'hidden';
  const next = links[curIdx+1]?.getAttribute('href'); if(next) preload(next);
}
function closeLB(){ if(lb){ lb.close(); document.body.style.overflow = ''; } }
function openByAnchor(a){ openLB(links.indexOf(a)); }
links.forEach(a => a.addEventListener('click', e=>{ e.preventDefault(); openByAnchor(a); }));
lbClose?.addEventListener('click', closeLB);
lb?.addEventListener('click', e=>{
  const r = lb.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) closeLB();
});
document.addEventListener('keydown', e=>{
  if(!lb || !lb.open) return;
  if(e.key==='Escape') return closeLB();
  if(e.key==='ArrowRight') openLB(curIdx+1);
  if(e.key==='ArrowLeft') openLB(curIdx-1);
});

/* ==========================================================
   ★ 背景漂浮 Emoji（Canvas 粒子引擎）
   - 自動插入 fixed canvas（pointer-events: none）
   - 深/淺色主題自動調整透明度
   - reduced motion：改為靜態、輕量模式
   ========================================================== */
(function initBGEmoji(){
  const EMOJI_SET = ['🧠','📚','🎒','🌸','✨','📘','🍡','💡','🗒️','🎀'];
  const MAX_PARTICLES_BASE = 26;          // 基礎數量（會依裝置寬度調整）
  const SPEED = 12;                        // 基本速度（px/s，會乘縮放）
  const SCALE_MIN = 0.8, SCALE_MAX = 1.4;  // 尺寸倍率
  const OPACITY_LIGHT = 0.25, OPACITY_DARK = 0.18; // 主題透明
  const Z_INDEX = 0; // 放在內容後面

  // 建 canvas（放在 body 第一層，當背景）
  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d');
  Object.assign(cvs.style, {
    position: 'fixed', inset: '0', zIndex: String(Z_INDEX),
    pointerEvents: 'none', opacity: '1'
  });
  document.body.prepend(cvs);

  let W=0, H=0, DPR=1, running=false, particles=[], pool=[];
  let lastT = performance.now();

  function rnd(a,b){ return Math.random()*(b-a)+a; }
  const themeOpacity = ()=> html.classList.contains('dark') ? OPACITY_DARK : OPACITY_LIGHT;

  function resize(){
    DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    W = Math.floor(innerWidth);
    H = Math.floor(innerHeight);
    cvs.width = Math.floor(W * DPR);
    cvs.height = Math.floor(H * DPR);
    cvs.style.width = W+'px';
    cvs.style.height = H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  // 粒子
  function spawn(x, y){
    const p = pool.pop() || {};
    p.x = x ?? rnd(-W*0.1, W*1.1);
    p.y = y ?? rnd(-H*0.1, H*1.1);
    // 往上/右為主，輕微抖動
    const dir = Math.random() < 0.5 ? 1 : -1;
    p.vx = rnd(4, 10) * dir;
    p.vy = rnd(-18, -8);
    p.r = rnd(SCALE_MIN, SCALE_MAX);
    p.emoji = EMOJI_SET[(Math.random()*EMOJI_SET.length)|0];
    p.rot = rnd(-10, 10);
    p.spin = rnd(-8, 8);
    p.alpha = themeOpacity();
    p.life = rnd(10, 18); // seconds
    p.age = 0;
    return p;
  }

  function populate(){
    particles.length = 0;
    const target = Math.round(MAX_PARTICLES_BASE * (W/1200 + H/900) * (prefersReduce?0.4:1));
    for(let i=0;i<target;i++) particles.push(spawn());
  }

  function step(t){
    if(!running) return;
    const dt = Math.min(0.05, (t - lastT)/1000); // 秒
    lastT = t;

    // 清
    ctx.clearRect(0,0,W,H);

    const opa = themeOpacity();

    for(let i=particles.length-1; i>=0; i--){
      const p = particles[i];
      // 物理
      p.x += (p.vx * dt);
      p.y += (p.vy * dt);
      p.vy += (SPEED * 0.6 * dt);      // 緩重力
      p.rot += p.spin * dt;
      p.age += dt;

      // 界外或壽命結束 → 循環到底部
      if(p.y < -120 || p.x < -160 || p.x > W+160 || p.age > p.life){
        // 重生到下方邊界
        pool.push(particles.splice(i,1)[0]);
        particles.push(spawn(rnd(-W*0.1, W*1.1), H + rnd(20,120)));
        continue;
      }

      // 繪
      ctx.save();
      ctx.globalAlpha = opa * (prefersReduce ? 0.7 : 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI/180);
      ctx.font = `${18 * p.r}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(step);
  }

  function start(){
    if(prefersReduce){
      // 靜態淡淡的背景：只擺放，不跑動畫
      resize(); populate();
      ctx.clearRect(0,0,W,H);
      const opa = themeOpacity();
      particles.forEach(p=>{
        ctx.save();
        ctx.globalAlpha = opa * 0.6;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI/180);
        ctx.font = `${18 * p.r}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      });
      return;
    }
    if(running) return;
    resize(); populate();
    lastT = performance.now();
    running = true;
    requestAnimationFrame(step);
  }
  function stop(){ running = false; }

  // 事件
  window.addEventListener('resize', ()=>{
    resize();
    // 依主題/大小重繪
    if(prefersReduce){
      start(); // 會重畫靜態
    }
  });
  // 主題切換時，更新透明度
  const themeObs = new MutationObserver(start);
  themeObs.observe(html, { attributes:true, attributeFilter:['class','data-theme'] });

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) stop(); else start();
  });

  // 初始化
  start();
})();

/* ---------- 老舊瀏覽器降級 ---------- */
(()=>{ if(!('IntersectionObserver' in window)){ document.querySelectorAll('.reveal').forEach(el=>el.classList.add('show')); } })();
