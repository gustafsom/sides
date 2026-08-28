import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.mjs';
import { checkVocabulary, completeSpeaking, curriculumStatus, dashboard, dailySession, errorNotebook, exportData, getVocabularyCard, nextLearningItem, placementItems, progressDashboard, randomGrammar, randomListening, randomReading, submitGrammar, submitLearningItem, submitListening, submitPlacement, submitReading, submitVocabulary, updatePreferences } from './service.mjs';
import { completeJwSpeaking, jwOverview, jwSessionPlan, nextBibleBook, nextJwVocabulary, submitBibleBook, submitJwVocabulary } from './jw-service.mjs';
import { assignmentOverview, createAssignment, getAssignment, listAssignments, recordAssignmentPractice, updateAssignment } from './assignments.mjs';
import { analyzeSpeech, nextSpeechTarget, speechOverview } from './speech-service.mjs';
import { speechRuntimeStatus, transcribeWhisper } from './speech-runtime.mjs';
import { piperStatus, synthesizePiper } from './tts-runtime.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const PUBLIC = join(ROOT,'public');
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Cache-Control':'no-store'
};

function json(res,status,data) {
  res.writeHead(status,{...securityHeaders,'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(data));
}
function binary(res,status,data,type='application/octet-stream'){
  res.writeHead(status,{...securityHeaders,'Content-Type':type,'Content-Length':data.length});res.end(data);
}

async function rawBody(req,max=1_000_000) {
  let size=0; const chunks=[];
  for await (const chunk of req) {size+=chunk.length;if(size>max)throw new Error('PAYLOAD_TOO_LARGE');chunks.push(chunk)}
  return Buffer.concat(chunks);
}
async function body(req,max=1_000_000) {
  const raw=await rawBody(req,max);if(!raw.length)return {};return JSON.parse(raw.toString('utf8'));
}

async function staticFile(req,res) {
  let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (path === '/') path='/index.html';
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
  const file = resolve(PUBLIC,'.'+safe);
  if (!file.startsWith(PUBLIC)) return false;
  try {
    const data = await readFile(file);
    res.writeHead(200,{...securityHeaders,'Content-Type':MIME[extname(file)]||'application/octet-stream'});
    res.end(data); return true;
  } catch { return false; }
}

function extendedExport(db) {
  const data=exportData(db);
  data.schemaVersion='SIDES-EXPORT-V5';
  for(const table of ['jw_assignments','jw_assignment_practices','speech_attempts']){
    const exists=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if(exists)data.tables[table]=db.prepare(`SELECT * FROM ${table}`).all();
  }
  return data;
}

export function createSidesServer({db=openDatabase(), now=()=>new Date()}={}) {
  return createServer(async (req,res)=>{
    try {
      const url = new URL(req.url,'http://localhost');
      if (url.pathname === '/api/health' && req.method==='GET') return json(res,200,{ok:true,app:'SIDES',schema:'SIDES-API-V5',time:now().toISOString()});
      if (url.pathname === '/api/dashboard' && req.method==='GET') return json(res,200,dashboard(db,now()));
      if (url.pathname === '/api/progress' && req.method==='GET') return json(res,200,progressDashboard(db,now(),Number(url.searchParams.get('days')||30)));
      if (url.pathname === '/api/curriculum' && req.method==='GET') return json(res,200,curriculumStatus(db));
      if (url.pathname === '/api/vocabulary/next' && req.method==='GET') return json(res,200,{item:getVocabularyCard(db,now())});
      if (url.pathname === '/api/vocabulary/check' && req.method==='POST') return json(res,200,checkVocabulary(db,await body(req)));
      if (url.pathname === '/api/vocabulary/review' && req.method==='POST') return json(res,200,submitVocabulary(db,await body(req),now()));
      if (url.pathname === '/api/learning/next' && req.method==='GET') return json(res,200,{item:nextLearningItem(db,url.searchParams.get('kind')||'chunk',now(),url.searchParams.get('skill')||null)});
      if (url.pathname === '/api/learning/answer' && req.method==='POST') return json(res,200,submitLearningItem(db,await body(req),now()));
      if (url.pathname === '/api/grammar/next' && req.method==='GET') return json(res,200,{item:randomGrammar(db,url.searchParams.get('skill')||null)});
      if (url.pathname === '/api/grammar/answer' && req.method==='POST') return json(res,200,submitGrammar(db,await body(req),now()));
      if (url.pathname === '/api/listening/next' && req.method==='GET') return json(res,200,{item:randomListening(db)});
      if (url.pathname === '/api/listening/answer' && req.method==='POST') return json(res,200,submitListening(db,await body(req),now()));
      if (url.pathname === '/api/reading/next' && req.method==='GET') return json(res,200,{item:randomReading(db)});
      if (url.pathname === '/api/reading/answer' && req.method==='POST') return json(res,200,submitReading(db,await body(req),now()));
      if (url.pathname === '/api/placement' && req.method==='GET') return json(res,200,{items:placementItems(db)});
      if (url.pathname === '/api/placement' && req.method==='POST') return json(res,200,submitPlacement(db,await body(req),now()));
      if (url.pathname === '/api/speaking/complete' && req.method==='POST') return json(res,200,completeSpeaking(db,await body(req),now()));
      if (url.pathname === '/api/session' && req.method==='GET') return json(res,200,{items:dailySession(db,Math.min(50,Math.max(5,Number(url.searchParams.get('limit')||20))))});
      if (url.pathname === '/api/errors' && req.method==='GET') return json(res,200,{items:errorNotebook(db,Number(url.searchParams.get('limit')||30))});
      if (url.pathname === '/api/preferences' && req.method==='POST') return json(res,200,updatePreferences(db,await body(req)));

      if (url.pathname === '/api/jw/overview' && req.method==='GET') return json(res,200,jwOverview(db));
      if (url.pathname === '/api/jw/vocabulary/next' && req.method==='GET') return json(res,200,{item:nextJwVocabulary(db)});
      if (url.pathname === '/api/jw/vocabulary/answer' && req.method==='POST') return json(res,200,submitJwVocabulary(db,await body(req),now()));
      if (url.pathname === '/api/jw/bible-book/next' && req.method==='GET') return json(res,200,{item:nextBibleBook(db)});
      if (url.pathname === '/api/jw/bible-book/answer' && req.method==='POST') return json(res,200,submitBibleBook(db,await body(req),now()));
      if (url.pathname === '/api/jw/speaking/complete' && req.method==='POST') return json(res,200,completeJwSpeaking(db,await body(req),now()));
      if (url.pathname === '/api/jw/session' && req.method==='GET') return json(res,200,{items:jwSessionPlan()});

      if (url.pathname === '/api/jw/assignments/overview' && req.method==='GET') return json(res,200,assignmentOverview(db,now()));
      if (url.pathname === '/api/jw/assignments' && req.method==='GET') return json(res,200,{items:listAssignments(db,now())});
      if (url.pathname === '/api/jw/assignments' && req.method==='POST') return json(res,201,createAssignment(db,await body(req),now()));
      const practiceMatch=url.pathname.match(/^\/api\/jw\/assignments\/(\d+)\/practice$/);
      if (practiceMatch && req.method==='POST') return json(res,201,recordAssignmentPractice(db,Number(practiceMatch[1]),await body(req),now()));
      const assignmentMatch=url.pathname.match(/^\/api\/jw\/assignments\/(\d+)$/);
      if (assignmentMatch && req.method==='GET') return json(res,200,getAssignment(db,Number(assignmentMatch[1]),now()));
      if (assignmentMatch && (req.method==='PATCH'||req.method==='PUT')) return json(res,200,updateAssignment(db,Number(assignmentMatch[1]),await body(req),now()));

      if (url.pathname === '/api/speech/status' && req.method==='GET') return json(res,200,{whisper:speechRuntimeStatus(),piper:piperStatus()});
      if (url.pathname === '/api/speech/overview' && req.method==='GET') return json(res,200,speechOverview(db,Number(url.searchParams.get('days')||30),now()));
      if (url.pathname === '/api/speech/target' && req.method==='GET') return json(res,200,{item:nextSpeechTarget(db,url.searchParams.get('kind')||'shadowing')});
      if (url.pathname === '/api/speech/transcribe' && req.method==='POST') {
        if(!String(req.headers['content-type']||'').toLowerCase().startsWith('audio/wav'))throw new Error('WAV_CONTENT_TYPE_REQUIRED');
        return json(res,200,await transcribeWhisper(await rawBody(req,12_000_000)));
      }
      if (url.pathname === '/api/speech/analyze' && req.method==='POST') return json(res,200,analyzeSpeech(db,await body(req),now()));
      if (url.pathname === '/api/speech/tts' && req.method==='POST') return binary(res,200,await synthesizePiper((await body(req)).text), 'audio/wav');

      if (url.pathname === '/api/export' && req.method==='GET') {
        const data=extendedExport(db);
        res.writeHead(200,{...securityHeaders,'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="SIDES-backup-${new Date().toISOString().slice(0,10)}.json"`});
        return res.end(JSON.stringify(data,null,2));
      }
      if (url.pathname.startsWith('/api/')) return json(res,404,{error:'NOT_FOUND'});
      if (req.method==='GET' && await staticFile(req,res)) return;
      json(res,404,{error:'NOT_FOUND'});
    } catch (error) {
      const message = error?.message || 'INTERNAL_ERROR';
      const status = message === 'PAYLOAD_TOO_LARGE'||message==='WAV_TOO_LARGE' ? 413 : message.includes('NOT_FOUND') ? 404 : message==='WHISPER_BUSY' ? 409 : message.includes('NOT_CONFIGURED') ? 503 : 400;
      json(res,status,{error:message});
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const db=openDatabase();
  const server=createSidesServer({db});
  const port=Number(process.env.SIDES_PORT||4317);
  server.listen(port,'127.0.0.1',()=>{
    console.log(`SIDES disponível em http://127.0.0.1:${port}`);
    console.log('Dados locais: data/sides.sqlite | Telemetria: desativada | Rede: loopback-only');
  });
}
