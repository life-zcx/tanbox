import { PrismaClient, Role, OrderCategory, TariffType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DB seeding...');

  // 1. Password hashes (using env variables or fallback for initial bootstrap)
  const initialAdminPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin_Tanbox_2026!Secure';
  const initialClientPass = process.env.INITIAL_CLIENT_PASSWORD || 'Client_Tanbox_2026!Secure';

  const adminPassword = await bcrypt.hash(initialAdminPass, 10);
  const clientPassword = await bcrypt.hash(initialClientPass, 10);

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

  // 3. Test Client User - only create if not exists
  const existingClient = await prisma.user.findUnique({ where: { email: 'client@tanbox.kz' } });
  let clientId = existingClient?.id;
  if (!existingClient) {
    const createdClient = await prisma.user.create({
      data: {
        email: 'client@tanbox.kz',
        password: clientPassword,
        companyName: 'ТОО "ТехноМаркет Казахстан"',
        binIin: '980412354890',
        phone: '+7 701 555 1234',
        role: Role.CLIENT,
      },
    });
    clientId = createdClient.id;
    console.log(`👤 Created initial Client`);
  }

  // 4. Tariffs - only create if not yet existing (preserving any customizations made by admin)
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

  // 5. Global Pricing Settings - create if not exists
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

  // 6. Test Orders for Client (only if zero orders exist)
  if (clientId) {
    const existingOrders = await prisma.order.count();
    if (existingOrders === 0) {
      await prisma.order.createMany({
        data: [
          {
            orderNumber: 'TB-0001',
            userId: clientId,
            category: OrderCategory.SHOES,
            tariffType: TariffType.PRO,
            itemsCount: 5000,
            pricePerItem: 95.0,
            totalPrice: 475000.0,
            status: OrderStatus.PROCESSING,
            extraServices: ['SSCC_AGGREGATION', 'EXPRESS_DELIVERY'],
            ssccNeeded: true,
            notes: 'Срочная маркировка партий зимней обуви из Турции',
            pdfUrl: '/samples/data_matrix_shoes_sample.pdf',
          },
          {
            orderNumber: 'TB-0002',
            userId: clientId,
            category: OrderCategory.WATER,
            tariffType: TariffType.STANDARD,
            itemsCount: 20000,
            pricePerItem: 55.0,
            totalPrice: 1100000.0,
            status: OrderStatus.COMPLETED,
            extraServices: ['ON_SITE_STICKERING'],
            ssccNeeded: false,
            notes: 'Минеральная вода, склад в г. Алматы',
            pdfUrl: '/samples/data_matrix_water_completed.pdf',
          },
        ],
      });
    }
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
