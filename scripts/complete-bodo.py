"""Rebuild Bodø snapshot using audited, persisted measured supplements.
Only gaps are filled. Original observations and existing source attribution survive.
NOAA values were accepted only with an empty quality flag and no accumulation flag A.
"""
import calendar,csv,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'dist/bodo-data.js'
data=json.loads(p.read_text().split('=',1)[1].rstrip(';\n'))
daily=data['daily'];values=dict(daily['dailyTenths']);provenance={r['date']:r for r in daily['supplements']}
for r in json.loads((root/'data/station-supplements.json').read_text())['bodo']:
 if values.get(r['date']) is None:
  values[r['date']]=r['tenths'];provenance[r['date']]=r
assert all(v is not None for v in values.values())
monthly=[]
for month in sorted({d[:7] for d in values}):
 y,m=map(int,month.split('-'));dates=[f'{month}-{j:02}' for j in range(1,calendar.monthrange(y,m)[1]+1)];vs=[values.get(d) for d in dates]
 if all(v is not None for v in vs):
  methods=sorted({provenance[d]['method'] for d in dates if d in provenance})
  monthly.append(dict(month=month,mm=sum(vs)/10,rainDays=sum(v>=10 for v in vs),source='NOAA_GHCND_NOE00105467'+(' + '+','.join(methods) if methods else '')))
data['monthly']=monthly;daily['dailyTenths']=sorted(values.items());daily['supplements']=sorted(provenance.values(),key=lambda r:r['date']);daily['sources']=sorted({daily['source']}|{r['source'] for r in provenance.values()})
p.write_text('window.BODO_DATA='+json.dumps(data,separators=(',',':'))+';\n')
with (root/'dist/bodo_monthly.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['month','mm','rainDays','source']);w.writeheader();w.writerows(monthly)
print('Bodø:',len(values),'consecutive measured days;',len(provenance),'supplements;',len(monthly),'complete months')
