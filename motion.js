(function(){
  "use strict";
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function reveals(){
    const items=document.querySelectorAll("[data-reveal]");
    document.querySelectorAll("[data-reveal-group]").forEach(group=>{
      const children=group.querySelectorAll(":scope [data-reveal]");
      children.forEach((child,i)=>child.style.setProperty("--reveal-delay",`${i*72}ms`));
    });
    if(reduce||!("IntersectionObserver" in window)){items.forEach(el=>el.classList.add("is-in"));return;}
    const io=new IntersectionObserver((entries,obs)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-in");obs.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px",threshold:.12});
    items.forEach(el=>io.observe(el));
  }
  function kinetic(){
    document.querySelectorAll("[data-kinetic]").forEach(el=>{
      const words=el.textContent.trim().split(/\s+/); el.textContent="";
      words.forEach((word,i)=>{const outer=document.createElement("span");outer.className="word";const inner=document.createElement("span");inner.textContent=word;inner.style.setProperty("--i",i);outer.appendChild(inner);el.appendChild(outer);el.appendChild(document.createTextNode(" "));});
      requestAnimationFrame(()=>el.classList.add("is-in"));
    });
  }
  function marquee(){
    document.querySelectorAll("[data-marquee]").forEach(m=>{const track=m.querySelector(".marquee__track");if(!track)return;track.innerHTML+=track.innerHTML;if(reduce)return;const speed=parseFloat(m.dataset.speed)||45;const set=()=>{const dist=track.scrollWidth/2;m.style.setProperty("--marquee-dur",`${dist/speed}s`)};set();window.addEventListener("resize",set,{passive:true});});
  }
  function magnetic(){
    if(reduce||window.matchMedia("(pointer: coarse)").matches)return;
    document.querySelectorAll("[data-magnetic]").forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))*.1;const y=(e.clientY-(r.top+r.height/2))*.1;el.style.transform=`translate(${x}px,${y}px)`});el.addEventListener("pointerleave",()=>{el.style.transform=""})});
  }
  document.addEventListener("DOMContentLoaded",()=>{kinetic();reveals();marquee();magnetic();});
})();
