import React, { useState } from 'react';
import { ChevronDown, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { lang } = useLanguage();

  const faqsRu = [
    {
      q: 'Есть ли у вас интеграция с ИС МПТ (ИС Танба)?',
      a: 'Да, у TANBOX реализована прямая интеграция с ИС МПТ (Единый оператор маркировки в Республике Казахстан). Вы можете авторизоваться под своим профилем прямо у нас на сайте и выполнять все операции через один личный кабинет: заказывать эмиссию кодов, отслеживать статус, получать Data Matrix, формировать отчеты о нанесении и вводить продукцию в оборот без ручного скачивания и переноса файлов.',
    },
    {
      q: 'В каком формате передавать коды маркировки?',
      a: 'Доступно два удобных способа: 1) Через интеграцию с ИС МПТ — коды подтягиваются автоматически в ваш заказ напрямую из государственной системы после авторизации в личном кабинете TANBOX; 2) Обычным файлом — если вы уже выгрузили коды самостоятельно, достаточно прикрепить стандартный файл выгрузки в формате .CSV.',
    },
    {
      q: 'Что делать, если кодов ещё нет?',
      a: 'Благодаря интеграции с ИС МПТ вы можете выпустить коды прямо через наш личный кабинет. Если ваши товары ещё не внесены в Национальный каталог товаров (НКТ / GS1 Kazakhstan) — мы поможем корректно заполнить карточки номенклатуры, получить штрихкоды GTIN и запустить эмиссию под ключ.',
    },
    {
      q: 'В каком виде вы отдаете готовые этикетки?',
      a: 'В зависимости от выбранного тарифа: в виде готовых рулонов для термотрансферного принтера со 100% проверкой считываемости сканером, в виде векторных файлов PDF для самостоятельной печати или в виде полностью оклеенного и упакованного товара на вашем складе.',
    },
    {
      q: 'Вы находитесь в г. Алматы. Как происходит работа с другими городами Казахстана?',
      a: 'Наше производство базируется в г. Алматы. Если вам нужны только готовые рулоны этикеток — оперативно печатаем и отправляем курьерской доставкой в любой город РК. Если заказан выезд и оклейка — отправляем партию стикеров в ваш регион, и наши выездные специалисты на месте производят маркировку на вашем складе.',
    },
    {
      q: 'Выезжаете ли на склад для оклейки?',
      a: 'Да, в рамках тарифов «Стандарт» и «PRO Склад». В Алматы бригада выезжает напрямую со своим мобильным оборудованием. В других регионах Казахстана оклейка согласовывается с выездом наших специалистов на ваш складской комплекс.',
    },
    {
      q: 'Подходят ли этикетки для торговых сетей и маркетплейсов (Wildberries, Ozon, Magnum)?',
      a: 'Да, на 100%. Мы печатаем этикетки промышленным термотрансферным способом со стойкой красящей лентой (resin/wax-resin), которая устойчива к трению и перепадам температур. На стикере размещаются Data Matrix, линейный штрихкод, знак ЕАС и все обязательные реквизиты согласно стандартам и техрегламентам.',
    },
    {
      q: 'Сколько времени занимает маркировка?',
      a: 'Цифровые файлы генерируются моментально. Печать тиража рулонов занимает от 1 рабочего дня (есть опция срочной печати за 24 часа). Сроки выездной оклейки партии согласуются индивидуально под ваш объем.',
    },
    {
      q: 'Предоставляются ли закрывающие документы?',
      a: 'Да, работаем официально. Предоставляем договор, счет на оплату, акт выполненных работ и электронную счет-фактуру (ЭСФ) через государственную систему.',
    },
  ];

  const faqsKz = [
    {
      q: 'Сіздерде ТМБ АЖ-мен («Таңба» АЖ) интеграция бар ма?',
      a: 'Иә, TANBOX жүйесінде ТМБ АЖ-мен (Қазақстан Республикасындағы таңбалаудың бірыңғай операторы) тікелей интеграция іске асырылған. Сіз біздің сайтта өз профиліңізбен кіріп, барлық функцияларды бір жеке кабинеттен орындай аласыз: кодтардың эмиссиясына тапсырыс беру, Data Matrix алу, қолдану туралы есептерді қалыптастыру және тауарды айналымға енгізу.',
    },
    {
      q: 'Таңбалау кодтарын қандай форматта беру керек?',
      a: 'Екі ыңғайлы әдіс бар: 1) ТМБ АЖ интеграциясы арқылы — кодтар мемлекеттік жүйеден тікелей автоматты түрде жүктеледі; 2) Файл арқылы — егер кодтарды өзіңіз жүктеп алған болсаңыз, тапсырыс кезінде стандартты .CSV файлын тіркеу жеткілікті.',
    },
    {
      q: 'Егер кодтар әлі жоқ болса не істеу керек?',
      a: 'ТМБ АЖ интеграциясының арқасында кодтарды тікелей TANBOX жеке кабинеті арқылы шығара аласыз. Егер тауарлар Ұлттық тауарлар каталогына (ҰТК / GS1) енгізілмеген болса, біз карточкаларды толтыруға және GTIN алуға көмектесеміз.',
    },
    {
      q: 'Дайын жапсырмаларды қандай түрде бересіздер?',
      a: 'Таңдалған тарифке байланысты: термотрансферлік рулондар түрінде (сканермен 100% оқылуын тексерумен), өз бетінше басып шығаруға арналған векторлық PDF түрінде немесе қоймаңызда толық таңбаланған тауар түрінде.',
    },
    {
      q: 'Сіздер Алматы қаласындасыздар. Қазақстанның басқа қалаларымен жұмыс қалай жүреді?',
      a: 'Өндірісіміз Алматы қаласында орналасқан. Егер дайын жапсырмалар қажет болса — жылдам басып шығарып, кез келген қалаға курьерлік қызметпен жібереміз. Оклейка қажет болса — мамандарымыз сіздің қоймаңызға шығып жұмыс істейді.',
    },
    {
      q: 'Оклейка үшін қоймаға барасыздар ма?',
      a: 'Иә, «Стандарт» және «PRO Склад» тарифтері бойынша мамандарымыз мобильді жабдықпен қоймаңызға шығып, тауарларды таңбалайды.',
    },
    {
      q: 'Жапсырмалар сауда желілері мен маркетплейстерге (Wildberries, Ozon, Magnum) сәйкес келе ме?',
      a: 'Иә, 100%. Жапсырмаларда Data Matrix, штрихкод, EAC белгісі және барлық міндетті деректемелер стандартқа сай орналасады.',
    },
    {
      q: 'Таңбалау қанша уақытты алады?',
      a: 'Цифрлық файлдар лезде жасалады. Рулондарды басып шығару — 1 жұмыс күнінен бастап (24 сағат ішінде жедел басып шығару бар). Оклейка мерзімі партия көлеміне байланысты.',
    },
    {
      q: 'Жабу құжаттары беріле ме?',
      a: 'Иә, ресми шарт, төлем шоты, орындалған жұмыстар актісі және ЭШФ ұсынылады.',
    },
  ];

  const faqsEn = [
    {
      q: 'Do you have direct integration with IS MPT (IS Tanba)?',
      a: 'Yes, TANBOX features direct API integration with IS MPT (the National Track & Trace Operator of Kazakhstan). You can log in with your account directly on our website and perform all operations in one window: order code emission, receive Data Matrix codes, submit utilization reports, and commission products into circulation without manual file handling.',
    },
    {
      q: 'In what format should marking codes be submitted?',
      a: 'Two convenient options: 1) Direct IS MPT integration — codes are automatically pulled into your order directly from the government system after logging into TANBOX; 2) File upload — if you already exported codes yourself, simply attach a standard .CSV file.',
    },
    {
      q: 'What if I do not have marking codes yet?',
      a: 'Thanks to our IS MPT integration, you can request code issuance directly in the TANBOX portal. If your products are not yet registered in the National Catalog (NKT / GS1 Kazakhstan), we will help register product cards, obtain GTINs, and generate codes turnkey.',
    },
    {
      q: 'In what form do you deliver the finished labels?',
      a: 'Depending on the selected tier: ready-to-use thermal transfer label rolls with 100% scanner verification, vector PDF files for in-house printing, or fully stickered goods on your warehouse floor.',
    },
    {
      q: 'You are located in Almaty. How do you work with other cities in Kazakhstan?',
      a: 'Our printing facility is in Almaty. For labels only, we produce and express-ship rolls to any city across Kazakhstan. For onsite stickering services, our traveling teams operate at your warehouse in your region.',
    },
    {
      q: 'Do you provide onsite warehouse stickering teams?',
      a: 'Yes, under our "Standard" and "PRO Warehouse" tiers. In Almaty, our crew operates with mobile industrial equipment. Across other regions of Kazakhstan, onsite stickering is scheduled based on batch volume.',
    },
    {
      q: 'Are your labels compliant with retail chains and marketplaces (Wildberries, Ozon, Magnum)?',
      a: 'Yes, 100%. We print with durable thermal transfer resin/wax-resin ribbons resistant to abrasion and temperature changes. Labels include Data Matrix, barcode, EAC mark, and all mandatory legal attributes.',
    },
    {
      q: 'How long does marking take?',
      a: 'Digital print layouts are generated instantly. Batch roll printing takes from 1 business day (rush 24-hour printing available). Onsite stickering timeframes are scheduled per batch volume.',
    },
    {
      q: 'Do you provide formal closing accounting documents?',
      a: 'Yes, we operate under official contracts, providing invoices, acts of completion, and electronic invoices (ESF) via the state tax system.',
    },
  ];

  const faqs = lang === 'kz' ? faqsKz : lang === 'en' ? faqsEn : faqsRu;

  return (
    <section className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            {lang === 'kz'
              ? 'Жиі қойылатын сұрақтар'
              : lang === 'en'
              ? 'Frequently Asked Questions'
              : 'Часто задаваемые вопросы'}
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            {lang === 'kz'
              ? 'ТМБ АЖ интеграциясы, кодтарды алу, басып шығару және таңбалау мерзімдері бойынша жауаптар.'
              : lang === 'en'
              ? 'Key answers regarding IS MPT integration, code generation, printing, and turnaround times.'
              : 'Ответы на главные вопросы по интеграции с ИС МПТ, выпуску кодов, печати и процедуре маркировки товаров.'}
          </p>
        </div>

        <div className="space-y-3 w-full">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left font-bold text-base text-[#111827] flex justify-between items-center gap-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <span className={isOpen ? 'text-[#0082FB]' : ''}>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#0082FB]' : 'text-[#64748B]'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-sm text-[#64748B] leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
