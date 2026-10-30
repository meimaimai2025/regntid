"""Build Trondheim composite: Voll except Leinstrand during 1991–2001.
Inputs in ../data/raw/: trondheim-voll.dly (NOE00111040),
leinstrand.dly (NOE00134634), from NOAA GHCN-Daily all/<id>.dly.
Only nonnegative PRCP without quality or accumulation flags. No estimates.
Run: python scripts/import-trondheim.py
"""
import calendar,csv,json,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cutoff=datetime.date(2026,10,31)
def read(name,station):
 values={}
 for line in (root.parent/'data/raw'/name).read_text().splitlines():
  if line[:11]!=station or line[17:21]!='PRCP':continue
  y,m=int(line[11:15]),int(line[15:17])
  for day in range(1,calendar.monthrange(y,m)[1]+1):
   date=datetime.date(y,m,day);i=21+(day-1)*8;v=int(line[i:i+5])
   if date>=cutoff:continue
   valid=v>=0 and line[i+6]==' ' and line[i+5]!='A'
   values[date.isoformat()]=v if valid else None
 return values
voll=read('trondheim-voll.dly','NOE00111040')
leinstrand=read('leinstrand.dly','NOE00134634')
start='1991-01-01';end='2001-12-31'
daily={d:v for d,v in voll.items() if not start<=d<=end}
daily.update({d:v for d,v in leinstrand.items() if start<=d<=end})
for i in range((datetime.date(2002,1,1)-datetime.date(1991,1,1)).days):
 d=(datetime.date(1991,1,1)+datetime.timedelta(days=i)).isoformat()
 assert daily.get(d) is not None, 'Missing Leinstrand measurement: '+d
normal_dates=[(datetime.date(1991,1,1)+datetime.timedelta(days=i)).isoformat() for i in range(10958)]
assert all(daily.get(d) is not None for d in normal_dates)
valid=[d for d,v in daily.items() if v is not None];first,last=min(valid),max(valid)
monthly=[]
for key in sorted({d[:7] for d in daily}):
 y,m=map(int,key.split('-'));values=[daily.get(f'{key}-{d:02}') for d in range(1,calendar.monthrange(y,m)[1]+1)]
 if all(v is not None for v in values):
  source='NOE00134634' if '1991-01'<=key<='2001-12' else 'NOE00111040'
  monthly.append(dict(month=key,mm=sum(values)/10,rainDays=sum(v>=10 for v in values),source='NOAA_GHCND_'+source))
base='https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/'
periods=[dict(fromDate=first,toDate='1990-12-31',station='Trondheim–Voll',archive='NOE00111040'),dict(fromDate=start,toDate=end,station='Leinstrand',archive='NOE00134634'),dict(fromDate='2002-01-01',toDate=last,station='Trondheim–Voll',archive='NOE00111040')]
record=dict(first=first,last=last,dailyTenths=sorted((d,v) for d,v in daily.items() if first<=d<=last),source=base+'NOE00111040.dly',sources=[base+'NOE00111040.dly',base+'NOE00134634.dly'],sourcePeriods=periods,composite=True,station='SN68860:0',checkedOn='2026-10-30',fetchedAt='2026-10-30T00:00:00Z',timeOffset='PT6H')
payload=dict(monthly=monthly,daily=record)
(root/'dist/trondheim-data.js').write_text('window.TRONDHEIM_DATA='+json.dumps(payload,separators=(',',':'))+';\n')
with (root/'dist/trondheim_monthly.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['month','mm','rainDays','source']);w.writeheader();w.writerows(monthly)
print(json.dumps(dict(months=len(monthly),first=first,last=last,normalMonths=sum('1991'<=r['month']<'2021' for r in monthly),normalDays=len(normal_dates))))
