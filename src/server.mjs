import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.mjs';
import { checkVocabulary, completeSpeaking, dashboard, dailySession, errorNotebook, exportData, getVocabularyCard, placementItems, randomGrammar, randomListening, randomReading, submitGrammar, submitListening, submitPlacement, submitReading, submitVocabulary, updatePreferences } from './service.mjs';
import { completeJwSpeaking, jwOverview, jwSessionPlan, nextBibleBook, nextJwVocabulary, submitBibleBook, submitJwVocabulary } from './jw-service.mjs';

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

async function body(req,max=1_000_000) {
  let size=0; const chunks=[];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
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

export function createSidesServer({db=openDatabase(), now=()=>new Date()}={}) {
  return createServer(async (req,res)=>{
    try {
      const url = new URL(req.url,'http://localhost');
      if (url.pathname === '/api/health' && req.method==='GET') return json(res,200,{ok:true,app:'SIDES',schema:'SIDES-API-V1',time:now().toISOString()});
      if (url.pathname === '/api/dashboard' && req.method==='GET') return json(res,200,dashboard(db,now()));
      if (url.pathname === '/api/vocabulary/next' && req.method==='GET') return json(res,200,{item:getVocabularyCard(db,now())});
      if (url.pathname === '/api/vocabulary/check' && req.method==='POST') return json(res,200,checkVocabulary(db,await body(req)));
      if (url.pathname === '/api/vocabulary/review' && req.method==='POST') return json(res,200,submitVocabulary(db,await body(req),now()));
      if (url.pathname === '/api/grammar/next' && req.method==='GET') return json(res,200,{item:randomGrammar(db)});
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
      if (url.pathname === '/api/jw/session' && req.method==='GET') return json(res,200,{items:jwSessionPlan()});
      if (url.pathname === '/api/jw/vocabulary/next' && req.method==='GET') return json(res,200,{item:nextJwVocabulary(db)});
      if (url.pathname === '/api/jw/vocabulary/answer' && req.method==='POST') return json(res,200,submitJwVocabulary(db,await body(req),now()));
      if (url.pathname === '/api/jw/bible-book/next' && req.method==='GET') return json(res,200,{item:nextBibleBook(db)});
      if (url.pathname === '/api/jw/bible-book/answer' && req.method==='POST') return json(res,200,submitBibleBook(db,await body(req),now()));
      if (url.pathname === '/api/jw/speaking/complete' && req.method==='POST') return json(res,200,completeJwSpeaking(db,await body(req),now()));
      if (url.pathname === '/api/export' && req.method==='GET') {
        const data=exportData(db);
        res.writeHead(200,{...securityHeaders,'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="SIDES-backup-${new Date().toISOString().slice(0,10)}.json"`});
        return res.end(JSON.stringify(data,null,2));
      }
      if (url.pathname.startsWith('/api/')) return json(res,404,{error:'NOT_FOUND'});
      if (req.method==='GET' && await staticFile(req,res)) return;
      json(res,404,{error:'NOT_FOUND'});
    } catch (error) {
      const message = error?.message || 'INTERNAL_ERROR';
      const status = message === 'PAYLOAD_TOO_LARGE' ? 413 : message.includes('NOT_FOUND') ? 404 : message instanceof SyntaxError ? 400 : 400;
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
