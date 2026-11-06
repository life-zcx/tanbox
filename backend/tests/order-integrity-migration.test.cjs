const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const directory = path.join(__dirname, '../prisma/migrations');
const integrity = '20261105130000_order_integrity';

test('integrity migration rolls back on legacy duplicate codes, then enforces code and active-invoice uniqueness', async () => {
  const db = new PGlite();
  try {
    for (const name of fs.readdirSync(directory).sort()) {
      const file = path.join(directory, name, 'migration.sql');
      if (name < integrity && fs.existsSync(file)) await db.exec(fs.readFileSync(file, 'utf8'));
    }
    await db.exec(`INSERT INTO "User" (id,email,password,"companyName","binIin",phone,"updatedAt") VALUES ('owner','owner@example.test','fixture','Fixture','000000000001','00000000000',NOW());
      INSERT INTO "Tariff" (id,code,name,description,"fitFor","priceMin","priceMax","marginEst","updatedAt") VALUES ('tariff','DIGITAL','Fixture','','',1,10,'',NOW());
      INSERT INTO "Order" (id,"orderNumber","userId",category,"tariffType","itemsCount","pricePerItem","totalPrice","updatedAt") VALUES
      ('a','A','owner','SHOES','DIGITAL',1,8,8,NOW()),('b','B','owner','SHOES','DIGITAL',1,8,8,NOW());
      INSERT INTO "OrderCodeItem" ("orderId",index,code) VALUES ('a',1,'SAME'),('b',1,'SAME');`);
    const migration = fs.readFileSync(path.join(directory, integrity, 'migration.sql'), 'utf8');
    await assert.rejects(db.exec(migration), /Duplicate marking codes/);
    await db.exec('ROLLBACK');
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='Order' AND column_name='createKey'`)).rows[0].n, 0);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "OrderCodeItem"')).rows[0].n, 2);
    await db.exec(`DELETE FROM "OrderCodeItem" WHERE "orderId"='b'`);
    await db.exec(migration);
    await assert.rejects(db.exec(`INSERT INTO "OrderCodeItem" ("orderId",index,code) VALUES ('b',1,'SAME')`), /OrderCodeItem_code_key/);
    const insertInvoice = (id, number) => db.query(`INSERT INTO "Invoice" (id,"invoiceNumber",date,status,"userId","orderId","customerName","customerBinIin","customerAddress","totalAmount","updatedAt") VALUES ($1,$2,NOW(),'PENDING','owner','a','Fixture','000000000001','Fixture',8,NOW())`, [id, number]);
    await insertInvoice('one', 'ONE');
    await assert.rejects(insertInvoice('two', 'TWO'), /Invoice_active_order_key/);
    assert.equal((await db.query('SELECT "documentVersion" FROM "Order" LIMIT 1')).rows[0].documentVersion, 1);
  } finally { await db.close(); }
});

test('new SSCC sequence starts beyond the serials in historical operations', async () => {
  const db = new PGlite();
  try {
    for (const name of fs.readdirSync(directory).sort()) {
      const file = path.join(directory, name, 'migration.sql');
      if (name <= integrity && fs.existsSync(file)) await db.exec(fs.readFileSync(file, 'utf8'));
    }
    const oldCode = '00' + '0' + '0487000' + '000005000' + '0';
    await db.query(`INSERT INTO "MarkirovkaOperation" (id,type,"requestPayload","updatedAt") VALUES ('old','AGGREGATION',$1,NOW())`, [JSON.stringify({ sscc: oldCode })]);
    await db.exec(fs.readFileSync(path.join(directory, '20261105140000_sscc_sequence/migration.sql'), 'utf8'));
    const result = await db.query("SELECT nextval('sscc_serial_seq')::text AS serial");
    assert.equal(result.rows[0].serial, '5001');
  } finally { await db.close(); }
});
