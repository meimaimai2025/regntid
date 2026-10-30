"""Import three station-specific GHCN-Daily archives and approved MET supplements.
Raw input: ../data/raw/<filename>.dly. Optional --download fetches NOAA archives.
Supplement file documents Tromsø data from MET. Kristiansand fills missing normal-period days from Mestad, with explicit per-day provenance.
"""
import calendar,csv,json,datetime,sys,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
configs={
 'kristiansand':('kjevik','NOE00110447','SN39040','1946-01-01'),
 'tromso':('tromso','NO000001026','SN90450','1920-07-01'),
 'bodo':('bodo-eca','NOE00105467','SN82290','1954-01-01')}
cutoff='2026-10-31'
supplements=json.loads((root/'data/station-supplements.json').read_text())
for city,(filename,archive,station,start) in configs.items():
 raw=root.parent/'data/raw'/(filename+'.dly')
 url='https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/'+archive+'.dly'
 if '--download' in sys.argv:
  raw.parent.mkdir(parents=True,exist_ok=True);raw.write_bytes(urllib.request.urlopen(url,timeout=60).read())
 daily={};provenance={}
 for line in raw.read_text().splitlines():
  if line[:11]!=archive or line[17:21]!='PRCP':continue
  y,m=int(line[11:15]),int(line[15:17])
  for day in range(1,calendar.monthrange(y,m)[1]+1):
   date=f'{y}-{m:02}-{day:02}';i=21+(day-1)*8;v=int(line[i:i+5])
   if not start<=date<cutoff:continue
   daily[date]=v if v>=0 and line[i+6]==' ' and line[i+5]!='A' else None
 if city=='kristiansand':
  backup_path=root.parent/'data/raw/mestad.dly'
  if '--download' in sys.argv:backup_path.write_bytes(urllib.request.urlopen('https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/NOE00100570.dly',timeout=60).read())
  for line in backup_path.read_text().splitlines():
   if line[:11]!='NOE00100570' or line[17:21]!='PRCP':continue
   y,m=int(line[11:15]),int(line[15:17])
   if not 1991<=y<=2020:continue
   for day in range(1,calendar.monthrange(y,m)[1]+1):
    date=f'{y}-{m:02}-{day:02}';i=21+(day-1)*8;v=int(line[i:i+5])
    if daily.get(date) is None and v>=0 and line[i+6]==' ' and line[i+5]!='A':
     daily[date]=v;provenance[date]=dict(date=date,tenths=v,station='Mestad i Oddernes',archive='NOE00100570',method='NOAA_GHCND_NOE00100570',source='https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/NOE00100570.dly')
 for row in supplements.get(city,[]):
  assert (row['station'] in ['SN82290:0','SN82310:0'] if city=='bodo' else row['station']==station+':0') and start<=row['date']<cutoff
  if city=='bodo':assert '2022-01-01'<=row['date']<='2023-12-31' and 0<=row['qualityCode']<=4 and row['timeOffset']=='PT6H'
  assert isinstance(row['tenths'],int) and row['tenths']>=0
  # Fill missing archive days only. Keep original accepted measurements unchanged.
  if daily.get(row['date']) is None:
   daily[row['date']]=row['tenths'];provenance[row['date']]=row
 valid=[d for d,v in daily.items() if v is not None];first,last=min(valid),max(valid)
 dates=[];d=datetime.date.fromisoformat(first)
 while d.isoformat()<=last:
  dates.append(d.isoformat());d+=datetime.timedelta(days=1)
 monthly=[]
 for key in sorted({d[:7] for d in dates}):
  y,m=map(int,key.split('-'));keys=[f'{key}-{d:02}' for d in range(1,calendar.monthrange(y,m)[1]+1)]
  values=[daily.get(d) for d in keys]
  if all(v is not None for v in values):
   kinds={provenance[d]['method'] for d in keys if d in provenance}
   source='NOAA_GHCND_'+archive+(' + '+','.join(sorted(kinds)) if kinds else '')
   monthly.append(dict(month=key,mm=sum(values)/10,rainDays=sum(v>=10 for v in values),source=source))
 normal=[r for r in monthly if '1991-01'<=r['month']<='2020-12']
 record=dict(first=first,last=last,dailyTenths=[[d,daily.get(d)] for d in dates],source=url,station=station+':0',checkedOn='2026-10-30',fetchedAt='2026-10-30T00:00:00Z',timeOffset='PT6H',supplements=list(provenance.values()))
 if city=='kristiansand':record.update(composite=True,sources=[url,'https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/NOE00100570.dly'])
 if city=='bodo':record.update(composite=True,sources=[url,'https://frost.met.no/observations/v0.jsonld?sources=SN82290,SN82310'])
 assert len(normal)==360, 'Incomplete climate normal: '+city
 payload=dict(monthly=monthly,daily=record)
 (root/'dist'/f'{city}-data.js').write_text('window.'+city.upper()+'_DATA='+json.dumps(payload,separators=(',',':'))+';\n')
 with (root/'dist'/f'{city}_monthly.csv').open('w') as f:
  w=csv.DictWriter(f,fieldnames=['month','mm','rainDays','source']);w.writeheader();w.writerows(monthly)
 print(json.dumps(dict(city=city,first=first,last=last,months=len(monthly),normalMonths=len(normal),supplementDays=len(provenance),normalMM=sum(r['mm'] for r in normal)/30 if len(normal)==360 else None)))
