const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../dist/config/db');
const { computeOrderPricing } = require('../dist/utils/pricing');

function mockDatabase(customTariffOverrides = {}, customSettingsOverrides = {}) {
  const tariffs = {
    PRO: {
      code: 'PRO',
      name: 'PRO Склад',
      priceRetail: 72,
      priceWholesale: 65,
      priceLargeWholesale: 55,
      costEstimate: 35,
      ...customTariffOverrides.PRO,
    },
    STANDARD: {
      code: 'STANDARD',
      name: 'Стандарт',
      priceRetail: 42,
      priceWholesale: 39,
      priceLargeWholesale: 32,
      costEstimate: 18,
      ...customTariffOverrides.STANDARD,
    },
    PRINT: {
      code: 'PRINT',
      name: 'Печать',
      priceRetail: 18,
      priceWholesale: 16,
      priceLargeWholesale: 13,
      costEstimate: 6,
      ...customTariffOverrides.PRINT,
    },
    DIGITAL: {
      code: 'DIGITAL',
      name: 'Цифровой',
      priceRetail: 8,
      priceWholesale: 7,
      priceLargeWholesale: 5,
      costEstimate: 2.68,
      ...customTariffOverrides.DIGITAL,
    },
  };

  const settings = {
    key: 'GLOBAL',
    volumeTier1: 5000,
    volumeTier2: 25000,
    ssccPrice: 50,
    stickerLayoutPrice: 5000,
    selfLayoutPrice: 1000,
    urgentPercent: 25,
    expressDeliveryPrice: 15000,
    ...customSettingsOverrides,
  };

  prisma.tariff.findUnique = async ({ where }) => tariffs[where.code] || null;
  prisma.pricingSettings.findUnique = async () => settings;
}

test('1. Exact progressive pricing algorithm verification on PRO tariff (72 / 65 / 55 ₸)', async () => {
  mockDatabase();

  // 5,000 шт. = 5000 * 72 = 360,000 ₸
  const res5k = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 5000 });
  assert.equal(res5k.totalPrice, 360000);
  assert.equal(res5k.baseUnitPrice, 72.0);
  assert.equal(res5k.brackets[0].count, 5000);
  assert.equal(res5k.brackets[0].subtotal, 360000);
  assert.equal(res5k.brackets[1].count, 0);
  assert.equal(res5k.brackets[2].count, 0);

  // 5,001 шт. = 5000 * 72 + 1 * 65 = 360,065 ₸
  const res5001 = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 5001 });
  assert.equal(res5001.totalPrice, 360065);
  assert.equal(res5001.brackets[0].count, 5000);
  assert.equal(res5001.brackets[0].subtotal, 360000);
  assert.equal(res5001.brackets[1].count, 1);
  assert.equal(res5001.brackets[1].subtotal, 65);

  // 10,000 шт. = 5000 * 72 + 5000 * 65 = 360,000 + 325,000 = 685,000 ₸
  const res10k = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 10000 });
  assert.equal(res10k.totalPrice, 685000);
  assert.equal(res10k.baseUnitPrice, 68.5);
  assert.equal(res10k.brackets[0].count, 5000);
  assert.equal(res10k.brackets[1].count, 5000);
  assert.equal(res10k.brackets[2].count, 0);

  // 25,000 шт. = 5000 * 72 + 20000 * 65 = 360,000 + 1,300,000 = 1,660,000 ₸
  const res25k = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 25000 });
  assert.equal(res25k.totalPrice, 1660000);
  assert.equal(res25k.baseUnitPrice, 66.4);
  assert.equal(res25k.brackets[1].count, 20000);
  assert.equal(res25k.brackets[2].count, 0);

  // 25,001 шт. = 1,660,000 + 1 * 55 = 1,660,055 ₸
  const res25001 = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 25001 });
  assert.equal(res25001.totalPrice, 1660055);
  assert.equal(res25001.brackets[2].count, 1);
  assert.equal(res25001.brackets[2].subtotal, 55);

  // 100,000 шт. = 1,660,000 + 75000 * 55 = 1,660,000 + 4,125,000 = 5,785,000 ₸
  const res100k = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 100000 });
  assert.equal(res100k.totalPrice, 5785000);
  assert.equal(res100k.baseUnitPrice, 57.85);
  assert.equal(res100k.brackets[0].count, 5000);
  assert.equal(res100k.brackets[1].count, 20000);
  assert.equal(res100k.brackets[2].count, 75000);
});

test('2. Total price monotonicity: cost NEVER decreases as volume increases across all tariffs', async () => {
  mockDatabase();

  const testPoints = [
    1, 10, 999, 1000, 4999, 5000, 5001, 9999, 10000, 24999, 25000, 25001, 50000, 100000, 100001,
  ];

  for (const tariff of ['DIGITAL', 'PRINT', 'STANDARD', 'PRO']) {
    for (const q of testPoints) {
      const p1 = await computeOrderPricing({ tariffType: tariff, itemsCount: q });
      const p2 = await computeOrderPricing({ tariffType: tariff, itemsCount: q + 1 });
      assert.ok(
        p2.totalPrice >= p1.totalPrice,
        `Monotonicity violation on ${tariff}: Q=${q} -> ${p1.totalPrice} ₸, Q=${q + 1} -> ${p2.totalPrice} ₸`
      );
    }
  }
});

test('3. SSCC aggregation: priced per box on standard tariffs and included in PRO', async () => {
  mockDatabase();

  // On STANDARD tariff: 100 boxes * 50 ₸ = 5,000 ₸ SSCC addition
  const resStandard = await computeOrderPricing({
    tariffType: 'STANDARD',
    itemsCount: 2000,
    boxesCount: 100,
    extraServices: ['SSCC_AGGREGATION'],
  });
  assert.equal(resStandard.breakdown.ssccTotal, 5000);
  assert.equal(resStandard.breakdown.resolvedBoxesCount, 100);
  assert.equal(resStandard.breakdown.ssccPricePerBox, 50);

  // On PRO tariff: SSCC is INCLUDED in base rate, 0 ₸ additional charge
  const resPro = await computeOrderPricing({
    tariffType: 'PRO',
    itemsCount: 2000,
    boxesCount: 100,
    extraServices: ['SSCC_AGGREGATION'],
  });
  assert.equal(resPro.breakdown.ssccTotal, 0);
  assert.equal(resPro.breakdown.isSsccIncludedInTariff, true);
});

test('4. Layout services: designer layout (5,000 ₸) prevents double charging approval fee (1,000 ₸)', async () => {
  mockDatabase();

  // Only designer
  const resDesign = await computeOrderPricing({
    tariffType: 'STANDARD',
    itemsCount: 1000,
    extraServices: ['STICKER_LAYOUT_DESIGN'],
  });
  assert.equal(resDesign.breakdown.layoutTotal, 5000);
  assert.equal(resDesign.breakdown.layoutType, 'DESIGNER');

  // Only self layout approval
  const resApproval = await computeOrderPricing({
    tariffType: 'STANDARD',
    itemsCount: 1000,
    extraServices: ['STICKER_LAYOUT_APPROVAL'],
  });
  assert.equal(resApproval.breakdown.layoutTotal, 1000);
  assert.equal(resApproval.breakdown.layoutType, 'CLIENT_APPROVAL');

  // Both designer & approval chosen: only charge 5,000 ₸ (NO double charge!)
  const resBoth = await computeOrderPricing({
    tariffType: 'STANDARD',
    itemsCount: 1000,
    extraServices: ['STICKER_LAYOUT_DESIGN', 'STICKER_LAYOUT_APPROVAL'],
  });
  assert.equal(resBoth.breakdown.layoutTotal, 5000);
  assert.equal(resBoth.breakdown.layoutType, 'DESIGNER');
});

test('5. Urgent execution: surcharge applies ONLY to marking production services, NOT delivery or official codes', async () => {
  mockDatabase();

  // Base production: 1000 * 42 = 42,000 ₸
  // Express delivery: 15,000 ₸ (flat)
  // Designer layout: 5,000 ₸ (flat)
  // Urgent: 25% of 42,000 = 10,500 ₸
  // Total without urgent: 42,000 + 15,000 + 5,000 = 62,000 ₸
  // Total with urgent: 62,000 + 10,500 = 72,500 ₸
  const res = await computeOrderPricing({
    tariffType: 'STANDARD',
    itemsCount: 1000,
    extraServices: ['EXPRESS_DELIVERY', 'STICKER_LAYOUT_DESIGN', 'URGENT_PROCESSING'],
  });

  assert.equal(res.breakdown.baseBatchTotal, 42000);
  assert.equal(res.breakdown.deliveryTotal, 15000);
  assert.equal(res.breakdown.layoutTotal, 5000);
  assert.equal(res.breakdown.urgentAddition, 10500); // 25% of 42,000
  assert.equal(res.totalPrice, 72500);
});

test('6. Official codes: 3.00 ₸/code separated from TANBOX services', async () => {
  mockDatabase();

  // Excluded by default
  const resExcluded = await computeOrderPricing({
    tariffType: 'PRINT',
    itemsCount: 2000,
    includeOfficialCodeFee: false,
  });
  assert.equal(resExcluded.breakdown.officialCodesTotal, 6000); // 2000 * 3.00 = 6,000 ₸
  assert.equal(resExcluded.breakdown.isOfficialCodeIncluded, false);
  assert.equal(resExcluded.totalPrice, resExcluded.tanboxServicesTotal);

  // Included when explicitly requested
  const resIncluded = await computeOrderPricing({
    tariffType: 'PRINT',
    itemsCount: 2000,
    includeOfficialCodeFee: true,
  });
  assert.equal(resIncluded.breakdown.isOfficialCodeIncluded, true);
  assert.equal(resIncluded.totalPrice, resIncluded.tanboxServicesTotal + 6000);
});

test('7. Gross margin formula: (Selling Price - Cost) / Selling Price * 100%', async () => {
  mockDatabase();

  // STANDARD tariff: retail = 42 ₸, cost = 18 ₸
  // Margin = (42 - 18) / 42 * 100% = 24 / 42 * 100% = 57.14% ≈ 57.1%
  const res = await computeOrderPricing({ tariffType: 'STANDARD', itemsCount: 1000 });
  assert.equal(res.adminOnly.costEstimate, 18);
  assert.equal(res.adminOnly.isSellingBelowCost, false);
  assert.equal(res.adminOnly.grossMarginPercent, 57.1);

  // Test below cost detection
  mockDatabase({ STANDARD: { priceRetail: 10, priceWholesale: 9, priceLargeWholesale: 8, costEstimate: 18 } });
  const resLoss = await computeOrderPricing({ tariffType: 'STANDARD', itemsCount: 1000 });
  assert.equal(resLoss.adminOnly.isSellingBelowCost, true);
});

test('8. Edge cases: zero, negative, floats, and very large batch quantities', async () => {
  mockDatabase();

  // Zero & negative are sanitized to 1
  const res0 = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 0 });
  assert.equal(res0.safeItemsCount, 1);
  assert.equal(res0.totalPrice, 72);

  const resNeg = await computeOrderPricing({ tariffType: 'PRO', itemsCount: -50 });
  assert.equal(resNeg.safeItemsCount, 1);

  // Float is floored
  const resFloat = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 5000.8 });
  assert.equal(resFloat.safeItemsCount, 5000);
  assert.equal(resFloat.totalPrice, 360000);

  // High volume capped safely at 10,000,000
  const resHuge = await computeOrderPricing({ tariffType: 'PRO', itemsCount: 15000000 });
  assert.equal(resHuge.safeItemsCount, 10000000);
  assert.ok(resHuge.totalPrice > 0);
});

