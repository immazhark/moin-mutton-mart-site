/** Local calendar-day intervals in Asia/Kolkata. Midnight-spanning hours are split
 * into two day intervals; an exception replaces that whole local date. */
export const DAYS=['mon','tue','wed','thu','fri','sat','sun'] as const;
export type Day=typeof DAYS[number];
export type HoursWindow=Readonly<{start:number;end:number}>;
export type HoursSchedule=Readonly<{
  weekly:Readonly<Record<Day,readonly HoursWindow[]>>;
  exceptions:Readonly<Record<string,readonly HoursWindow[]>>;
}>;
export type OpeningStatus='open'|'closed'|'unknown';
const localFormat=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
  weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23',
});
function validDate(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const ms=Date.parse(value+'T00:00:00Z');
  return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===value;
}
function validWindows(value:readonly HoursWindow[]):boolean{
  if(!Array.isArray(value))return false;
  let last=0;
  for(const interval of value){
    if(!interval||!Number.isInteger(interval.start)||!Number.isInteger(interval.end)||
       interval.start<last||interval.start<0||interval.end>1440||interval.start>=interval.end)return false;
    last=interval.end;
  }
  return true;
}
/** Fail to unknown without a complete, valid schedule. Never infer opening hours
 * from the daily catalogue's acceptingRequests flag, rates, or available stock. */
export function openingStatus(schedule:HoursSchedule|null,at:Date):OpeningStatus{
  if(!schedule||!Number.isFinite(at.getTime()))return 'unknown';
  if(!schedule.weekly||!schedule.exceptions||DAYS.some(day=>!validWindows(schedule.weekly[day]))||
     Object.entries(schedule.exceptions).some(([date,windows])=>!validDate(date)||!validWindows(windows)))return 'unknown';
  const parts=Object.fromEntries(localFormat.formatToParts(at).map(({type,value})=>[type,value]));
  const date=parts.year+'-'+parts.month+'-'+parts.day;
  const day=parts.weekday?.toLowerCase() as Day;
  const minute=Number(parts.hour)*60+Number(parts.minute);
  if(!DAYS.includes(day)||!Number.isInteger(minute)||minute<0||minute>=1440)return 'unknown';
  const windows=Object.hasOwn(schedule.exceptions,date)?schedule.exceptions[date]:schedule.weekly[day];
  return windows.some(({start,end})=>minute>=start&&minute<end)?'open':'closed';
}
