'use strict';
(()=>{
 const date=d=>new Date(d+'T00:00:00Z').toLocaleDateString('nb-NO',{day:'2-digit',month:'long',timeZone:'UTC'});
 function render(){
  const data=window.RECORD_DATA,values=new Map(data.dailyTenths),cards=[];
  for(let i=0;i<3;i++){
   const d=new Date(Date.parse(data.last+'T00:00:00Z')-i*86400000).toISOString().slice(0,10),v=values.get(d);
   cards.push(`<article class="recent-day"><h3>${date(d)}</h3><strong>${v==null?'—':(v/10).toLocaleString('nb-NO',{maximumFractionDigits:1})+' mm'}</strong><p>${v==null?'Måling mangler':v>=10?'Regndag':'Under 1 mm'}</p></article>`);
  }
  document.getElementById('recentDaysCards').innerHTML=cards.join('');
  document.getElementById('recentDaysStatus').textContent='Lagrede målinger til '+date(data.last)+' '+data.last.slice(0,4)+'. Sjekker nye målinger når siden åpnes.';
 }
 window.addEventListener('frost-updated',render);render();
})();
