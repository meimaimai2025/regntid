"""Extract measured supplements from the Bodø MET audit; do not overwrite observations.
Input ../data/raw/bodo-nearby-2022-2023.json contains the approved Frost response
for fixed stations, elements and dates. Only SN82290:0 and SN82310:0, main
P1D/PT6H series and explicit quality codes 0–4 are accepted.
"""
import json,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
raw=json.loads((root.parent/'data/raw/bodo-nearby-2022-2023.json').read_text())
observations=raw['observations'];assert not observations.get('nextLink')
old=json.loads((root/'dist/bodo-data.js').read_text().split('=',1)[1].rstrip(';\n'))
existing=dict(old['daily']['dailyTenths'])
maps={s:{} for s in ['SN82290:0','SN82310:0']}
for r in observations['data']:
 if r['sourceId'] not in maps:continue
 d=r['referenceTime'][:10]
 for o in r['observations']:
  if o['elementId']!='sum(precipitation_amount P1D)' or o['timeOffset']!='PT6H' or o['timeResolution']!='P1D' or o['timeSeriesId']!=0 or o['unit']!='mm':continue
  q=o.get('qualityCode')
  if not isinstance(q,int) or not 0<=q<=4 or o['value']< -1:continue
  row=dict(date=d,tenths=round(max(o['value'],0)*10),station=r['sourceId'],method='MET_Frost_'+r['sourceId'].split(':')[0]+'_daily_P1D_PT6H',qualityCode=q,timeOffset='PT6H',source='https://frost.met.no/observations/v0.jsonld?sources='+r['sourceId'].split(':')[0]+'&referencetime=2022-01-01/2024-01-01&elements=sum(precipitation_amount%20P1D)&timeoffsets=PT6H&qualities=0,1,2,3,4',checkedOn='2026-10-30')
  if d in maps[r['sourceId']]:assert maps[r['sourceId']][d]['tenths']==row['tenths']
  maps[r['sourceId']][d]=row
out=[]
for d,v in sorted(existing.items()):
 if v is not None or not '2022-01-01'<=d<='2023-12-31':continue
 for source in ['SN82290:0','SN82310:0']:
  if d in maps[source]:out.append(maps[source][d]);break
p=root/'data/station-supplements.json';saved=json.loads(p.read_text())
# Preserve already imported supplements on reruns.
saved['bodo']=sorted({r['date']:r for r in saved.get('bodo',[])+out}.values(),key=lambda r:r['date'])
p.write_text(json.dumps(saved,indent=2)+'\n')
print('Bodø supplements:',len(saved['bodo']))
