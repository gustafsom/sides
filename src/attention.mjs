import { retrievability, stateLabel } from './fsrs-adapter.mjs';

const DAY_MS = 86_400_000;
const clamp = (n,min,max)=>Math.max(min,Math.min(max,Number(n||0)));
const pct = (n,d)=>d?Math.round(n/d*100):0;
const isoDaysAgo=(now,days)=>new Date(now.getTime()-days*DAY_MS).toISOString();

const guidance = {
  'grammar:ser-estar':['Ser x estar','Use “ser” para identidade, característica e origem; use “estar” principalmente para estado e localização.','Faça 3 frases contrastando identidade/estado e localização/característica.'],
  'grammar:por-para':['Por x para','“Para” tende a indicar finalidade, destino ou destinatário. “Por” tende a indicar causa, meio, troca ou percurso.','Treine pares mínimos: “estudio para…” e “gracias por…”.'],
  'grammar:subjuntivo':['Subjuntivo','O subjuntivo aparece quando a ideia é desejada, hipotética, duvidosa ou ainda não realizada.','Produza frases com “quiero que”, “aunque” e “en cuanto”.'],
  'grammar:preterito-perfecto':['Pretérito perfecto','Liga uma ação passada a um período ainda percebido como atual em muitas variedades: “hoy he trabajado”.','Compare “hoy he…” com “ayer fui…”.'],
  'grammar:preterito-indefinido':['Pretérito indefinido','Marca fatos concluídos em um período encerrado: ayer fui, el año pasado viajé.','Conte três ações concluídas de ontem.'],
  'chunk:duracao':['Duração em andamento','“Llevar + período + gerundio” expressa há quanto tempo algo continua.','Diga há quanto tempo você estuda, trabalha ou participa de uma atividade.'],
  'chunk:percepcao':['Darse cuenta de','A expressão fixa é “darse cuenta de”. O “de” não deve ser omitido.','Crie duas frases com “me di cuenta de que…”.'],
  'contrast:falso-cognato-embarazada':['Falso cognato: embarazada','“Embarazada” significa grávida; “avergonzado(a)” é envergonhado(a).','Revise junto com outro falso cognato para fortalecer o contraste.'],
  'contrast:por-para-finalidade':['Finalidade com para','Use “para” quando a segunda ideia responde “para quê?”.','Complete oralmente cinco objetivos pessoais com “para + infinitivo”.'],
  'contrast:por-para-causa':['Causa com por','Use “por” quando a ideia responde “por qual motivo?”; “gracias por” é uma combinação frequente.','Pratique “gracias por…” com três exemplos.'],
  'jw:bible-books':['Livros da Bíblia','A recuperação rápida dos nomes e abreviações reduz a carga mental durante leituras e discursos.','Faça uma rodada curta português → espanhol e abreviação → livro.']
};

const genericByType = {
  vocabulary:['Vocabulário','A habilidade ainda não está estável. A recuperação ativa em frases ajuda mais do que releitura passiva.','Tente produzir a palavra antes de revelar e use-a em uma frase curta.'],
  grammar:['Gramática','Há um padrão gramatical que ainda gera erros.','Revise a explicação do último erro e faça 3 exemplos novos.'],
  listening:['Compreensão oral','A transcrição indica que a forma sonora ainda não está totalmente consolidada.','Ouça uma vez devagar, uma vez em velocidade normal e repita em voz alta.'],
  reading:['Compreensão de leitura','A recuperação das ideias do texto ainda precisa de reforço.','Leia uma vez sem traduzir e responda com suas próprias palavras.'],
  speaking:['Produção oral','A habilidade oral melhora com repetição curta e frequente, não apenas com sessões longas.','Grave, ouça e repita uma segunda vez corrigindo um único aspecto.'],
  chunk:['Frases e chunks','A expressão precisa se tornar uma unidade automática, sem tradução palavra por palavra.','Repita o chunk em três contextos diferentes.'],
  contrast:['Português x espanhol','Há interferência provável do português ou um falso cognato.','Estude o par em contraste e produza uma frase em espanhol.'],
  jw:['Trilha JW','Este ponto merece reforço para uso espontâneo em reuniões, leituras ou discursos.','Faça uma prática curta e específica na Trilha JW.']
};

export function guidanceFor(skillType,skillKey) {
  const exact=guidance[`${skillType}:${skillKey}`]||guidance[`jw:${skillKey}`];
  const [title,explanation,recommendation]=exact||genericByType[skillType]||['Ponto de atenção','O histórico mostra desempenho abaixo do seu padrão atual.','Faça uma revisão curta e volte a testar sem consultar a resposta.'];
  return {title,explanation,recommendation};
}

function eventWindow(db,start,end) {
  return new Map(db.prepare(`SELECT skill_type,skill_key,COUNT(*) attempts,SUM(correct) correct
    FROM skill_events WHERE created_at>=? AND created_at<? GROUP BY skill_type,skill_key`).all(start,end)
    .map(x=>[`${x.skill_type}|${x.skill_key}`,{attempts:Number(x.attempts),correct:Number(x.correct)}]));
}

export function attentionReport(db,now=new Date(),limit=8) {
  const recentStart=isoDaysAgo(now,14), previousStart=isoDaysAgo(now,28), end=now.toISOString();
  const recent=eventWindow(db,recentStart,end), previous=eventWindow(db,previousStart,recentStart);
  const errors=new Map(db.prepare(`SELECT skill_key,COUNT(*) total,
      SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) open,
      SUM(CASE WHEN created_at>=? THEN 1 ELSE 0 END) recent
    FROM error_log GROUP BY skill_key`).all(recentStart).map(x=>[x.skill_key,{total:Number(x.total),open:Number(x.open),recent:Number(x.recent)}]));
  const rows=db.prepare(`SELECT skill_type,skill_key,attempts,correct,score,last_seen_at FROM skill_mastery WHERE attempts>0`).all();
  return rows.map(row=>{
    const key=`${row.skill_type}|${row.skill_key}`;
    const err=errors.get(row.skill_key)||{total:0,open:0,recent:0};
    const r=recent.get(key),p=previous.get(key);
    const recentAccuracy=r?pct(r.correct,r.attempts):null;
    const previousAccuracy=p?pct(p.correct,p.attempts):null;
    const trend=recentAccuracy!=null&&previousAccuracy!=null?recentAccuracy-previousAccuracy:null;
    const daysSince=Math.max(0,(now-new Date(row.last_seen_at))/DAY_MS);
    let score=(1-Number(row.score))*55+Math.min(25,err.open*10)+Math.min(15,err.recent*5);
    if(trend!=null&&trend<0)score+=Math.min(10,Math.abs(trend)/3);
    if(daysSince>21&&Number(row.attempts)>=3)score+=5;
    if(Number(row.attempts)<3)score=Math.min(score,59);
    score=Math.round(clamp(score,0,100));
    const tier=score>=70?'urgent':score>=45?'focus':score>=25?'watch':'stable';
    const reasons=[];
    if(Number(row.score)<.55)reasons.push(`domínio estimado ${Math.round(Number(row.score)*100)}%`);
    if(err.open)reasons.push(`${err.open} erro(s) ainda aberto(s)`);
    if(err.recent)reasons.push(`${err.recent} erro(s) nos últimos 14 dias`);
    if(trend!=null&&trend<=-10)reasons.push(`precisão caiu ${Math.abs(trend)} p.p.`);
    if(!reasons.length)reasons.push('reforço preventivo');
    return {
      skillType:row.skill_type,skillKey:row.skill_key,attempts:Number(row.attempts),mastery:Math.round(Number(row.score)*100),
      attentionScore:score,tier,reasons,recentAccuracy,previousAccuracy,trend,openErrors:err.open,
      ...guidanceFor(row.skill_type,row.skill_key)
    };
  }).sort((a,b)=>b.attentionScore-a.attentionScore||b.openErrors-a.openErrors||a.mastery-b.mastery).slice(0,Math.max(1,Number(limit||8)));
}

function periodStats(db,start,end) {
  const row=db.prepare(`SELECT COUNT(*) attempts,COALESCE(SUM(correct),0) correct,COALESCE(SUM(xp),0) xp
    FROM reviews WHERE reviewed_at>=? AND reviewed_at<?`).get(start,end);
  return {attempts:Number(row.attempts),correct:Number(row.correct),xp:Number(row.xp),accuracy:pct(Number(row.correct),Number(row.attempts))};
}

export function progressDashboard(db,now=new Date(),days=30) {
  const safeDays=Math.min(180,Math.max(7,Number(days||30)));
  const start=isoDaysAgo(now,safeDays),end=now.toISOString();
  const activity=db.prepare(`SELECT day,xp,attempts,correct,minutes FROM activity WHERE day>=? ORDER BY day`).all(start.slice(0,10)).map(x=>({
    day:x.day,xp:Number(x.xp),attempts:Number(x.attempts),accuracy:pct(Number(x.correct),Number(x.attempts)),minutes:Number(x.minutes)
  }));
  const summaryRow=db.prepare(`SELECT COUNT(*) attempts,COALESCE(SUM(correct),0) correct,COALESCE(SUM(xp),0) xp FROM reviews WHERE reviewed_at>=?`).get(start);
  const activeDays=db.prepare('SELECT COUNT(*) n FROM activity WHERE day>=? AND attempts>0').get(start.slice(0,10)).n;
  const due=db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at<=?').get(end).n;
  const overdue7=db.prepare('SELECT COUNT(*) n FROM srs WHERE due_at<=? AND reps>0').get(isoDaysAgo(now,7)).n;
  const srsRows=db.prepare('SELECT * FROM srs').all();
  const stateCounts={new:0,learning:0,review:0,relearning:0};
  let retrievableSum=0,retrievableCount=0,mature=0;
  for(const row of srsRows){
    stateCounts[stateLabel(row.state)]+=1;
    if(Number(row.stability||0)>=21)mature+=1;
    const r=retrievability(row,now);if(r!=null&&Number(row.reps||0)>0){retrievableSum+=r;retrievableCount+=1;}
  }
  const modes=db.prepare(`SELECT mode,COUNT(*) attempts,SUM(correct) correct,SUM(xp) xp FROM reviews WHERE reviewed_at>=? GROUP BY mode ORDER BY attempts DESC`).all(start).map(x=>({
    mode:x.mode,attempts:Number(x.attempts),accuracy:pct(Number(x.correct),Number(x.attempts)),xp:Number(x.xp)
  }));
  const errorBreakdown=db.prepare(`SELECT error_kind,COUNT(*) count FROM error_log WHERE created_at>=? GROUP BY error_kind ORDER BY count DESC LIMIT 8`).all(start).map(x=>({kind:x.error_kind,count:Number(x.count)}));
  const recent=periodStats(db,isoDaysAgo(now,7),end),previous=periodStats(db,isoDaysAgo(now,14),isoDaysAgo(now,7));
  return {
    generatedAt:end,days:safeDays,
    summary:{
      attempts:Number(summaryRow.attempts),xp:Number(summaryRow.xp),accuracy:pct(Number(summaryRow.correct),Number(summaryRow.attempts)),activeDays:Number(activeDays),
      due:Number(due),overdue7:Number(overdue7),mature,averageRetrievability:retrievableCount?Math.round(retrievableSum/retrievableCount*100):null
    },
    trend:{
      recent,previous,
      accuracyDelta:recent.attempts&&previous.attempts?recent.accuracy-previous.accuracy:null,
      attemptsDelta:recent.attempts-previous.attempts,
      xpDelta:recent.xp-previous.xp
    },
    activity,modes,errorBreakdown,
    srs:{...stateCounts,total:srsRows.length,due:Number(due),overdue7:Number(overdue7)},
    attention:attentionReport(db,now,8)
  };
}
