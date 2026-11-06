// Real Express routers and real JWT middleware; endpoint handlers are inert fixtures.
const path=require('node:path'),fs=require('node:fs'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.AUDIT_REPO;process.chdir(__dirname);process.env.NODE_ENV='test';process.env.JWT_SECRET='audit-route-secret-over-thirty-two-characters';
const original=Module._load;
Module._load=function(request,parent){
 const p=Module._resolveFilename(request,parent).replaceAll('\\','/');
 if(p.endsWith('/backend/dist/config/db.js'))return {prisma:{user:{findUnique:async()=>({id:'client',role:'CLIENT',tokenVersion:0,isBlocked:false})}}};
 if(p.includes('/backend/dist/controllers/'))return new Proxy({}, {get:(_,name)=>Object.defineProperty((req,res)=>res.status(204).end(), 'name',{value:String(name)})});
 if(p.endsWith('/backend/dist/middleware/upload.middleware.js'))return new Proxy({}, {get:()=>({single:()=>function uploadFixture(req,res,next){next()}})});
 if(p.endsWith('/backend/dist/utils/logger.js'))return {logger:{error(){},info(){},warn(){}}};
 return original.apply(this,arguments);
};
(async()=>{
 const express=require(path.join(root,'backend/node_modules/express'));const jwt=require(path.join(root,'backend/node_modules/jsonwebtoken'));
 const app=express();app.use(express.json());const checks=[];
 const publicEndpoints=new Set(['auth:post:/send-register-code','auth:post:/register','auth:post:/login','auth:post:/forgot-password','auth:post:/reset-password','calculator:post:/','leads:post:/','logs:post:/frontend','tariffs:get:/','labelTemplates:get:/','labelTemplates:get:/:id','payments:post:/freedom/check','payments:post:/freedom/check.php','payments:post:/freedom/result','payments:post:/freedom/result.php']);
 for(const file of fs.readdirSync(path.join(root,'backend/dist/routes')).filter(f=>f.endsWith('.routes.js'))){
  const name=file.replace('.routes.js','');const router=require(path.join(root,'backend/dist/routes',file)).default;app.use('/'+name,router);
  let globalAdmin=false;
  for(const layer of router.stack){
   if(!layer.route){if(layer.name==='requireAdmin')globalAdmin=true;continue}
   const route=layer.route;const admin=globalAdmin||route.stack.some(s=>s.name==='requireAdmin');
   for(const m of Object.keys(route.methods)){const method=m==='_all'?'post':m;const key=name+':'+method+':'+route.path;
    checks.push({key,name,method,path:'/'+name+route.path.replace(/:[^/]+/g,'fixture'),protected:!publicEndpoints.has(key),admin});
   }
  }
 }
 for(const c of checks)if(c.key==='calculator:post:/calculate')c.protected=false;
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const token=jwt.sign({id:'client',role:'CLIENT',tokenVersion:0},process.env.JWT_SECRET);let anonymous=0,denied=0;
 try{
  for(const c of checks){
   if(c.protected){const res=await fetch(base+c.path,{method:c.method.toUpperCase(),signal:AbortSignal.timeout(2000)});c.anonymousStatus=res.status;await res.text();assert.equal(res.status,401,c.key);anonymous++}
   if(c.admin){const res=await fetch(base+c.path,{method:c.method.toUpperCase(),headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(2000)});c.clientStatus=res.status;await res.text();assert.equal(res.status,403,c.key);denied++}
  }
  fs.writeFileSync(path.join(__dirname,'route-matrix.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify({declaredRoutes:checks.length,anonymousDenied:anonymous,clientDeniedAdmin:denied,publicRoutes:checks.filter(c=>!c.protected).map(c=>c.key)}));
 }finally{server.closeAllConnections();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
