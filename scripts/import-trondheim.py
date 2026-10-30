"""Build Trondheim Voll assets from NOAA GHCN-Daily NOE00111040.
Only PRCP values with empty quality flag are accepted. No gap filling.
Input: ../../data/raw/trondheim-voll.dly, downloaded from NOAA's public archive.
"""
import calendar,csv,json,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
daily={}; monthly=[]
cutoff=datetime.date(2026,10,31)
for line in (root.parent/'data/raw/trondheim-voll.dly').read_text().splitlines():
 if line[:11]!='NOE00111040' or line[17:21]!='PRCP':continue
 y,m=int(line[11:15]),int(line[15:17]); values=[]
 for day in range(1,calendar.monthrange(y,m)[1]+1):
  date=datetime.date(y,m,day);i=21+(day-1)*8;v=int(line[i:i+5]);quality=line[i+6];valid=v>=0 and quality==' '
  if date>=cutoff:continue
  daily[date.isoformat()]=v if valid else None;values.append(v if valid else None)
 if len(values)==calendar.monthrange(y,m)[1] and all(v is not None for v in values):
  monthly.append(dict(month=f'{y}-{m:02}',mm=sum(values)/10,rainDays=sum(v>=10 for v in values),source='NOAA_GHCND_NOE00111040'))
valid=[d for d,v in daily.items() if v is not None];first,last=min(valid),max(valid)
record=dict(first=first,last=last,dailyTenths=sorted((d,v) for d,v in daily.items() if first<=d<=last),source='https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/NOE00111040.dly',station='SN68860:0',checkedOn='2026-10-30',fetchedAt='2026-10-30T00:00:00Z',timeOffset='PT6H')
payload=dict(monthly=monthly,daily=record)
(root/'dist/trondheim-data.js').write_text('window.TRONDHEIM_DATA='+json.dumps(payload,separators=(',',':'))+';\n')
with (root/'dist/trondheim_monthly.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['month','mm','rainDays','source']);w.writeheader();w.writerows(monthly)
print(json.dumps(dict(months=len(monthly),first=first,last=last,normalMonths=sum('1991'<=r['month']<'2021' for r in monthly))))
