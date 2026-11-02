(()=>{
 const links=[...document.querySelectorAll('aside nav a[href^="#"]')];
 const pages=links.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
 const latest=document.getElementById('latest');
 const select=document.getElementById('sectionMenu');
 let current;
 function show(scroll=false){
  let target;
  try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)))}catch{}
  const page=pages.find(p=>p===target||p.contains(target))||pages[0];
  if(!page)return;
  pages.forEach(p=>{p.hidden=p!==page});
  if(latest)latest.hidden=page.id!=='annual';
  links.forEach(link=>{
   const active=link.getAttribute('href')==='#'+page.id;
   link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  if(select)select.value=page.id;
  if(scroll&&current!==page.id){
   window.scrollTo({top:0,behavior:'instant'});
   const heading=page.querySelector('h1,h2');
   if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
  }
  current=page.id;
 }
 // Update visibility before the browser follows an anchor into a hidden section.
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const hash=link.getAttribute('href');
  let target;try{target=document.getElementById(decodeURIComponent(hash.slice(1)))}catch{}
  if(!pages.some(p=>p===target||p.contains(target)))return;
  event.preventDefault();
  if(location.hash!==hash)window.history.pushState(null,'',hash);
  show(true);
  if(!links.includes(link)&&target)target.scrollIntoView({block:'start'});
 });
 if(select)select.addEventListener('change',()=>{window.history.pushState(null,'','#'+select.value);show(true)});
 window.addEventListener('hashchange',()=>show(true));
 window.addEventListener('popstate',()=>show(true));
 show();
})();
