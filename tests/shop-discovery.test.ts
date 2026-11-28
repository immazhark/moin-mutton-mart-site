import {describe,it,expect} from 'vitest';
import {shop,shopGraph,canonicalUrl} from '../src/data/shop';
import {openingStatus,type HoursSchedule} from '../src/lib/shop/hours';

describe('truthful shop facts and discovery',()=>{
  it('preserves the approved name and contact, without inventing unconfirmed attributes',()=>{
    expect(shop.name).toBe('Moin Mutton Mart');
    expect(shop.phone).toBe('+918143730054');
    expect(shop.hours).toBeNull();
    expect(shop.streetAddress).toBeNull();
    expect(shop.mapPin).toBeNull();
    const graph=shopGraph();
    const store=graph['@graph'].find(n=>n['@type']==='Store');
    expect(store).toMatchObject({name:shop.name,telephone:shop.phone,address:{addressLocality:'Hyderabad',addressRegion:'Telangana',addressCountry:'IN'}});
    expect(store).not.toHaveProperty('openingHoursSpecification');
    expect(store).not.toHaveProperty('geo');
    expect(store).not.toHaveProperty('aggregateRating');
    expect(store).not.toHaveProperty('priceRange');
    expect(store).not.toHaveProperty('hasMap');
    expect(store?.address).not.toHaveProperty('streetAddress');
    expect(canonicalUrl('/')).toBe('https://moinmuttonmart.in/');
    expect(canonicalUrl('/privacy/')).toBe('https://moinmuttonmart.in/privacy/');
  });
});
describe('India local hours, independent of accepting requests',()=>{
  const schedule:HoursSchedule={weekly:{mon:[],tue:[],wed:[],thu:[],fri:[],sat:[{start:540,end:720},{start:900,end:1200}],sun:[{start:0,end:60}]},exceptions:{}};
  const status=(iso:string,s=schedule)=>openingStatus(s,new Date(iso));
  it('uses Asia/Kolkata, half-open intervals, breaks and local midnight',()=>{
    expect(status('2026-11-28T03:29:59Z')).toBe('closed');
    expect(status('2026-11-28T03:30:00Z')).toBe('open');
    expect(status('2026-11-28T06:30:00Z')).toBe('closed');
    expect(status('2026-11-28T09:30:00Z')).toBe('open');
    expect(status('2026-11-28T14:30:00Z')).toBe('closed');
    expect(status('2026-11-28T18:30:00Z')).toBe('open');
    expect(status('2026-11-28T19:30:00Z')).toBe('closed');
  });
  it('replaces the entire local date for holiday closures and special hours',()=>{
    const exceptions={...schedule,exceptions:{'2026-11-28':[],'2026-11-29':[{start:600,end:660}]}};
    expect(status('2026-11-28T03:30:00Z',exceptions)).toBe('closed');
    expect(status('2026-11-28T18:30:00Z',exceptions)).toBe('closed');
    expect(status('2026-11-29T04:30:00Z',exceptions)).toBe('open');
  });
  it('fails closed to unknown for missing or invalid schedules',()=>{
    expect(openingStatus(null,new Date())).toBe('unknown');
    expect(openingStatus(schedule,new Date('invalid'))).toBe('unknown');
    expect(status('2026-11-28T03:30:00Z',{...schedule,weekly:{...schedule.weekly,sat:[{start:100,end:99}]}})).toBe('unknown');
    expect(status('2026-11-28T03:30:00Z',{...schedule,weekly:{...schedule.weekly,sat:[{start:0,end:1000},{start:999,end:1100}]}})).toBe('unknown');
  });
});
