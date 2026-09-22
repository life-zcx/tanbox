import { PrismaClient, Role, OrderCategory, TariffType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DB seeding...');

  // 1. Password hashes
  const adminPassword = await bcrypt.hash('admin123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tanbox.kz' },
    update: {},
    create: {
      email: 'admin@tanbox.kz',
      password: adminPassword,
      companyName: 'TANBOX Admin HQ',
      binIin: '000000000000',
      phone: '+7 700 000 0000',
      role: Role.ADMIN,
    },
  });

  // 3. Test Client User
  const client = await prisma.user.upsert({
    where: { email: 'client@tanbox.kz' },
    update: {},
    create: {
      email: 'client@tanbox.kz',
      password: clientPassword,
      companyName: 'ТОО "ТехноМаркет Казахстан"',
      binIin: '980412354890',
      phone: '+7 701 555 1234',
      role: Role.CLIENT,
    },
  });

  console.log(`👤 Created Admin: ${admin.email} | Client: ${client.email}`);

  // 4. Tariffs (Exactly as requested by user)
  const tariffs = [
    {
      code: 'DIGITAL',
      name: '«Цифровой»',
      description: 'Только эмиссия кодов в ИС Танба. Выгрузка клиенту готовых макетов в PDF.',
      fitFor: 'Тем, у кого есть свои принтеры и рабочие на складе.',
      priceMin: 10,
      priceMax: 15,
      marginEst: '~10 - 15 ₸ (0 ₸ расходников)',
    },
    {
      code: 'PRINT',
      name: '«Печатный»',
      description: 'Эмиссия кодов + термотрансферная печать. Отдача готовых рулонов.',
      fitFor: 'Клиентам, которым не хочется возиться с настройкой принтеров и риббонами.',
      priceMin: 25,
      priceMax: 35,
      marginEst: '~22 - 32 ₸ (расходники ~3 ₸)',
    },
    {
      code: 'STANDARD',
      name: '«Стандарт» (Под ключ)',
      description: 'Эмиссия, печать, выезд на склад клиента, потоковая наклейка на упаковку без вскрытия, проверка и гарантирование считываемости 2D-кодов.',
      fitFor: 'Оптовикам с однотипным товаром (вода, текстиль в прозрачных пакетах).',
      priceMin: 50,
      priceMax: 65,
      marginEst: '~40 - 55 ₸ (учитывая оплату труда стикеровщика)',
    },
    {
      code: 'PRO',
      name: '«PRO» (Сложная оклейка)',
      description: 'Вскрытие коробок, сверка артикулов (размер/цвет), оклейка, возврат в коробку, формирование агрегационного кода (SSCC).',
      fitFor: 'Импортерам обуви и одежды, где критична точность артикулов.',
      priceMin: 90,
      priceMax: 120,
      marginEst: '~75 - 105 ₸',
    },
  ];

  for (const t of tariffs) {
    await prisma.tariff.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }

  console.log('🏷️ Created Tariffs');

  // 5. Test Orders for Client
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    await prisma.order.createMany({
      data: [
        {
          orderNumber: 'TB-2026-001',
          userId: client.id,
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
          orderNumber: 'TB-2026-002',
          userId: client.id,
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
        {
          orderNumber: 'TB-2026-003',
          userId: client.id,
          category: OrderCategory.TEXTILE,
          tariffType: TariffType.PRINT,
          itemsCount: 8000,
          pricePerItem: 30.0,
          totalPrice: 240000.0,
          status: OrderStatus.NEW,
          extraServices: ['STICKER_LAYOUT_DESIGN'],
          ssccNeeded: false,
          notes: 'Хлопковое постельное белье',
        },
      ],
    });
    console.log('📦 Created Test Orders');
  }

  console.log('✅ DB Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during DB seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
