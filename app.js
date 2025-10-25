/* ===============================
   Yan の小宇宙 — 前端互動腳本
   功能：主題切換 / Drawer / 入場顯示 / 表單提示 /
        漂浮貼紙節能 / 相簿篩選 / 燈箱 + 鍵盤左右切換 + 預載
   適用頁面：index.html / notes.html / gallery.html / contact.html
   =============================== */

/* 主題切換（記憶） */
const html=document.documentElement;
const themeBtn=document.getElementById('themeBtn');
const THEME_KEY='yan-theme';
function setTheme(mode){
  if(mode==='dark'){html.classList.add('dark');html.setAttribute('data-theme','dark')}
  else{html.classList.remove('dark');html.setAttribute('data-theme','light')}
  localStorage.setItem(THEME_KEY,mode);
}
(()=>{
  const saved=localStorage.getItem(THEME_KEY);
  if(saved){setTheme(saved)}
  else{
    const prefersDark=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark?'dark':'light');
  }
})();
themeBtn?.addEventListener('click',()=>setTheme(html.classList.contains('dark')?'light':'dark'));

/* Drawer（行動選單） */
const drawer=document.getElementById('drawer'),
      overlay=document.getElementById('overlay'),
      menuBtn=document.getElementById('menuBtn');
function openDrawer(){drawer?.classList.add('open');overlay?.classList.add('show');drawer?.setAttribute('aria-hidden','false')}
function closeDrawer(){drawer?.classList.remove('open');overlay?.classList.remove('show');drawer?.setAttribute('aria-hidden','true')}
if(menuBtn&&drawer&&overlay){
  menuBtn.addEventListener('click',openDrawer);
  overlay.addEventListener('click',closeDrawer);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
}

/* 入場顯示（IntersectionObserver；reduced-motion 自動顯示） */
const prefersReduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const io=!prefersReduce ? new IntersectionObserver(entries=>{
  for(const e of entries){ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } }
},{threshold:.12}) : null;
document.querySelectorAll('.reveal').forEach(el=> io ? io.observe(el) : el.classList.add('show'));

/* 表單提示（可日後換成實際後端或 Google Forms） */
const form=document.getElementById('msgForm');
form?.addEventListener('submit',e=>{
  e.preventDefault();
  const t=document.getElementById('toast');
  if(t){ t.style.display='block'; setTimeout(()=>t.style.display='none',1800); }
  form.reset();
});

/* 年份自動更新 */
const y=document.getElementById('y'); if(y){ y.textContent=new Date().getFullYear(); }

/* 漂浮貼紙（節能：背景/分頁隱藏停止） */
const stickers=document.querySelectorAll('.sticker');
let rafId=null, tick=0, paused=false;
function bob(){
  if(paused || prefersReduce) return;
  tick+=.02;
  stickers.forEach((s,i)=>{
    const yy=Math.sin(tick+(i*1.2))*4, xx=Math.cos(tick+(i*0.9))*3;
    s.style.transform=`translate(${xx}px,${yy}px) rotate(${i===0?-12:i===1?8:5}deg)`;
  });
  rafId=requestAnimationFrame(bob);
}
function startBob(){ if(!rafId && stickers.length && !prefersReduce){ rafId=requestAnimationFrame(bob); } }
function stopBob(){ if(rafId){ cancelAnimationFrame(rafId); rafId=null; } }
document.addEventListener('visibilitychange',()=>{ paused=document.hidden; paused?stopBob():startBob(); });
startBob();

/* 相簿：分類篩選（gallery.html 使用；以 hidden 避免無障礙問題） */
const filterBar=document.getElementById('filters'), gallery=document.getElementById('gallery');
if(filterBar&&gallery){
  filterBar.addEventListener('click',e=>{
    const btn=e.target.closest('[data-filter]'); if(!btn) return;
    filterBar.querySelectorAll('.chip').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const key=btn.getAttribute('data-filter');
    gallery.querySelectorAll('.pin').forEach(item=>{
      if(key==='all'){ item.hidden=false; }
      else{
        const tags=(item.getAttribute('data-tags')||'').split(/\s+/);
        item.hidden=!tags.includes(key);
      }
    });
  },{passive:true});
}

/* 燈箱：<dialog> + 鍵盤左右切換 + 圖片預載（gallery.html 使用） */
const lb=document.getElementById('lightbox'),
      lbImg=document.getElementById('lightbox-img'),
      lbCap=document.getElementById('lightbox-cap'),
      lbClose=document.querySelector('.lightbox-close');
const links=[...document.querySelectorAll('[data-lightbox]')];
let curIdx=-1;

function preload(src){ const i=new Image(); i.src=src; }
function openLB(idx){
  if(!lb||!lbImg||!links.length) return;
  curIdx=Math.max(0,Math.min(idx,links.length-1));
  const a=links[curIdx], src=a.getAttribute('href'), cap=a.getAttribute('data-caption')||'';
  lbImg.src=src; lbImg.alt=cap; if(lbCap) lbCap.textContent=cap;
  lb.showModal(); document.body.style.overflow='hidden';
  const next=links[curIdx+1]?.getAttribute('href'); if(next) preload(next);
}
function closeLB(){ if(lb){ lb.close(); document.body.style.overflow=''; } }
function openByAnchor(a){ openLB(links.indexOf(a)); }

links.forEach(a=> a.addEventListener('click',e=>{ e.preventDefault(); openByAnchor(a); }));
lbClose?.addEventListener('click',closeLB);
/* 點擊遮罩關閉 */
lb?.addEventListener('click',e=>{
  const r=lb.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) closeLB();
});
/* 鍵盤操作 */
document.addEventListener('keydown',e=>{
  if(!lb||!lb.open) return;
  if(e.key==='Escape') return closeLB();
  if(e.key==='ArrowRight') openLB(curIdx+1);
  if(e.key==='ArrowLeft') openLB(curIdx-1);
});

/* 老舊瀏覽器降級（無 IO 時直接顯示） */
(()=>{ if(!('IntersectionObserver' in window)){ document.querySelectorAll('.reveal').forEach(el=>el.classList.add('show')); } })();
