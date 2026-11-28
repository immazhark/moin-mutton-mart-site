/** Short, interruptible, progressive-enhancement motion. No order state is controlled by animation. */
export function createCounterMotion(root:HTMLElement){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const active=new Map<Element,Animation>();
  let token:HTMLElement|null=null;
  let observer:IntersectionObserver|undefined;
  const enabled=()=>!reduced.matches&&typeof Element.prototype.animate==='function';
  function animate(el:HTMLElement,frames:Keyframe[],duration:number){
    if(!enabled())return;
    active.get(el)?.cancel();
    const animation=el.animate(frames,{duration,easing:'cubic-bezier(.2,.75,.25,1)'});
    active.set(el,animation);
    const clear=()=>{if(active.get(el)===animation)active.delete(el);};
    animation.addEventListener('finish',clear,{once:true});
    animation.addEventListener('cancel',clear,{once:true});
    return animation;
  }
  function stop(){for(const animation of active.values())animation.cancel();active.clear();token?.remove();token=null;}
  function categories(){
    if(!enabled())return;
    for(const group of root.querySelectorAll<HTMLElement>('[data-group]:not([hidden])')){
      animate(group,[{opacity:.78,transform:'translateY(5px)'},{opacity:1,transform:'none'}],180);
    }
  }
  function added(card:HTMLElement,basket:HTMLElement){
    if(!enabled()||basket.hidden)return;
    const target=basket.querySelector<HTMLElement>('.basket-icon');
    if(!target)return;
    animate(target,[{transform:'scale(.87)'},{transform:'scale(1.1)',offset:.55},{transform:'scale(1)'}],260);
    // One token only. Do not animate out of view or interfere with touch targets.
    token?.remove();token=null;
    const from=card.getBoundingClientRect(),to=target.getBoundingClientRect();
    if(from.bottom<=0||from.top>=innerHeight||to.bottom<=0||to.top>=innerHeight)return;
    const x=Math.min(innerWidth-15,Math.max(15,from.right-20)),y=Math.min(innerHeight-15,Math.max(15,from.top+18));
    const endX=to.left+to.width/2,endY=to.top+to.height/2;
    const el=document.createElement('span');el.className='counter-token';el.textContent='+';el.setAttribute('aria-hidden','true');
    document.body.append(el);token=el;
    const position=(a:number,b:number,scale:number)=>'translate('+String(a-14)+'px,'+String(b-14)+'px) scale('+String(scale)+')';
    const animation=animate(el,[{transform:position(x,y,.75),opacity:0.9},{transform:position((x+endX)/2+12,(y+endY)/2-22,1),opacity:1,offset:.5},{transform:position(endX,endY,.3),opacity:0}],310);
    const clear=()=>{el.remove();if(token===el)token=null;};
    if(!animation){clear();return;}
    animation.addEventListener('finish',clear,{once:true});animation.addEventListener('cancel',clear,{once:true});
  }
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer?.unobserve(entry.target);if(entry.target instanceof HTMLElement)animate(entry.target,[{transform:'translateY(8px)',opacity:.84},{transform:'none',opacity:1}],280);}},{threshold:.22});
    for(const el of root.querySelectorAll('[data-motion-reveal]'))observer.observe(el);
  }
  reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
  window.addEventListener('pagehide',()=>{stop();observer?.disconnect();},{once:true});
  return {categories,added};
}
