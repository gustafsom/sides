import { resolve } from 'node:path';
import { writeWindowsManifest, verifyWindowsPackage } from '../src/windows-package.mjs';

const [rootArg,versionArg]=process.argv.slice(2);
if(!rootArg||!versionArg){
  console.error('Uso: node scripts/generate-windows-manifest.mjs <pasta-pacote> <versao>');
  process.exit(2);
}
const root=resolve(rootArg);
const manifest=writeWindowsManifest(root,{version:versionArg});
const verified=verifyWindowsPackage(root);
if(!verified.ok){console.error(JSON.stringify(verified));process.exit(1);}
console.log(JSON.stringify({ok:true,version:manifest.appVersion,files:manifest.fileCount,manifestSha256:manifest.manifestSha256}));
