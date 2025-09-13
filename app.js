/* app.js — subtle effects + carousel */
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  initCanvas();
  initScroll();
  revealOnScroll();
  initMagneticButtons();
  initCasesCarousel();
});

function prefersReducedMotion(){ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function setYear(){ const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear(); }

function initCanvas(){
  if(prefersReducedMotion()) return;
  const canvas=document.getElementById('dust'); if(!canvas) return;
  const ctx=canvas.getContext('2d',{alpha:true});
  let width=canvas.offsetWidth, height=canvas.offsetHeight;
  const DPR=Math.min(window.devicePixelRatio||1,2);
  canvas.width=width*DPR; canvas.height=height*DPR; ctx.scale(DPR,DPR);
  const DIGITS='0123456789'.split('');
  const COUNT=Math.floor((width*height)/32000);
  const LINE_COUNT=Math.max(6,Math.floor(COUNT*0.1));
  const particles=[], lines=[];
  const rand=(min,max)=>Math.random()*(max-min)+min;
  const lerp=(a,b,t)=>a+(b-a)*t;
  let mouse={x:width/2,y:height/2}, parallax={x:0,y:0};
  for(let i=0;i<COUNT;i++){ particles.push({x:rand(0,width),y:rand(0,height),z:rand(0.3,1),v:rand(0.15,0.45),glyph:DIGITS[(Math.random()*DIGITS.length)|0],alpha:rand(0.08,0.22),size:rand(10,22)}); }
  for(let i=0;i<LINE_COUNT;i++){ lines.push({x:rand(0,width),y:rand(0,height),len:rand(24,90),dir:Math.random()>0.5?1:-1,speed:rand(0.08,0.25),alpha:rand(0.04,0.1)}); }
  let resizeTimeout=0;
  window.addEventListener('resize',()=>{ clearTimeout(resizeTimeout); resizeTimeout=setTimeout(()=>{ width=canvas.offsetWidth;height=canvas.offsetHeight; canvas.width=width*DPR;canvas.height=height*DPR;ctx.scale(DPR,DPR); },150); });
  window.addEventListener('pointermove',(e)=>{ const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; },{passive:true});
  let rafId=null;
  function frame(){
    ctx.clearRect(0,0,width,height);
    const tx=(mouse.x-width/2)*0.015, ty=(mouse.y-height/2)*0.015;
    parallax.x=lerp(parallax.x,tx,0.04); parallax.y=lerp(parallax.y,ty,0.04);
    ctx.save(); ctx.fillStyle='#E8E9ED';
    for(const p of particles){ const px=p.x+parallax.x*(1-p.z), py=p.y+parallax.y*(1-p.z);
      ctx.globalAlpha=p.alpha; ctx.font=`${p.size}px "Manrope", system-ui, sans-serif`; ctx.fillText(p.glyph,px,py);
      p.y+=p.v*p.z; if(p.y>height+24){ p.y=-24; p.x=rand(0,width); p.glyph=DIGITS[(Math.random()*DIGITS.length)|0]; } }
    ctx.restore();
    ctx.save(); ctx.strokeStyle='#E8E9ED'; ctx.lineWidth=1;
    for(const l of lines){ ctx.globalAlpha=l.alpha; const x1=l.x+parallax.x*0.35, y1=l.y+parallax.y*0.35; const x2=x1+l.len*0.8*l.dir, y2=y1+l.len*0.18;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); l.y+=l.speed; if(l.y>height+10){ l.y=-10; l.x=rand(0,width); } }
    ctx.restore();
    rafId=requestAnimationFrame(frame);
  }
  frame(); document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelAnimationFrame(rafId); else frame(); });
}

function initScroll(){
  const toTop=document.querySelector('.to-top');
  document.addEventListener('click',(e)=>{
    const a=e.target.closest('a[href^="#"]'); if(!a) return;
    const id=a.getAttribute('href'); if(id.length>1){ const el=document.querySelector(id);
      if(el){ e.preventDefault(); el.scrollIntoView({behavior: prefersReducedMotion()?'auto':'smooth', block:'start'}); history.pushState(null,'',id); } }
  });
  const halfway=()=>{ const h=document.documentElement.scrollHeight-window.innerHeight; return window.scrollY>h*0.5; };
  const onScroll=()=>{ if(!toTop) return; toTop.classList.toggle('is-visible',halfway()); };
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  if(toTop){ toTop.addEventListener('click',()=>{ window.scrollTo({top:0,behavior: prefersReducedMotion()?'auto':'smooth'}); }); }
}

function revealOnScroll(){
  const els=document.querySelectorAll('.reveal');
  if(!els.length || prefersReducedMotion()){ els.forEach(el=>el.classList.add('is-visible')); return; }
  const io=new IntersectionObserver((entries)=>{ entries.forEach((en)=>{ if(en.isIntersecting){ en.target.classList.add('is-visible'); io.unobserve(en.target); } }); },{rootMargin:'0px 0px -10% 0px', threshold:0.15});
  els.forEach(el=>io.observe(el));
}

function initMagneticButtons(){
  const buttons=document.querySelectorAll('.btn--magnetic'); if(!buttons.length) return;
  const strength=16; const reset=(btn)=>{ btn.style.transform=''; btn.style.boxShadow=''; };
  buttons.forEach(btn=>{
    const onMove=(e)=>{ const r=btn.getBoundingClientRect(); const rx=e.clientX-r.left, ry=e.clientY-r.top; const mx=(rx/r.width-0.5)*strength, my=(ry/r.height-0.5)*strength;
      btn.style.transform=`translate(${mx}px, ${my}px)`; btn.style.boxShadow='0 0 20px 5px rgba(94,92,230,0.16)'; };
    const onLeave=()=>reset(btn);
    btn.addEventListener('pointermove',onMove); btn.addEventListener('pointerleave',onLeave); btn.addEventListener('blur',onLeave);
  });
  if(prefersReducedMotion()) buttons.forEach(reset);
}

// Carousel (videos + quotes alternating)
function initCasesCarousel(){
  const carousel=document.querySelector('#cases .carousel'); if(!carousel) return;
  const viewport=carousel.querySelector('.carousel__viewport');
  const track=carousel.querySelector('.carousel__track');
  const slides=Array.from(track.children);
  const prevBtn=carousel.querySelector('.carousel__btn--prev');
  const nextBtn=carousel.querySelector('.carousel__btn--next');
  const dotsWrap=carousel.querySelector('.carousel__dots');
  const videos=carousel.querySelectorAll('video.case-video');
  let index=0, autoTimer=null, slideCount=slides.length;

  slides.forEach((_,i)=>{ const b=document.createElement('button'); b.className='carousel__dot'; b.setAttribute('role','tab');
    b.setAttribute('aria-selected', i===0?'true':'false'); b.setAttribute('aria-label', `Перейти к слайду ${i+1}`);
    b.addEventListener('click',()=>goTo(i)); dotsWrap.appendChild(b); });
  const dots=Array.from(dotsWrap.children);

  function update(){ track.style.transform=`translateX(${-index*100}%)`; dots.forEach((d,i)=>d.setAttribute('aria-selected', String(i===index)));
    videos.forEach((v)=>{ if(!slides[index].contains(v) && !v.paused) v.pause(); });
    const v=slides[index].querySelector('video.case-video'); if(v){ v.muted=true; const p=v.play(); if(p&&typeof p.then==='function'){ p.catch(()=>{}); } } }

  function goTo(i){ index=(i+slideCount)%slideCount; update(); }
  function next(){ goTo(index+1); } function prev(){ goTo(index-1); }
  prevBtn.addEventListener('click',prev); nextBtn.addEventListener('click',next);
  viewport.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft') prev(); if(e.key==='ArrowRight') next(); });

  function startAuto(){ if(prefersReducedMotion()) return; stopAuto();
    autoTimer=setInterval(()=>{ const v=slides[index].querySelector('video.case-video'); if(v && !v.paused && !v.ended) return; next(); },6000); }
  function stopAuto(){ if(autoTimer) clearInterval(autoTimer); autoTimer=null; }
  carousel.addEventListener('mouseenter',stopAuto); carousel.addEventListener('mouseleave',startAuto);
  carousel.addEventListener('focusin',stopAuto); carousel.addEventListener('focusout',startAuto);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) stopAuto(); else startAuto(); });

  // Swipe
  let startX=0, curX=0, isDown=false;
  viewport.addEventListener('pointerdown',(e)=>{ isDown=true; startX=e.clientX; curX=startX; viewport.setPointerCapture(e.pointerId); });
  viewport.addEventListener('pointermove',(e)=>{ if(!isDown) return; curX=e.clientX; });
  viewport.addEventListener('pointerup',()=>{ if(!isDown) return; isDown=false; const dx=curX-startX; if(Math.abs(dx)>40){ dx<0?next():prev(); } });
  viewport.addEventListener('pointercancel',()=>{ isDown=false; });

  update(); startAuto();
}
