const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.AUDIT_REPO;
const {PGlite}=require(path.join(root,'backend/node_modules/@electric-sql/pglite'));
(async()=>{
 const db=new PGlite();
 try{
  const dir=path.join(root,'backend/prisma/migrations');
  for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name,'migration.sql');if(fs.existsSync(file))await db.exec(fs.readFileSync(file,'utf8'))}
  await db.exec(`INSERT INTO "User" (id,email,password,"companyName","binIin",phone,"updatedAt") VALUES
   ('audit-a','a@example.test','fixture','Fixture A','000000000001','00000000000',NOW()),
   ('audit-b','b@example.test','fixture','Fixture B','000000000001','00000000000',NOW());
   INSERT INTO "Tariff" (id,code,name,description,"fitFor","priceMin","priceMax","marginEst","updatedAt") VALUES ('audit-t','DIGITAL','Fixture','','',1,10,'',NOW());
   INSERT INTO "Order" (id,"orderNumber","userId",category,"tariffType","itemsCount","pricePerItem","totalPrice","updatedAt") VALUES
   ('audit-order-a','AUDIT-A','audit-a','SHOES','DIGITAL',1,8,8,NOW()),
   ('audit-order-b','AUDIT-B','audit-b','SHOES','DIGITAL',1,8,8,NOW());
   INSERT INTO "OrderCodeItem" ("orderId",index,code) VALUES ('audit-order-a',1,'AUDIT-SAME-CODE'),('audit-order-b',1,'AUDIT-SAME-CODE');`);
  const r=await db.query('SELECT code,count(*)::int AS n FROM "OrderCodeItem" GROUP BY code');assert.equal(r.rows[0].n,2);
  await db.exec('UPDATE "OrderCodeItem" SET index=-ABS(index) WHERE "orderId"=\'audit-order-a\'');
  // Simulate process loss before second, separately committed UPDATE.
  const negative=await db.query('SELECT index FROM "OrderCodeItem" WHERE "orderId"=\'audit-order-a\'');assert.equal(negative.rows[0].index,-1);
  console.log(JSON.stringify({freshMigrations:'PASS',duplicateCodesAcrossOrdersAccepted:true,duplicateBinAndPhoneAccepted:true,negativeIndexCommitted:true}));
 }finally{await db.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
