import test from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { openDatabase } from '../src/db.mjs';
import { createSidesServer } from '../src/server.mjs';

test('server is created without opening a network listener', ()=>{
  const db=openDatabase(':memory:');
  const server=createSidesServer({db,now:()=>new Date('2026-08-27T12:00:00Z')});
  assert.ok(server instanceof Server);
  assert.equal(server.listening,false);
});
