// Bloco 10 — economia de XP efetivo.
// O XP bruto permanece como trilha histórica. Nível e metas usam XP efetivo,
// que reduz retornos por repetição próxima e aplica um teto diário de gamificação.

const DAY_MS=86_400_000;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n||0)));
const pad2=n=>String(n).padStart(2,'0');
const localDay=date=>`${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;

function repeatMultiplier(previousAt,currentAt){
  if(!previousAt)return 1;
  const hours=(currentAt-previousAt)/3_600_000;
  if(hours<=1)return 0.10;
  if(hours<=6)return 0.25;
  if(hours<=24)return 0.50;
  if(hours<=72)return 0.75;
  return 1;
}

export function effectiveXpReport(db,now=new Date(),{dailyCap=500}={}){
  const rows=db.prepare(`SELECT id,item_type,item_id,mode,correct,xp,reviewed_at FROM reviews ORDER BY reviewed_at ASC,id ASC`).all();
  const lastBySource=new Map(),dayCredit=new Map(),dayRaw=new Map();
  let credited=0,raw=0,discounted=0,capped=0;
  const recent=[];
  for(const row of rows){
    const at=new Date(row.reviewed_at);if(Number.isNaN(at.getTime()))continue;
    const key=`${row.item_type}:${row.item_id}:${row.mode}`;
    const gross=Math.max(0,Number(row.xp||0));
    const mult=repeatMultiplier(lastBySource.get(key),at);
    let candidate=Math.round(gross*mult);
    const day=localDay(at),used=dayCredit.get(day)||0,remaining=Math.max(0,Number(dailyCap)-used);
    const credit=Math.min(candidate,remaining);
    if(candidate>remaining)capped+=candidate-remaining;
    credited+=credit;raw+=gross;discounted+=Math.max(0,gross-candidate);
    dayCredit.set(day,used+credit);dayRaw.set(day,(dayRaw.get(day)||0)+gross);
    lastBySource.set(key,at);
    if(at>=new Date(now.getTime()-7*DAY_MS))recent.push({id:Number(row.id),source:key,raw:gross,credited:credit,multiplier:mult,at:row.reviewed_at});
  }
  const today=localDay(now),weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
  let weekCredited=0,weekRaw=0;
  for(const [day,value] of dayCredit){const d=new Date(`${day}T12:00:00`);if(d>=weekStart&&d<=now)weekCredited+=value;}
  for(const [day,value] of dayRaw){const d=new Date(`${day}T12:00:00`);if(d>=weekStart&&d<=now)weekRaw+=value;}
  return {
    policy:'SIDES-XP-V2',dailyCap:Number(dailyCap),rawXp:raw,creditedXp:credited,discountedXp:discounted,cappedXp:capped,
    today:{raw:dayRaw.get(today)||0,credited:dayCredit.get(today)||0,remaining:Math.max(0,Number(dailyCap)-(dayCredit.get(today)||0))},
    week:{raw:weekRaw,credited:weekCredited},
    recent:recent.slice(-20).reverse(),
    explanation:'Repetir o mesmo item em pouco tempo rende progressivamente menos XP. O estudo continua liberado; somente a recompensa de gamificação diminui.'
  };
}

export function effectiveLevel(xp){
  const safe=clamp(xp,0,Number.MAX_SAFE_INTEGER);
  return Math.floor(Math.sqrt(safe/120))+1;
}
