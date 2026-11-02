import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRainCache} from '../src/rain-cache.mjs';
import {CITY_STATIONS} from '../src/frost.mjs';
const origin='https://example.test';
const at=(seconds=0)=>new Date(Date.parse('2026-11-02T08:00:00Z')+seconds*1000);
const fixture=(_id,now,_fetch,city)=>({station:CITY_STATIONS[city]+':0',fetchedAt:now.toISOString(),dailyTenths:[['2026-11-01',12]]});
const options=(city='bergen',seconds=0)=>({city,now:at(seconds),origin,clientId:'test'});
test('requests share a station result for an hour and refresh exactly at expiry',async()=>{
 let calls=0;const load=createRainCache((...args)=>{calls++;return fixture(...args)});
 const first=await load(options());assert.equal((await load(options('bergen',3599))).fetchedAt,first.fetchedAt);assert.equal(calls,1);
 await load(options('bergen',3600));assert.equal(calls,2);
 const oslo=await load(options('oslo'));assert.equal(oslo.station,'SN18700:0');assert.equal(calls,3);
 await assert.rejects(load(options('unknown')),/Unknown city/);assert.equal(calls,3);
});
test('simultaneous requests join one upstream request',async()=>{
 let calls=0,release;const gate=new Promise(r=>release=r);const load=createRainCache(async(...args)=>{calls++;await gate;return fixture(...args)});
 const a=load(options()),b=load(options());assert.equal(calls,1);release();assert.deepEqual(await a,await b);
});
test('edge cache survives a new instance, isolates stations and expires by fetchedAt',async()=>{
 const entries=new Map();const cache={match:async k=>entries.get(k)?.clone(),put:async(k,r)=>entries.set(k,r)};let calls=0;
 const upstream=(...args)=>{calls++;return fixture(...args)};
 await createRainCache(upstream)({...options(),cache});assert.equal(calls,1);
 await createRainCache(upstream)({...options('bergen',100),cache});assert.equal(calls,1);
 await createRainCache(upstream)({...options('hamar',100),cache});assert.equal(calls,2);
 await createRainCache(upstream)({...options('bergen',3600),cache});assert.equal(calls,3);
 assert.equal(entries.size,2);assert.ok([...entries.keys()].every(k=>!k.includes('test?')));
});
test('upstream errors are retried and broken edge storage does not prevent measurements',async()=>{
 let calls=0;const load=createRainCache((...args)=>{if(++calls===1)throw Error('MET unavailable');return fixture(...args)});
 await assert.rejects(load(options()),/MET unavailable/);assert.equal((await load(options())).station,'SN50540:0');assert.equal(calls,2);
 const cache={match(){throw Error('cache unavailable')},put(){throw Error('cache unavailable')}};
 assert.equal((await createRainCache(fixture)({...options(),cache})).station,'SN50540:0');
});
