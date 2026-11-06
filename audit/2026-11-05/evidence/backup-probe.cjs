const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module');
const root=process.env.AUDIT_REPO;process.chdir(__dirname);
process.env.DATABASE_URL='postgresql://audit:audit@127.0.0.1:1/audit';
const original=Module._load;
Module._load=function(request,parent){
 const p=Module._resolveFilename(request,parent).replaceAll('\\','/');
 if(p.endsWith('/backend/dist/utils/logger.js'))return{logger:{error(){},warn(){},info(){}}};
 return original.apply(this,arguments);
};
require('node:child_process').exec=(command,options,cb)=>{
 const file=command.match(/"([^"]+\.sql)"/)[1];
 assert.ok(path.resolve(file).startsWith(path.resolve(__dirname)+path.sep));
 fs.writeFileSync(file,'-- fixture partial pg_dump\n');
 cb(new Error('fixture pg_dump failed'),'', 'fixture failure');
};
(async()=>{
 const backup=require(path.join(root,'backend/dist/services/backup.service'));
 await assert.rejects(backup.createDatabaseBackup(),/fixture pg_dump failed/);
 const published=await backup.getBackupsList();assert.ok(published.length>0);
 console.log(JSON.stringify({failedDumpListedAsBackup:true,listedFiles:published.map(f=>({fileName:f.fileName,sizeBytes:f.sizeBytes}))}));
})().catch(e=>{console.error(e);process.exitCode=1});
