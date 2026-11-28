import {products,categories} from '../data/products';
import {CatalogueSession,reviewChanges,requestEstimate,type CatalogueSnapshot} from '../lib/catalogue/freshness';
import {assessQuantity,displayedRate} from '../lib/catalogue/contract';
import {loadPublicCatalogue} from '../lib/catalogue/public-read';
import {CopySession} from '../lib/order/copy-session';
import {formatQuantity,formatRequest,buildWhatsAppUrl,linkFits,MAX_LINE_NOTE,MAX_ORDER_NOTE,type Product,type Selection,type Fulfilment} from '../lib/order/order';
import {decodeDraft,encodeDraft,RETENTION_MS,STORAGE_KEY} from '../lib/order/storage';

const HOLD_MS=15000;
const currency=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2});
function node<T extends HTMLElement>(parent:ParentNode,selector:string):T{
  const el=parent.querySelector<T>(selector);
  if(!el)throw Error('Counter markup missing '+selector);
  return el;
}
function text(el:HTMLElement,value:string){if(el.textContent!==value)el.textContent=value;}
function show(el:HTMLElement,visible:boolean){el.hidden=!visible;}
function button(parent:ParentNode,action:string){return node<HTMLButtonElement>(parent,'button[data-action="'+action+'"]');}
function role<T extends HTMLElement=HTMLElement>(parent:ParentNode,name:string){return node<T>(parent,'[data-role="'+name+'"]');}
type Grant={snapshot:CatalogueSnapshot;message:string;at:number};

/** Static Astro customer surface, progressively enhanced by one small controller.
 * No customer React hydration, Firebase SDK, custom HTML parsing or unsafe innerHTML. */
export function mountCounter(root:HTMLElement){
  if(root.dataset.mounted)return;
  root.dataset.mounted='true';
  const session=new CatalogueSession(()=>loadPublicCatalogue(products));
  const copy=new CopySession();
  const indexed=new Map(products.map(p=>[p.id,p]));
  const cards=new Map([...root.querySelectorAll<HTMLElement>('[data-product]')].map(el=>[el.dataset.product!,el]));
  const lines=new Map<string,HTMLElement>();
  const otherOpen=new Set<string>();
  const search=role<HTMLInputElement>(root,'search');
  const grid=role(root,'grid');
  const none=role(root,'no-results');
  const status=role(root,'status');
  const basket=role(root,'basket');
  const opener=button(basket,'open');
  const count=role(root,'count');
  const dialog=node<HTMLDialogElement>(root,'dialog');
  const close=button(dialog,'close');
  const review=role(dialog,'review');
  const empty=role(dialog,'empty');
  const list=role(dialog,'lines');
  const template=role<HTMLTemplateElement>(root,'line-template');
  const orderNote=role<HTMLTextAreaElement>(dialog,'order-note');
  const estimateNode=role(dialog,'estimate');
  const noticeNode=role(dialog,'review-notice');
  const handoff=node<HTMLAnchorElement>(dialog,'a[data-action="handoff"]');
  const check=button(dialog,'check');
  const longLink=role(dialog,'long-link');
  const copyButton=button(dialog,'copy');
  const copyStatus=node<HTMLElement>(dialog,'.copy-status');
  const copyFallback=node<HTMLTextAreaElement>(dialog,'.copy-fallback');
  let category:(typeof categories)[number]='All';
  let items:Selection[]=[];
  let startedAt=0;
  let fulfilment:Fulfilment='discuss';
  let revision=0;
  let grant:Grant|null=null;
  let expiry:number|undefined;
  let checking=false;
  let notice='';
  let closing=false;
  let openEpoch=0;

  const current=()=>{const live=session.getSnapshot();return live.kind==='ready'?live.catalogue:null;};
  const known=()=>session.getLastKnownCatalogue();
  const selection=(id:string)=>items.find(s=>s.productId===id);
  const blocked=()=>{const value=known();return !!value&&reviewChanges(value,value,products,items).kind==='blocked';};
  const message=()=>items.length?formatRequest(products,items,fulfilment,orderNote.value):'';
  const canIncrease=(p:Product,q:number)=>q+p.step<=p.max&&(!known()||assessQuantity(known()!,p,q+p.step).kind!=='blocked');

  function persist(){
    try{
      if(!items.length){startedAt=0;localStorage.removeItem(STORAGE_KEY);}
      else{
        startedAt||=Date.now();
        if(Date.now()-startedAt>RETENTION_MS)localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY,encodeDraft(items,startedAt));
      }
    }catch{/* Storage denial is not an ordering failure. */}
  }
  function revoke(){
    grant=null;
    if(expiry!==undefined)window.clearTimeout(expiry);
    expiry=undefined;
  }
  function edited(){
    revision++;
    revoke();
    notice='';
    renderAction();
  }
  function filter(){
    const q=search.value.trim().toLowerCase();
    let visible=0;
    for(const p of products){
      const match=(category==='All'||p.category===category)&&(!q||p.name.toLowerCase().includes(q));
      show(cards.get(p.id)!,match);
      if(match)visible++;
    }
    for(const el of root.querySelectorAll<HTMLButtonElement>('[data-category-filter]'))el.setAttribute('aria-pressed',String(el.dataset.categoryFilter===category));
    show(grid,visible>0);show(none,visible===0);
    text(none,'Nothing in the range matches “'+search.value+'”. Try another word or call the shop.');
  }
  function renderStepper(stepper:HTMLElement,p:Product,q:number){
    const output=node<HTMLOutputElement>(stepper,'output');
    text(output,formatQuantity(p,q));
    button(stepper,'increase').disabled=!canIncrease(p,q);
  }
  function renderCards(){
    const live=session.getSnapshot(),catalogue=current(),last=known();
    text(status,live.kind==='loading'?'Checking current availability…':live.kind==='unavailable'?'Live rates unavailable · ask the shop':catalogue?.acceptingRequests?'Current rates and stock · subject to confirmation':'The shop is not taking requests right now');
    for(const p of products){
      const card=cards.get(p.id)!,q=selection(p.id)?.quantity??0;
      const add=node<HTMLButtonElement>(card,'.add'),stepper=node(card,'.stepper');
      const active=document.activeElement;
      const switchToStepper=q>0&&!add.hidden&&active===add;
      const switchToAdd=q===0&&!stepper.hidden&&stepper.contains(active);
      const next=last?assessQuantity(last,p,q+p.step):null;
      const rate=catalogue&&p.pricingBasis?displayedRate(catalogue,p.id):null;
      const offer=catalogue?.offers[p.id];
      const restricted=next?.kind==='blocked';
      text(role(card,'rate'),rate?.kind==='visible'&&p.pricingBasis?currency.format(rate.pricePaise/100)+' / '+p.pricingBasis:'Ask for today’s rate');
      text(role(card,'availability'),!catalogue?(restricted?'Previously restricted · check with shop':'Confirm with shop'):!catalogue.acceptingRequests?'Requests paused':!offer?.enabled?'Not listed today':offer.availability==='sold_out'||offer.stockQuantity===0?'Sold out':offer.availability==='ask'||offer.stockQuantity===null?'Confirm availability':restricted?'Quantity limit':'Available');
      add.disabled=!canIncrease(p,0);
      show(add,q===0);show(stepper,q>0);
      if(q>0)renderStepper(stepper,p,q);
      if(switchToStepper){const inc=button(stepper,'increase');(inc.disabled?button(stepper,'decrease'):inc).focus();}
      if(switchToAdd){if(!add.disabled)add.focus();else search.focus();}
    }
    show(basket,items.length>0);
    text(count,items.length+' '+(items.length===1?'item':'items'));
  }
  function newLine(p:Product){
    const line=template.content.firstElementChild!.cloneNode(true) as HTMLElement;
    line.dataset.product=p.id;
    text(node(line,'h3'),p.name);
    button(line,'remove').setAttribute('aria-label','Remove '+p.name);
    button(line,'increase').setAttribute('aria-label','Increase '+p.name);
    button(line,'decrease').setAttribute('aria-label','Reduce '+p.name);
    node(line,'output').setAttribute('aria-label',p.name+' quantity');
    const cuts=role(line,'cuts');
    if(p.cuts?.length){
      cuts.setAttribute('aria-label','Cut for '+p.name);
      for(const value of [...p.cuts,'Other']){
        const chip=document.createElement('button');
        chip.type='button';chip.className='chip';chip.dataset.action=value==='Other'?'other':'cut';chip.dataset.cut=value;text(chip,value);cuts.append(chip);
      }
      text(role(line,'cut-label'),'Other preference');
      show(cuts,true);
    }
    lines.set(p.id,line);list.append(line);
    return line;
  }
  function renderLines(){
    const active=document.activeElement;
    let lostFocus=false;
    for(const [id,line] of lines){
      if(!selection(id)){lostFocus||=line.contains(active);line.remove();lines.delete(id);otherOpen.delete(id);}
    }
    show(empty,items.length===0);show(review,items.length>0);
    const catalogue=current(),last=known();
    for(const s of items){
      const p=indexed.get(s.productId)!;
      const line=lines.get(p.id)??newLine(p);
      renderStepper(node(line,'.stepper'),p,s.quantity);
      const rate=catalogue&&p.pricingBasis?displayedRate(catalogue,p.id):null;
      const rateNode=role(line,'line-rate');
      show(rateNode,rate?.kind==='visible');
      if(rate?.kind==='visible')text(rateNode,currency.format(rate.pricePaise/100)+' / '+p.pricingBasis);
      const assessment=last?assessQuantity(last,p,s.quantity):null;
      const restriction=role(line,'line-restriction');
      show(restriction,assessment?.kind==='blocked');
      if(assessment?.kind==='blocked')text(restriction,!catalogue?'Previously restricted. Check again, reduce or remove this item, or call the shop.':assessment.reason==='insufficient_stock'?'Requested quantity exceeds current stock. Reduce or remove this item.':'Not currently requestable. Check again, remove this item or contact the shop.');
      const showOther=!p.cuts?.length||otherOpen.has(p.id)||(s.note!==''&&!p.cuts.includes(s.note));
      show(role(line,'cut-field'),showOther);
      const input=role<HTMLInputElement>(line,'cut-input');
      if(input.value!==s.note)input.value=s.note;
      for(const chip of line.querySelectorAll<HTMLButtonElement>('[data-cut]'))chip.setAttribute('aria-pressed',String(chip.dataset.action==='other'?showOther:s.note===chip.dataset.cut));
    }
    if(lostFocus&&dialog.open)(items.length?button(list,'remove'):button(empty,'close')).focus();
    for(const el of dialog.querySelectorAll<HTMLButtonElement>('[data-fulfil]'))el.setAttribute('aria-pressed',String(el.dataset.fulfil===fulfilment));
  }
  function renderCopy(){
    const restricted=blocked(),state=copy.getSnapshot();
    copyButton.disabled=state.busy||restricted;
    text(role(copyButton,'copy-label'),state.busy?'Copying…':'Copy request');
    text(copyStatus,state.busy?'Copy in progress. If you edit the request, copy it again when ready.':restricted?'':state.result==='done'?'Copied. Paste it into your chat with the shop.':state.result==='failed'?'Copy is unavailable here. Select the text below instead.':'');
    const fallback=!restricted&&state.result==='failed';
    show(copyFallback,fallback);
    copyFallback.value=fallback?message():'';
  }
  function renderAction(){
    const active=document.activeElement,restricted=blocked(),live=session.getSnapshot();
    const valid=grant&&grant.snapshot===live&&!restricted&&Date.now()-grant.at>=0&&Date.now()-grant.at<=HOLD_MS?grant:null;
    const link=!!valid&&linkFits(valid.message);
    const oversized=!!valid&&!link;
    if(link&&valid){
      handoff.href=buildWhatsAppUrl(valid.message);
      text(role(handoff,'handoff-label'),live.kind==='ready'?'Continue on WhatsApp':'Continue as unpriced enquiry');
    }else handoff.removeAttribute('href');
    show(handoff,link);show(longLink,oversized);show(check,!valid);
    check.setAttribute('aria-disabled',String(checking));
    text(role(check,'check-label'),checking?'Checking latest information…':'Check latest rates & availability');
    if(dialog.open&&[handoff,longLink,check].some(el=>el===active&&el.hidden))(link?handoff:oversized?longLink:check).focus();
    const estimate=requestEstimate(current(),products,items);
    show(estimateNode,estimate.kind==='complete'&&!restricted);
    if(estimate.kind==='complete')text(estimateNode,'Estimated total: '+currency.format(estimate.totalPaise/100));
    show(noticeNode,!!notice);text(noticeNode,notice);
    copy.setMessage(restricted?'':message());
    renderCopy();
  }
  function render(){renderCards();renderLines();renderAction();}
  function forgetOrderDetails(){orderNote.value='';fulfilment='discuss';otherOpen.clear();}
  function clearBasketFromStorage(){
    if(!items.length)return;
    items=[];startedAt=0;forgetOrderDetails();edited();render();
    if(dialog.open)button(empty,'close').focus();
  }
  function change(id:string,delta:-1|1){
    const p=indexed.get(id);if(!p)return;
    const before=selection(id),q=(before?.quantity??0)+delta*p.step;
    if(q>p.max||delta>0&&!canIncrease(p,before?.quantity??0))return;
    if(q<=0)items=items.filter(s=>s.productId!==id);
    else if(before)before.quantity=q;
    else items.push({productId:id,quantity:q,note:''});
    if(!items.length)forgetOrderDetails();
    persist();edited();render();
  }
  function remove(id:string){
    items=items.filter(s=>s.productId!==id);if(!items.length)forgetOrderDetails();persist();edited();render();
  }
  function begin(){
    if(dialog.open||closing||!items.length)return;
    revoke();notice='';
    render();dialog.showModal();close.focus();document.body.classList.add('sheet-open');openEpoch++;
    try{if(!history.state?.moinReview)history.pushState({...history.state,moinReview:true},'');}catch{/* Native close remains usable. */}
  }
  function requestClose(){
    if(!dialog.open||closing)return;
    openEpoch++;revoke();notice='';renderAction();
    if(history.state?.moinReview){closing=true;history.back();}
    else dialog.close();
  }
  function syncHistory(){
    closing=false;
    if(history.state?.moinReview&&items.length){
      if(!dialog.open){revoke();notice='';render();dialog.showModal();close.focus();openEpoch++;}
      document.body.classList.add('sheet-open');
    }else{
      if(dialog.open){openEpoch++;revoke();notice='';renderAction();dialog.close();}
      document.body.classList.remove('sheet-open');
      if(history.state?.moinReview){const {moinReview:_marker,...state}=history.state;history.replaceState(state,'');}
    }
  }
  async function checkLatest(){
    if(checking||!items.length)return;
    const previous=current(),rev=revision,epoch=openEpoch;
    checking=true;revoke();notice='';renderAction();
    try{
      const next=await session.refresh();
      if(revision!==rev||openEpoch!==epoch||!dialog.open)return;
      if(next.kind!=='ready'){
        if(blocked())notice='Previously restricted selections could not be rechecked. Change or remove the affected items, retry, or call the shop.';
        else{grant={snapshot:next,message:message(),at:Date.now()};notice='Live rates and availability could not be checked. You can send an unpriced enquiry and ask the shop to confirm.';}
      }else{
        const decision=reviewChanges(previous,next.catalogue,products,items);
        if(decision.kind==='blocked')notice='Some selections are not currently requestable. Change or remove the affected items before continuing.';
        else if(decision.kind==='review')notice='Please review the current rates and availability for: '+decision.changes.map(id=>indexed.get(id)?.name??id).join(', ')+'. Check again when ready.';
        else{grant={snapshot:next,message:formatRequest(products,items,fulfilment,orderNote.value,requestEstimate(next.catalogue,products,items)),at:Date.now()};notice='Current information checked. Final availability, weight and total are confirmed by the shop.';}
      }
      if(grant){const accepted=grant;expiry=window.setTimeout(()=>{if(grant===accepted){revoke();renderAction();}},HOLD_MS);}
    }catch{
      if(revision===rev&&openEpoch===epoch)notice='Could not verify this request. Try again or call the shop.';
    }finally{checking=false;renderAction();}
  }

  root.addEventListener('click',event=>{
    const el=event.target instanceof Element?event.target.closest<HTMLElement>('button,a[data-action]'):null;
    if(!el||!root.contains(el))return;
    const filterValue=el.dataset.categoryFilter;
    if(filterValue&&categories.includes(filterValue as typeof category)){category=filterValue as typeof category;filter();return;}
    const mode=el.dataset.fulfil;
    if(mode==='pickup'||mode==='delivery'||mode==='discuss'){fulfilment=mode;edited();renderLines();return;}
    const id=el.closest<HTMLElement>('[data-product]')?.dataset.product;
    switch(el.dataset.action){
      case 'increase':if(id)change(id,1);break;
      case 'decrease':if(id)change(id,-1);break;
      case 'remove':if(id)remove(id);break;
      case 'open':begin();break;
      case 'close':requestClose();break;
      case 'check':void checkLatest();break;
      case 'copy':if(!blocked())void copy.copy(value=>navigator.clipboard.writeText(value));break;
      case 'handoff':
        if(!grant||grant.snapshot!==session.getSnapshot()||blocked()||Date.now()-grant.at>HOLD_MS||Date.now()<grant.at){event.preventDefault();void checkLatest();}
        break;
      case 'cut':if(id){const s=selection(id);if(s&&el.dataset.cut!==undefined){s.note=s.note===el.dataset.cut?'':el.dataset.cut;edited();renderLines();}}break;
      case 'other':if(id){otherOpen.add(id);renderLines();role<HTMLInputElement>(lines.get(id)!,'cut-input').focus();}break;
    }
  });
  search.addEventListener('input',filter);
  dialog.addEventListener('input',event=>{
    const target=event.target;
    if(target===orderNote){orderNote.value=orderNote.value.slice(0,MAX_ORDER_NOTE);edited();}
    else if(target instanceof HTMLInputElement&&target.dataset.role==='cut-input'){
      const id=target.closest<HTMLElement>('[data-product]')?.dataset.product;
      const s=id?selection(id):undefined;
      if(s){s.note=target.value.slice(0,MAX_LINE_NOTE);edited();}
    }
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;
    document.body.classList.remove('sheet-open');openEpoch++;revoke();notice='';renderAction();
    (items.length?opener:search).focus();
  });
  window.addEventListener('popstate',syncHistory);
  window.addEventListener('storage',event=>{if((event.key===STORAGE_KEY||event.key===null)&&event.newValue===null){try{if(event.storageArea===localStorage)clearBasketFromStorage();}catch{/* Storage disabled. */}}});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible')return;
    if(startedAt&&(Date.now()<startedAt||Date.now()-startedAt>RETENTION_MS)){clearBasketFromStorage();try{localStorage.removeItem(STORAGE_KEY);}catch{/* Storage disabled. */}}
    if(session.needsRefresh())void session.refresh();
  });
  session.subscribe(()=>{if(grant&&grant.snapshot!==session.getSnapshot())revoke();render();});
  copy.subscribe(renderCopy);
  try{const draft=decodeDraft(localStorage.getItem(STORAGE_KEY),products);if(draft){items=draft.items;startedAt=draft.startedAt;}else localStorage.removeItem(STORAGE_KEY);}catch{/* Memory-only. */}
  filter();render();syncHistory();void session.refresh();
}
