import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DB seeding...');

  // 1. Password hashes (using env variables or fallback for initial bootstrap)
  const isProd = process.env.NODE_ENV === 'production';
  const initialAdminPass = process.env.INITIAL_ADMIN_PASSWORD;

  if (isProd && (!initialAdminPass || initialAdminPass === 'Admin_Tanbox_2026!Secure')) {
    throw new Error(
      'CRITICAL SECURITY ERROR: Cannot seed production database without specifying a secure INITIAL_ADMIN_PASSWORD in environment!'
    );
  }

  const effectiveAdminPass = initialAdminPass || 'Admin_Tanbox_2026!Secure';
  const adminPassword = await bcrypt.hash(effectiveAdminPass, 10);

  // 2. Admin User - only create if not exists
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@tanbox.kz' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@tanbox.kz',
        password: adminPassword,
        companyName: 'TANBOX Admin HQ',
        binIin: '000000000000',
        phone: '+7 700 000 0000',
        role: Role.ADMIN,
      },
    });
    console.log(`👤 Created initial Admin (password from env/bootstrap)`);
  } else {
    console.log(`ℹ️ Admin user already exists, keeping existing credentials.`);
  }

  // 3. Tariffs - only create if not yet existing (preserving any customizations made by admin)
  const defaultTariffs = [
    {
      code: 'DIGITAL',
      name: '«Цифровой»',
      description: 'Только эмиссия кодов в ИС Танба. Выгрузка клиенту готовых макетов в PDF.',
      fitFor: 'Тем, у кого есть свои принтеры и рабочие на складе.',
      priceRetail: 15,
      priceWholesale: 12,
      priceLargeWholesale: 10,
      costEstimate: 2.68,
      priceMin: 10,
      priceMax: 15,
      marginEst: '~10 - 15 ₸ (0 ₸ расходников)',
    },
    {
      code: 'PRINT',
      name: '«Печатный»',
      description: 'Эмиссия кодов + термотрансферная печать. Отдача готовых рулонов.',
      fitFor: 'Клиентам, которым не хочется возиться с настройкой принтеров и риббонами.',
      priceRetail: 35,
      priceWholesale: 30,
      priceLargeWholesale: 25,
      costEstimate: 6.0,
      priceMin: 25,
      priceMax: 35,
      marginEst: '~22 - 32 ₸ (расходники ~3 ₸)',
    },
    {
      code: 'STANDARD',
      name: '«Стандарт» (Под ключ)',
      description: 'Эмиссия, печать, выезд на склад клиента, потоковая наклейка на упаковку без вскрытия, проверка и гарантирование считываемости 2D-кодов.',
      fitFor: 'Оптовикам с однотипным товаром (вода, текстиль в прозрачных пакетах).',
      priceRetail: 65,
      priceWholesale: 55,
      priceLargeWholesale: 50,
      costEstimate: 18.0,
      priceMin: 50,
      priceMax: 65,
      marginEst: '~40 - 55 ₸ (учитывая оплату труда стикеровщика)',
    },
    {
      code: 'PRO',
      name: '«PRO» (Сложная оклейка)',
      description: 'Вскрытие коробок, сверка артикулов (размер/цвет), оклейка, возврат в коробку, формирование агрегационного кода (SSCC).',
      fitFor: 'Импортерам обуви и одежды, где критична точность артикулов.',
      priceRetail: 120,
      priceWholesale: 105,
      priceLargeWholesale: 90,
      costEstimate: 35.0,
      priceMin: 90,
      priceMax: 120,
      marginEst: '~75 - 105 ₸',
    },
  ];

  for (const t of defaultTariffs) {
    const existing = await prisma.tariff.findUnique({ where: { code: t.code } });
    if (!existing) {
      await prisma.tariff.create({ data: t });
    }
  }

  // 4. Global Pricing Settings - create if not exists
  const existingSettings = await prisma.pricingSettings.findUnique({ where: { key: 'GLOBAL' } });
  if (!existingSettings) {
    await prisma.pricingSettings.create({
      data: {
        key: 'GLOBAL',
        ssccPrice: 5.0,
        stickerLayoutPrice: 5000.0,
        urgentPercent: 20.0,
        expressDeliveryPrice: 15000.0,
        volumeTier1: 20000,
        volumeTier2: 100000,
      },
    });
  }

  console.log('✅ DB Seeding completed safely!');
}

main()
  .catch((e) => {
    console.error('❌ Error during DB seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
