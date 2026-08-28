import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

function configured(env=process.env){
  const model=env.SIDES_PIPER_MODEL?resolve(env.SIDES_PIPER_MODEL):null;
  const python=env.SIDES_PIPER_PYTHON||(process.platform==='win32'?'python':'python3');
  return {python,model,modelReady:Boolean(model&&existsSync(model))};
}

export function piperStatus(env=process.env){
  const c=configured(env);
  return {engine:'Piper',configured:Boolean(env.SIDES_PIPER_MODEL),modelReady:c.modelReady,ready:c.modelReady,modelName:c.model?basename(c.model):null,fallback:'SpeechSynthesis do navegador/SO'};
}

function run(bin,args,{timeoutMs=60000}={}){
  return new Promise((ok,fail)=>{
    const child=spawn(bin,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';
    child.stderr.setEncoding('utf8');child.stderr.on('data',d=>stderr+=d);
    const timer=setTimeout(()=>{child.kill();fail(new Error('PIPER_TIMEOUT'))},timeoutMs);
    child.on('error',e=>{clearTimeout(timer);fail(new Error(`PIPER_EXEC_FAILED:${e.code||e.message}`))});
    child.on('close',code=>{clearTimeout(timer);code===0?ok():fail(new Error(`PIPER_EXIT_${code}:${stderr.slice(-300)}`))});
  });
}

export async function synthesizePiper(text,{env=process.env,runner=run}={}){
  const value=String(text||'').trim();
  if(!value||value.length>1500)throw new Error('PIPER_TEXT_INVALID');
  const c=configured(env);if(!c.modelReady)throw new Error('PIPER_NOT_CONFIGURED');
  const dir=await mkdtemp(join(tmpdir(),'sides-piper-')),out=join(dir,'tts.wav');
  try{
    await runner(c.python,['-m','piper','-m',c.model,'-f',out,'--',value]);
    const wav=await readFile(out);if(wav.length<44)throw new Error('PIPER_EMPTY_AUDIO');
    return wav;
  }finally{await rm(dir,{recursive:true,force:true});}
}
