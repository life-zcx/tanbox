// Read-only application audit. All DB and external integration calls are fixtures.
const {test, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const {EventEmitter} = require('node:events');
const root = process.env.AUDIT_REPO;
assert.ok(root, 'Set AUDIT_REPO to repository root');
process.chdir(__dirname);
process.env.NODE_ENV='test';
process.env.DATABASE_URL='postgresql://audit:audit@127.0.0.1:1/audit';
process.env.JWT_SECRET='audit-fixture-secret-over-thirty-two-characters';
process.env.ENCRYPTION_SECRET='audit-encryption-fixture-over-thirty-two-characters';
process.env.NATIONAL_CATALOG_API_KEY='audit-global-nkt-key';
for (const k of ['TELEGRAM_BOT_TOKEN','TELEGRAM_CLIENT_BOT_TOKEN','SMTP_HOST','SMTP_USER','SMTP_PASS']) process.env[k]='';
const fail = (name) => async()=>{throw new Error('Unmocked call: '+name)};
const models = new Map();
const prisma = new Proxy({}, {get(obj,k){
 if(k in obj)return obj[k];
 if(String(k).startsWith('$'))return fail(String(k));
 if(!models.has(k))models.set(k,new Proxy({}, {get(o,m){return m in o?o[m]:fail(String(k)+'.'+String(m))}}));
 return models.get(k);
}});
const notifications = new Proxy({}, {get:()=>async()=>{}});
const logger = {info(){},warn(){},error(){},debug(){}};
const originalLoad = Module._load;
Module._load=function(request,parent,isMain){
 let resolved; try{resolved=Module._resolveFilename(request,parent)}catch{}
 if(typeof resolved==='string'){
  const p=resolved.replaceAll('\\','/');
  if(p.endsWith('/backend/dist/config/db.js'))return {prisma};
  if(p.endsWith('/backend/dist/services/telegram.service.js'))return {telegram:notifications};
  if(p.endsWith('/backend/dist/services/clientTelegram.service.js'))return {clientTelegramBot:notifications};
  if(p.endsWith('/backend/dist/utils/logger.js'))return {logger};
 }
 return originalLoad.apply(this,arguments);
};
const http=require('node:http');const https=require('node:https');
const block=()=>{throw new Error('NETWORK DISABLED BY AUDIT')};
global.fetch=block;http.request=block;https.request=block;
const load=p=>require(path.join(root,'backend/dist',p));
const orders=load('controllers/orders.controller');
const cards=load('controllers/markirovkaCards.controller');
const {markirovkaCardsService}=load('services/markirovkaCards.service');
const mpt=load('services/markirovkaClient.service');
const ops=load('controllers/markirovkaOperations.controller');
const {parseCodesFile}=load('services/orderCodes.service');
const invoices=load('controllers/invoices.controller');
const leads=load('controllers/leads.controller');
const support=load('controllers/support.controller');
const {computeOrderPricing}=load('utils/pricing');
const {encryptText}=load('utils/encryption');
const response=()=>({statusCode:200,status(n){this.statusCode=n;return this},json(body){this.body=body;return this},sendFile(file){this.file=file;return this},setHeader(){},setTimeout(){},end(){},writeHead(){}});
const user={id:'audit-client',email:'audit@example.test',role:'CLIENT',companyName:'Fixture',binIin:'000000000001'};
const request=body=>({user,body,params:{},query:{},headers:{},setTimeout(){},once(){},off(){}});
beforeEach(()=>{models.clear();delete prisma.$transaction;global.fetch=block;http.request=block;https.request=block});
const prices=()=>{prisma.tariff.findUnique=async()=>null;prisma.pricingSettings.findUnique=async()=>null};

test('F01: a client rebinds a draft to a foreign account and GET discloses account secrets',async()=>{
 let card={id:'audit-card',userId:user.id,status:'DRAFT',category:'SHOES',nktRequestId:null,accountId:'own'};
 const foreign={id:'foreign',userId:'another-client',encryptedPassword:'fixture-ciphertext',token:'fixture-token',nktApiKey:'fixture-nkt-key'};
 prisma.markirovkaProductCard.findUnique=async({include,select})=>select?{id:card.id,userId:card.userId}:include?{...card,account:foreign}:card;
 prisma.markirovkaProductCard.update=async({data})=>(card={...card,...data});
 let req=request({accountId:foreign.id});req.params.id=card.id;const edit=response();
 await cards.updateCardHandler(req,edit);assert.equal(edit.statusCode,200);assert.equal(card.accountId,foreign.id);
 const read=response();await cards.getCardByIdHandler(req,read);
 assert.equal(read.statusCode,200);assert.equal(read.body.card.account.nktApiKey,foreign.nktApiKey);assert.equal(read.body.card.account.token,foreign.token);
});

test('F02: full unpaid codes are returned by registry and order details',async()=>{
 const code='010000000000000021AUDIT\x1d91TEST\x1d92FIXTURE';
 prisma.order.findMany=async()=>[];
 prisma.orderCodeItem.count=async()=>1;
 prisma.orderCodeItem.findMany=async({where})=>{assert.equal(where.order.userId,user.id);assert.equal(where.order.paymentStatus,undefined);return[{orderId:'unpaid',index:1,code}]};
 const res=response();await orders.getCodesRegistry(request({}),res);assert.equal(res.body.items[0].code,code);
 prisma.order.findFirst=async()=>({id:'unpaid',userId:user.id,paymentStatus:'UNPAID',printAllowed:false,markirovkaOrders:[{codes:[code]}]});
 prisma.userStickerTemplate.findFirst=async()=>null;prisma.orderCodeItem.findFirst=async()=>null;
 const detail=response();const req=request({});req.params.id='unpaid';await orders.getOrderById(req,detail);
 assert.equal(detail.body.markirovkaOrders[0].codes[0],code);
});

test('F03: utilisation reads and links another client order without ownership validation',async()=>{
 const code='010000000000000021VICTIM\x1d91TEST\x1d92FIXTURE';let submitted;let linked;
 prisma.orderCodeItem.findMany=async({where})=>{assert.deepEqual(where,{orderId:'foreign-order'});return[{code}]};
 prisma.markirovkaAccount.findFirst=async()=>({id:'own-account',userId:user.id,environment:'TEST',encryptedPassword:encryptText('fixture-pass')});
 const old=mpt.MarkirovkaClient.prototype.submitUtilisationReport;
 mpt.MarkirovkaClient.prototype.submitUtilisationReport=async p=>{submitted=p;return{reportId:'fixture-report'}};
 prisma.markirovkaOperation.create=async({data})=>({id:'operation',...data});
 prisma.order.findUnique=async()=>({id:'foreign-order',userId:'another-client',category:'OILS'});
 prisma.markirovkaUtilisationReport.create=async({data})=>(linked=data);
 try{const res=response();await ops.createUtilisation(request({codes:['short'],orderId:'foreign-order'}),res);assert.equal(res.statusCode,200);assert.equal(submitted.codes[0],code);assert.equal(linked.orderId,'foreign-order')}finally{mpt.MarkirovkaClient.prototype.submitUtilisationReport=old}
});

test('F04: public lead notes can satisfy the attachment ownership check',async()=>{
 const name='bug_fixture_foreign.pdf';const folder=path.join(__dirname,'uploads/bug-reports');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,name),'AUDIT ONLY');
 let record;prisma.serviceLead.create=async({data})=>(record={id:'fake-lead',...data});
 prisma.serviceLead.findFirst=async({where})=>record.email===where.email && record.notes.includes(where.notes.contains)?record:null;
 const lead=response();await leads.createLead({body:{serviceTitle:'fixture',companyName:'fixture',phone:'000',email:user.email,notes:name}},lead);assert.equal(lead.statusCode,201);
 const req=request({});req.params.filename=name;const res=response();await support.getBugReportAttachment(req,res);assert.equal(res.file,path.join(folder,name));
});

test('F05: backend CSV parser silently removes GS delimiters',()=>{
 const code='010000000000000021AUDIT\x1d91TEST\x1d92FIXTURE';
 for(const txt of [code,'code\n'+code,'code;name\n"'+code+'";Fixture']){
  const parsed=parseCodesFile(txt).rows[0].code;assert.notEqual(parsed,code);assert.equal(parsed.includes('\x1d'),false);
 }
 const parseFlexibleCsv=require(path.join(root,'label-generator/dist/utils/csvHelper')).parseFlexibleCsv;
 assert.equal(parseFlexibleCsv(code)[0].code,code);
});

test('F06: creating an unpaid order unlocks a paid template service',async()=>{
 prices();let paid=false;
 prisma.userStickerTemplate.findFirst=async()=>({id:'template',widthMm:58,heightMm:40,elements:[],isPaid:paid});
 prisma.userStickerTemplate.update=async({data})=>{paid=data.isPaid;return{id:'template',...data}};
 prisma.order.findFirst=async()=>({orderNumber:'TB-0001'});prisma.order.findMany=async()=>[];
 prisma.order.create=async({data})=>({id:'new-order',paymentStatus:'UNPAID',...data});
 const res=response();await orders.createOrder(request({category:'SHOES',tariffType:'DIGITAL',itemsCount:1,templateId:'template'}),res);
 assert.equal(res.statusCode,201);assert.equal(paid,true);
});

test('F07: adjusting PRO to one item does not reconcile stored codes or enforce minimum',async()=>{
 prices();let state={id:'adjust-order',userId:user.id,status:'NEW',paymentStatus:'UNPAID',tariffType:'PRO',itemsCount:500,extraServices:[],ssccNeeded:false};
 prisma.order.findFirst=async()=>state;prisma.order.update=async({data})=>(state={...state,...data});prisma.invoice.findMany=async()=>[];
 const req=request({itemsCount:1});req.params.id=state.id;const res=response();await orders.adjustOrderItemsCount(req,res);
 assert.equal(res.statusCode,200);assert.equal(state.itemsCount,1);assert.equal(state.totalPrice,72);
});

test('F08: invoice payment trusts stale lower invoice amount and unlocks more expensive order',async()=>{
 const {Prisma}=require(path.join(root,'backend/node_modules/@prisma/client'));let debit,orderPaid;
 const invoice={id:'invoice',orderId:'order',userId:user.id,status:'PENDING',totalAmount:new Prisma.Decimal(8)};
 const order={id:'order',userId:user.id,status:'NEW',paymentStatus:'UNPAID',totalPrice:new Prisma.Decimal(8000)};
 prisma.$transaction=async fn=>fn({$queryRaw:async()=>[],invoice:{findUnique:async()=>invoice,count:async()=>0,updateMany:async()=>({count:1})},order:{findUnique:async()=>order,update:async({data})=>{orderPaid=data;return{...order,...data}}},user:{updateMany:async({data})=>{debit=Number(data.balance.decrement);return{count:1}},findUniqueOrThrow:async()=>({balance:92})},onlinePayment:{create:async()=>({})}});
 const {payWithBalance}=load('services/balancePayment.service');await payWithBalance(user.id,false,'invoice','invoice');assert.equal(debit,8);assert.equal(orderPaid.paymentStatus,'PAID');assert.equal(orderPaid.printAllowed,true);
});

test('F09: NKT rejection containing a GTIN is marked approved and auto-published',async()=>{
 let updated,published=0;
 prisma.markirovkaProductCard.findUnique=async()=>({id:'card',userId:user.id,nktRequestId:'request',category:'SHOES',status:'PENDING_MODERATION',gtin:'00000000000000',attributes:{},account:{nktApiKey:'fixture-key',nktBaseUrl:'https://catalog.example.test'}});
 prisma.markirovkaProductCard.update=async({data})=>(updated=data);
 global.fetch=async(url,options)=>{if(options?.method==='PUT')published++;return {ok:true,json:async()=>({code:'rejected',gtin:'00000000000000',rejectionReason:'fixture rejected'})}};
 await markirovkaCardsService.checkNktStatus('card');assert.equal(updated.status,'APPROVED');assert.equal(published,1);
});

test('F10: SSRF validators accept trailing-dot loopback and IPv6 private addresses',()=>{
 for(const url of ['http://localhost.:5050','http://[::ffff:7f00:1]:5050','http://[fd00::2]:5050']){
  assert.equal(mpt.validateAndSanitizeBaseUrl(url),url);assert.equal(mpt.validateAndSanitizeNktBaseUrl(url),url);
 }
});

test('F11: a client-controlled NKT base URL receives the global API key',async()=>{
 let sent;
 prisma.markirovkaProductCard.findUnique=async()=>({id:'card',userId:user.id,nktRequestId:'request',status:'DRAFT',attributes:{},account:{nktApiKey:null,nktBaseUrl:'https://attacker.example.test'}});
 prisma.markirovkaProductCard.update=async({data})=>data;
 global.fetch=async(url,options)=>{sent={url,options};return {ok:true,json:async()=>({code:'draft'})}};
 await markirovkaCardsService.checkNktStatus('card');assert.equal(new URL(sent.url).hostname,'attacker.example.test');assert.equal(sent.options.headers['X-API-KEY'],'audit-global-nkt-key');
});

test('F12: interrupted reindex leaves negative primary-key indices',async()=>{
 let indices=[5,6];let calls=0;
 prisma.order.findMany=async()=>[{id:'order'}];prisma.orderCodeItem.aggregate=async()=>({_count:{_all:2},_min:{index:5},_max:{index:6}});
 prisma.$executeRawUnsafe=async()=>{calls++;if(calls===1){indices=indices.map(n=>-Math.abs(n));return 2}throw new Error('fixture interruption')};
 const {reindexClientOrders}=load('utils/orderNumbering');await assert.rejects(reindexClientOrders(user.id),/fixture interruption/);assert.deepEqual(indices,[-5,-6]);delete prisma.$executeRawUnsafe;
});

test('F13: resetting a password accepts eight spaces then hashes an empty password',async()=>{
 const auth=load('controllers/auth.controller');let stored;
 prisma.verificationCode.findFirst=async()=>({id:'otp',email:user.email,code:auth.hashOtpCode('123456'),expiresAt:new Date(Date.now()+100000)});
 prisma.verificationCode.deleteMany=async()=>({count:1});prisma.user.findUnique=async()=>user;prisma.user.update=async({data})=>{stored=data.password;return user};
 const res=response();await auth.resetPasswordWithCode({body:{email:user.email,code:'123456',newPassword:'        '}},res);assert.equal(res.statusCode,200);
 const bcrypt=require(path.join(root,'backend/node_modules/bcryptjs'));assert.equal(await bcrypt.compare('',stored),true);
});

test('F14: order persists after position failure and retry creates a duplicate',async()=>{
 prices();const created=[];
 prisma.order.findFirst=async()=>({orderNumber:'TB-000'+(created.length+1)});
 prisma.order.create=async({data})=>{const o={id:'partial-'+created.length,...data};created.push(o);return o};
 prisma.orderPosition.createMany=async()=>{throw new Error('fixture position failure')};
 for(let i=0;i<2;i++){const res=response();await orders.createOrder(request({category:'SHOES',tariffType:'DIGITAL',positions:[{name:'fixture',quantity:1}]}),res);assert.equal(res.statusCode,500)}
 assert.equal(created.length,2);
});

test('F15: revoked former-admin JWT still receives confidential tariff fields',async()=>{
 const {getTariffs}=load('controllers/tariffs.controller');const jwt=require(path.join(root,'backend/node_modules/jsonwebtoken'));
 prisma.tariff.findMany=async()=>[{code:'PRINT',costEstimate:6,marginEst:'fixture-margin'}];prisma.pricingSettings.findUnique=async()=>({});
 prisma.user.findUnique=async()=>({id:'demoted',role:'CLIENT',isBlocked:true,tokenVersion:5});
 const req={headers:{authorization:'Bearer '+jwt.sign({id:'demoted',role:'ADMIN',tokenVersion:0},process.env.JWT_SECRET,{expiresIn:'1h'})}};
 const res=response();await getTariffs(req,res);assert.equal(res.body.tariffs[0].costEstimate,6);assert.equal(res.body.tariffs[0].marginEst,'fixture-margin');
});

test('F16: full PDF of 2500 database codes sends only 2000 rows and caches success',async()=>{
 const {Readable,Writable}=require('node:stream');let payload;
 const order={id:'pdf-'+Date.now(),orderNumber:'TB-FIXTURE',userId:user.id,status:'PROCESSING',tariffType:'PRINT',paymentStatus:'PAID',itemsCount:2500,extraServices:[],stickerLayout:{widthMm:58,heightMm:40,elements:[{type:'text',content:'Fixture'}]}};
 prisma.order.findFirst=async()=>order;prisma.order.findUnique=async()=>order;prisma.order.update=async({data})=>Object.assign(order,data);
 prisma.orderCodeItem.count=async()=>2500;prisma.orderCodeItem.findMany=async({take})=>Array.from({length:Math.min(2500,take)},(_,i)=>({index:i+1,code:'FIXTURE-'+i}));prisma.orderPosition.findMany=async()=>[];
 http.request=(opts,cb)=>{const req=new EventEmitter();req.setTimeout=()=>{};req.destroy=()=>{};req.write=s=>{payload=JSON.parse(s)};req.end=()=>{const res=Readable.from(['%PDF-AUDIT-FIXTURE']);res.statusCode=200;cb(res)};return req};
 const res=new Writable({write(c,e,done){done()}});res.setTimeout=()=>{};res.setHeader=()=>{};res.status=n=>{res.statusCode=n;return res};res.json=b=>{res.body=b;return res};
 const finished=new Promise(r=>res.once('finish',r));const req=request({});req.params.id=order.id;await orders.downloadOrderPdf(req,res);await finished;
 assert.equal(payload.csvData.length,2000);assert.ok(order.pdfUrl);assert.ok(fs.existsSync(path.join(__dirname,'uploads/orders',order.id,'labels.pdf')));
});

test('F17: upload changes order price but leaves original invoice amount unchanged',async()=>{
 prices();let state={id:'upload-fixture',userId:user.id,status:'NEW',paymentStatus:'UNPAID',tariffType:'DIGITAL',itemsCount:1,extraServices:[],ssccNeeded:false,createdAt:new Date()};let invoiceWrites=0;
 const invoice={totalAmount:8};
 prisma.order.findFirst=async()=>state;prisma.order.findUnique=async()=>state;prisma.order.update=async({data})=>(state={...state,...data});prisma.order.findMany=async()=>[];
 prisma.orderCodeItem.findMany=async()=>[];prisma.orderCodeItem.deleteMany=async()=>({count:0});prisma.orderCodeItem.findFirst=async()=>null;prisma.orderCodeItem.createMany=async()=>({count:10});prisma.orderPosition.count=async()=>1;
 prisma.invoice.update=async()=>{invoiceWrites++};prisma.invoice.updateMany=async()=>{invoiceWrites++};
 const file=path.join(__dirname,'codes-fixture.csv');fs.writeFileSync(file,Array.from({length:10},(_,i)=>'010000000000000021FIXTURE'+i).join('\n'));
 const req=request({});req.params.id=state.id;req.file={path:file,filename:'codes-fixture.csv',originalname:'fixture.csv'};const res=response();await orders.uploadOrderCodesFile(req,res);
 assert.equal(res.statusCode,200);assert.equal(state.totalPrice,80);assert.equal(invoice.totalAmount,8);assert.equal(invoiceWrites,0);
});

test('F18: SSCC generation produces duplicates within the same millisecond',()=>{
 const originalNow=Date.now;Date.now=()=>1800000000000;
 try{assert.equal(mpt.generateValidSscc18(),mpt.generateValidSscc18())}finally{Date.now=originalNow}
});

test('F19: aggregation without any account reports external success',async()=>{
 let stored;prisma.markirovkaAccount.findFirst=async()=>null;
 prisma.markirovkaOperation.create=async({data})=>{stored=data;return{id:'fake-completed',...data}};
 const res=response();await ops.createAggregation(request({codes:['010000000000000021FIXTURE']}),res);
 assert.equal(res.statusCode,200);assert.equal(res.body.success,true);assert.equal(stored.accountId,null);assert.equal(stored.status,'COMPLETED');
});

test('F20: currency amount in words discards fractional tiyn',()=>{
 const {numberToWordsTenge}=load('services/orderDocuments.service');
 assert.equal(numberToWordsTenge(100.50),numberToWordsTenge(100));
});

test('F21: pending quote loses explicit box count and official code fee on adjustment',async()=>{
 prices();const original=await computeOrderPricing({tariffType:'PRINT',itemsCount:500,boxesCount:2,ssccNeeded:true,includeOfficialCodeFee:true});
 let state={id:'quote-fixture',userId:user.id,status:'NEW',paymentStatus:'UNPAID',tariffType:'PRINT',itemsCount:500,extraServices:[],ssccNeeded:true,totalPrice:original.totalPrice};
 prisma.order.findFirst=async()=>state;prisma.order.update=async({data})=>(state={...state,...data});prisma.invoice.findMany=async()=>[];
 const req=request({itemsCount:500});req.params.id=state.id;const res=response();await orders.adjustOrderItemsCount(req,res);
 assert.equal(res.statusCode,200);assert.notEqual(state.totalPrice,original.totalPrice);
 console.log('F21 totals',JSON.stringify({before:original.totalPrice,after:state.totalPrice}));
});
