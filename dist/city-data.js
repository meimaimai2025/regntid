(()=>{
const cities={
 bergen:{id:'bergen',name:'Bergen',station:'Bergen Florida',stationId:'SN50540',firstYear:1890,dailyYear:1983,coordinates:'60,39° N · 5,33° Ø'},
 oslo:{id:'oslo',name:'Oslo',station:'Oslo–Blindern',stationId:'SN18700',firstYear:1937,dailyYear:1937,coordinates:'59,94° N · 10,72° Ø',archive:'NOM00001492',snapshot:'24. oktober 2026'},
 trondheim:{id:'trondheim',name:'Trondheim',displayName:'Trondheim*',seriesName:'Trondheim* (sammensatt serie)',additionalSources:[{name:'Leinstrand',archive:'NOE00134634'}],compositeNote:'* Trondheim bruker en sammensatt måleserie: Leinstrand i 1991–2001 og Voll fra 2002. Før 1991 brukes tilgjengelige Voll-målinger, med hull. Lokale forskjeller mellom målestedene kan påvirke sammenligningen. Normalverdiene er beregnet i appen, ikke en offisiell normal for Voll.',station:'Trondheim–Voll',stationId:'SN68860',firstYear:1923,dailyYear:1923,coordinates:'63,41° N · 10,45° Ø',archive:'NOE00111040',snapshot:'29. september 2026'},
 kristiansand:{id:'kristiansand',name:'Kristiansand',displayName:'Kristiansand*',seriesName:'Kristiansand* (Kjevik, supplert med Mestad)',compositeNote:'* Kristiansand bruker Kjevik som hovedstasjon. 74 manglende døgn i 1991–2020 er supplert med målte døgnverdier fra Mestad i Oddernes. Mestad ligger høyere og er våtere enn Kjevik; lokale forskjeller kan påvirke sammenligningen. Dette er appens beregnede normal for en sammensatt serie, ikke en offisiell Kjevik-normal.',additionalSources:[{name:'Mestad i Oddernes',archive:'NOE00100570'}],station:'Kjevik',stationId:'SN39040',firstYear:1946,dailyYear:1946,coordinates:'58,20° N · 8,07° Ø',archive:'NOE00110447',snapshot:'29. september 2026'},
 tromso:{id:'tromso',name:'Tromsø',station:'Tromsø',stationId:'SN90450',firstYear:1920,dailyYear:1920,coordinates:'69,65° N · 18,93° Ø',archive:'NO000001026',snapshot:'26. oktober 2026'},
 bodo:{id:'bodo',name:'Bodø',station:'Bodø VI',stationId:'SN82290',firstYear:1954,dailyYear:1954,coordinates:'67,27° N · 14,36° Ø',archive:'NOE00105467',snapshot:'29. september 2026'},
 stavanger:{id:'stavanger',name:'Stavanger-området',station:'Sviland (Sandnes)',stationId:'SN44800',firstYear:1895,dailyYear:1895,coordinates:'58,82° N · 5,92° Ø',archive:'NOE00110608',snapshot:'29. september 2026'}
};
window.RAIN_CITIES=cities;
window.RAIN_CITY_DATA={bergen:{monthly:window.RAIN_DATA,daily:window.RECORD_DATA},oslo:window.OSLO_DATA,stavanger:window.STAVANGER_DATA,trondheim:window.TRONDHEIM_DATA,kristiansand:window.KRISTIANSAND_DATA,tromso:window.TROMSO_DATA,bodo:window.BODO_DATA};
const city=cities[new URLSearchParams(location.search).get('city')]||cities.bergen;
window.RAIN_CITY=city;
const data=window.RAIN_CITY_DATA[city.id];
if(data){window.RAIN_DATA=data.monthly;window.RECORD_DATA=data.daily;}
})();
