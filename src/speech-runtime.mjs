import { existsSync, readdirSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT=resolve('.');
const DEFAULT_MODEL=resolve('models/whisper/ggml-base.bin');
let busy=false;

function walkForBinary(dir,depth=3){
  if(depth<0||!existsSync(dir))return null;
  for(const ent of readdirSync(dir,{withFileTypes:true})){
    const p=join(dir,ent.name);
    if(ent.isFile()&&/^whisper-cli(?:\.exe)?$/i.test(ent.name))return p;
    if(ent.isDirectory()){const found=walkForBinary(p,depth-1);if(found)return found;}
  }
  return null;
}

export function resolveWhisperConfig(env=process.env){
  const explicit=env.SIDES_WHISPER_BIN?resolve(env.SIDES_WHISPER_BIN):null;
  const binary=explicit&&existsSync(explicit)?explicit:walkForBinary(resolve('tools/whisper'),4)||walkForBinary(resolve('tools/whisper.cpp/build/bin'),3);
  const model=resolve(env.SIDES_WHISPER_MODEL||DEFAULT_MODEL);
  return {binary,model,binaryReady:Boolean(binary&&existsSync(binary)),modelReady:existsSync(model)};
}

export function speechRuntimeStatus(env=process.env){
  const x=resolveWhisperConfig(env);
  return {
    engine:'whisper.cpp',
    ready:x.binaryReady&&x.modelReady,
    busy,
    binaryReady:x.binaryReady,
    modelReady:x.modelReady,
    binaryName:x.binary?basename(x.binary):null,
    modelName:x.modelReady?basename(x.model):basename(x.model),
    language:'es',
    modelPersistence:'local-file',
    audioPersistence:'temporary-only'
  };
}

function run(bin,args,{timeoutMs=180000}={}){
  return new Promise((resolveRun,reject)=>{
    const child=spawn(bin,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
    const timer=setTimeout(()=>{child.kill();reject(new Error('WHISPER_TIMEOUT'))},timeoutMs);
    child.on('error',err=>{clearTimeout(timer);reject(new Error(`WHISPER_EXEC_FAILED:${err.code||err.message}`))});
    child.on('close',code=>{clearTimeout(timer);code===0?resolveRun({stdout,stderr}):reject(new Error(`WHISPER_EXIT_${code}`))});
  });
}

export function parseWhisperJson(value){
  const data=typeof value==='string'?JSON.parse(value):value;
  const result=String(data?.transcription?.map?.(x=>x.text||'').join(' ')||data?.text||'').replace(/\s+/g,' ').trim();
  return {text:result,raw:data};
}

export async function transcribeWhisper(wavBuffer,{env=process.env,runner=run}={}){
  if(!Buffer.isBuffer(wavBuffer)||wavBuffer.length<44)throw new Error('WAV_INVALID');
  if(wavBuffer.length>12_000_000)throw new Error('WAV_TOO_LARGE');
  const cfg=resolveWhisperConfig(env);
  if(!cfg.binaryReady||!cfg.modelReady)throw new Error('WHISPER_NOT_CONFIGURED');
  if(busy)throw new Error('WHISPER_BUSY');
  busy=true;
  const dir=await mkdtemp(join(tmpdir(),'sides-whisper-'));
  const input=join(dir,'input.wav'),out=join(dir,'result');
  try{
    await writeFile(input,wavBuffer,{mode:0o600});
    await runner(cfg.binary,['-m',cfg.model,'-f',input,'-l','es','--output-json-full','--output-file',out,'--no-prints','--no-timestamps']);
    const json=await readFile(`${out}.json`,'utf8');
    const parsed=parseWhisperJson(json);
    if(!parsed.text)throw new Error('WHISPER_EMPTY_TRANSCRIPT');
    return {transcript:parsed.text,engine:'whisper.cpp',model:basename(cfg.model)};
  }finally{busy=false;await rm(dir,{recursive:true,force:true});}
}
