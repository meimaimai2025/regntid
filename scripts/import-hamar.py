"""Kise main series; fill only its 24 normal-period gaps with observed Vea data.
Run with --download to refresh the public NOAA source archives.
"""
import calendar,csv,datetime,json,sys,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
start='1957-01-01'
cutoff=datetime.date.today().isoformat()
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def read(archive):
 url='https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/'+archive+'.dly'
 raw=root.parent/'data/raw'/(archive+'.dly')
 if '--download' in sys.argv or not raw.exists():
  raw.parent.mkdir(parents=True,exist_ok=True)
  raw.write_bytes(urllib.request.urlopen(url,timeout=45).read())
 values={}
 for line in raw.read_text().splitlines():
  if line[:11]!=archive or line[17:21]!='PRCP':continue
  y,m=int(line[11:15]),int(line[15:17])
  for day in range(1,calendar.monthrange(y,m)[1]+1):
   date=f'{y}-{m:02}-{day:02}';i=21+(day-1)*8;value=int(line[i:i+5])
   if start<=date<cutoff:
    values[date]=value if value>=0 and line[i+6]==' ' and line[i+5]!='A' else None
 return values,url
primary,url=read('NOE00109984');backup,backup_url=read('NOE00133398')
daily=dict(primary);supplements=[]
for date,value in sorted(backup.items()):
 if '1991-01-01'<=date<='2020-12-31' and daily.get(date) is None and value is not None:
  daily[date]=value
  supplements.append(dict(date=date,tenths=value,station='Vea',archive='NOE00133398',source=backup_url,method='NOAA_GHCND_NOE00133398',qualityFlag=' '))
assert len(supplements)==24, 'Review changed normal-period coverage before updating'
valid=sorted(d for d,v in daily.items() if v is not None)
first,last=valid[0],valid[-1]
dates=[];d=datetime.date.fromisoformat(first)
while d.isoformat()<=last:
 dates.append(d.isoformat());d+=datetime.timedelta(days=1)
monthly=[]
for key in sorted({d[:7] for d in dates}):
 y,m=map(int,key.split('-'));keys=[f'{key}-{d:02}' for d in range(1,calendar.monthrange(y,m)[1]+1)]
 values=[daily.get(d) for d in keys]
 if all(v is not None for v in values):
  source='NOAA_GHCND_NOE00109984'+(' + NOAA_GHCND_NOE00133398' if any(r['date'] in keys for r in supplements) else '')
  monthly.append(dict(month=key,mm=sum(values)/10,rainDays=sum(v>=10 for v in values),source=source))
normal=[r for r in monthly if '1991-01'<=r['month']<='2020-12']
assert len(normal)==360
for year in range(2016,2026):assert len([r for r in monthly if r['month'].startswith(str(year))])==12
record=dict(first=first,last=last,dailyTenths=[[d,daily.get(d)] for d in dates],source=url,station='SN12550:0',checkedOn=cutoff,fetchedAt=now,timeOffset='PT6H',composite=True,sources=[url,backup_url],supplements=supplements)
(root/'dist/hamar-data.js').write_text('window.HAMAR_DATA='+json.dumps(dict(monthly=monthly,daily=record),separators=(',',':'))+';\n')
with (root/'dist/hamar_monthly.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['month','mm','rainDays','source']);w.writeheader();w.writerows(monthly)
print(json.dumps(dict(first=first,last=last,normalMonths=len(normal),supplements=len(supplements),normalMM=sum(r['mm'] for r in normal)/30)))
