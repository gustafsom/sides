const stripMarks=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');

export function normalizeSpeechText(value,{stripAccents=false}={}){
  let s=String(value??'').toLowerCase().normalize('NFC').replace(/[¿¡]/g,'').replace(/[^\p{L}\p{N}'-]+/gu,' ').replace(/\s+/g,' ').trim();
  if(stripAccents)s=stripMarks(s);
  return s;
}

export function tokenizeSpeech(value,options={}){
  const s=normalizeSpeechText(value,options);
  return s?s.split(' '):[];
}

function sameLoose(a,b){return stripMarks(a)===stripMarks(b)}

export function alignSpeech(expected,recognized){
  const a=tokenizeSpeech(expected),b=tokenizeSpeech(recognized);
  const n=a.length,m=b.length;
  const dp=Array.from({length:n+1},()=>Array(m+1).fill(0));
  const op=Array.from({length:n+1},()=>Array(m+1).fill(''));
  for(let i=1;i<=n;i++){dp[i][0]=i;op[i][0]='omit'}
  for(let j=1;j<=m;j++){dp[0][j]=j;op[0][j]='add'}
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
    const exact=a[i-1]===b[j-1],loose=sameLoose(a[i-1],b[j-1]);
    const sub=dp[i-1][j-1]+(exact?0:loose?0.25:1),del=dp[i-1][j]+1,ins=dp[i][j-1]+1;
    const best=Math.min(sub,del,ins);dp[i][j]=best;
    op[i][j]=best===sub?(exact?'match':loose?'accent':'substitute'):best===del?'omit':'add';
  }
  const steps=[];let i=n,j=m;
  while(i>0||j>0){
    const kind=op[i][j];
    if(kind==='match'||kind==='accent'||kind==='substitute'){
      steps.push({kind,expected:a[i-1],recognized:b[j-1]});i--;j--;
    }else if(kind==='omit'){steps.push({kind,expected:a[i-1],recognized:null});i--}
    else{steps.push({kind:'add',expected:null,recognized:b[j-1]});j--}
  }
  steps.reverse();
  const counts={match:0,accent:0,substitute:0,omit:0,add:0};
  for(const step of steps)counts[step.kind]++;
  const correct=counts.match+counts.accent;
  const accuracy=n?Math.round(correct/n*100):0;
  const strictAccuracy=n?Math.round(counts.match/n*100):0;
  return {steps,counts,expectedWords:n,recognizedWords:m,correctWords:correct,accuracy,strictAccuracy};
}

export function speechMetrics({expected,recognized,durationMs=0,audioStats={}}={}){
  const alignment=alignSpeech(expected,recognized);
  const minutes=Math.max(0,Number(durationMs||audioStats.durationMs||0))/60000;
  const wpm=minutes>0?Math.round(alignment.recognizedWords/minutes):0;
  const pauseCount=Math.max(0,Number(audioStats.pauseCount||0));
  const longPauses=Math.max(0,Number(audioStats.longPauses||0));
  const maxPauseMs=Math.max(0,Number(audioStats.maxPauseMs||0));
  const totalSilenceMs=Math.max(0,Number(audioStats.totalSilenceMs||0));
  const speechRatio=durationMs>0?Math.max(0,Math.min(1,1-totalSilenceMs/Number(durationMs))):0;
  const flags=[];
  if(alignment.accuracy<70)flags.push('correspondence-low');
  else if(alignment.accuracy<88)flags.push('correspondence-developing');
  if(alignment.counts.omit>0)flags.push('omissions');
  if(alignment.counts.substitute>0)flags.push('substitutions');
  if(alignment.counts.add>0)flags.push('additions');
  if(alignment.counts.accent>0)flags.push('accent-differences');
  if(longPauses>=3)flags.push('many-long-pauses');
  if(wpm>0&&wpm<65)flags.push('pace-slow');
  if(wpm>180)flags.push('pace-fast');
  return {...alignment,wpm,pauseCount,longPauses,maxPauseMs,totalSilenceMs,speechRatio:Number(speechRatio.toFixed(2)),flags};
}

export function speechGuidance(metrics){
  const items=[];
  if(metrics.counts.omit)items.push(`Há ${metrics.counts.omit} palavra(s) esperada(s) não reconhecida(s). Treine o trecho em grupos curtos e repita sem olhar.`);
  if(metrics.counts.substitute)items.push(`Há ${metrics.counts.substitute} substituição(ões). Compare as palavras trocadas e faça uma repetição lenta antes de voltar ao ritmo normal.`);
  if(metrics.counts.add)items.push(`Há ${metrics.counts.add} adição(ões). Observe se você está inserindo muletas ou palavras que não fazem parte do texto-alvo.`);
  if(metrics.counts.accent)items.push('A correspondência lexical está boa, mas há diferenças de acentuação/grafia na transcrição. Use isso apenas como pista, não como avaliação fonética.');
  if(metrics.longPauses>=3)items.push('Foram detectadas várias pausas longas. Marque unidades de sentido e tente manter cada grupo de palavras conectado.');
  if(metrics.wpm>0&&metrics.wpm<65)items.push('O ritmo ficou lento para uma leitura contínua. Primeiro preserve clareza; depois repita o mesmo trecho um pouco mais fluido.');
  if(metrics.wpm>180)items.push('O ritmo ficou muito acelerado. Reduza a velocidade e preserve articulação, pausas e sentido.');
  if(!items.length)items.push('A correspondência do texto está estável. Repita buscando naturalidade, expressão e menos dependência visual.');
  return items.slice(0,4);
}
