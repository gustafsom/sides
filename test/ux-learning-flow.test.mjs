import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectInterleavedSession } from '../src/learning.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('diagnostic radio controls are not affected by the large text-input rule',()=>{
  const css=read('public/styles.css');
  assert.match(css,/input:not\(\[type="radio"\]\):not\(\[type="checkbox"\]\)/);
  assert.match(css,/\.practice \.options input\[type="radio"\]/);
  assert.match(css,/\.options label\s*\{/);
  assert.match(css,/accent-color:\s*#60a5fa/);
});

test('dark theme provides explicit high-contrast links and keyboard focus',()=>{
  const css=read('public/styles.css');
  assert.match(css,/a, a:visited \{ color: #93c5fd/);
  assert.match(css,/focus-visible/);
  assert.match(css,/\.footerNote \{ color: #94a3b8/);
});

test('dashboard exposes persistent navigation and distinguishes guided trail from quick practice',()=>{
  const html=read('public/index.html');
  assert.match(html,/class="moduleNav"/);
  assert.match(html,/Trilha de hoje/);
  assert.match(html,/href="\/immersion\.html"/);
  assert.match(html,/href="\/speech\.html"/);
  assert.match(html,/href="\/writing\.html"/);
  assert.match(html,/href="\/integrity\.html"/);
  assert.match(html,/data-start-session/);
  assert.match(html,/Treino rápido/);
});

test('interleaved selector really alternates available learning lanes',()=>{
  const items=selectInterleavedSession({
    dueVocabulary:[{id:1},{id:2}],
    learning:[{id:3,kind:'chunk'},{id:4,kind:'contrast'}],
    grammar:[{id:5},{id:6}],
    listening:[{id:7},{id:8}],
    reading:[{id:9},{id:10}],
    limit:10
  });
  assert.deepEqual(items.slice(0,5).map(x=>x.kind),['vocabulary','chunk','grammar','listening','reading']);
  assert.equal(new Set(items.map(x=>x.kind)).size>=5,true);
});

test('frontend guided trail advances between planned kinds instead of recursively staying in one mode',()=>{
  const app=read('public/app.js');
  assert.match(app,/api\/session\?limit=12/);
  assert.match(app,/function advanceGuidedSession\(/);
  assert.match(app,/function startSessionStep\(/);
  assert.match(app,/continueAfterActivity\(/);
  assert.match(app,/Passo \$\{stepNumber\} de \$\{total\}/);
  assert.match(app,/Você não precisa escolher a próxima tela/);
});

test('grammar feedback uses plain-language coaching with optional compact rule',()=>{
  const app=read('public/app.js');
  assert.match(app,/const grammarFriendly =/);
  assert.match(app,/Em palavras simples/);
  assert.match(app,/Atalho mental/);
  assert.match(app,/Ver regra resumida/);
  assert.match(app,/Identidade ou origem → ser\. Estado ou localização → estar\./);
});
