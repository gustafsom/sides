import { resolve } from 'node:path';
import { verifyWindowsPackage } from '../src/windows-package.mjs';

const [rootArg]=process.argv.slice(2);
if(!rootArg){console.error('Uso: node scripts/verify-windows-package.mjs <pasta-pacote>');process.exit(2);}
const result=verifyWindowsPackage(resolve(rootArg));
if(!result.ok){console.error(JSON.stringify(result));process.exit(1);}
console.log(JSON.stringify(result));
