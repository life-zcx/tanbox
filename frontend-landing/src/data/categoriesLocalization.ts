import { CategoryData } from './categoriesData';

type LocalizedFields = Omit<CategoryData, 'id' | 'status' | 'tnved' | 'iconName' | 'calcCategoryCode'>;

export const CATEGORIES_LOCALIZATION: Record<'kz' | 'en', Record<string, LocalizedFields>> = {
  kz: {
    tobacco: {
      title: 'Темекі өнімдері және құрамында никотин бар бұйымдар',
      shortTitle: 'Темекі өнімдері',
      statusText: 'ҚР-дағы міндетті таңбалау',
      dateBadge: '2020 ж. бастап',
      dateFull: '2020 жылғы 1 қазаннан бастап',
      shortDesc: 'Сигареттер, стиктер, вейптер, электронды темекіге арналған сұйықтықтар',
      fullDesc: 'Сүзгілі сигареттер, папиростар, сигариллалар, кальян темекісі, қыздырылатын темекі (IQOS, glo стиктері) және электронды сигареттер (вейптер, бір реттік буландырғыштар мен сұйықтықтар) таңбалануға жатады. Қазақстан Республикасы аумағында таңбаланбаған бұйымдарды сатуға қатаң тыйым салынған.',
      keyFeatures: [
        'Әрбір қорап пен стикке GS1 DataMatrix кодын жекелей жағу',
        'Блоктарды көліктік қораптар мен паллеттерге агрегациялау (SSCC)',
        'Импорттан немесе өндірушіден түпкілікті кассалық чекке дейінгі толық бақылау',
        '1C есеп жүйесімен, «Таңба» АЖ және электронды ілеспе құжаттармен (СНТ) интеграция',
      ],
      processSteps: [
        { step: '01', title: 'Кодтарды эмиссиялау', desc: '«Таңба» АЖ-де GS1 Kazakhstan каталогы бойынша DataMatrix кодтарына тапсырыс беру' },
        { step: '02', title: 'Басу және жағу', desc: 'Жоғары айқындықта басу (300/600 dpi) немесе тікелей жағу' },
        { step: '03', title: 'Қораптарды агрегациялау', desc: 'Блоктарды сканерлеу және қораптарға бірегей SSCC кодтарын беру' },
        { step: '04', title: '«Таңба» АЖ-ге тапсыру', desc: 'Қабылдап алу-тапсыру актісін қалыптастырып, кодтарды ҚР айналымына енгізу' },
      ],
      faq: [
        { q: 'Бір реттік вейптер таңбалауға жата ма?', a: 'Иә, никотинді жеткізудің барлық электронды жүйелері мен сұйықтықтары міндетті түрде DataMatrix арқылы даналап таңбаланады.' },
        { q: 'Блоктарды агрегациялау қалай жүргізіледі?', a: 'Әрбір блок сканерленіп, содан кейін қорап үшін SSCC көліктік стикері басып шығарылады.' },
      ],
    },
    shoes: {
      title: 'Аяқ киім өнімдері',
      shortTitle: 'Аяқ киім өнімдері',
      statusText: 'ҚР-дағы міндетті таңбалау',
      dateBadge: '2021 ж. бастап',
      dateFull: '2021 жылғы 1 қарашадан бастап',
      shortDesc: 'Барлық аяқ киім түрлері, былғары, резеңке, тоқыма, арнайы аяқ киім',
      fullDesc: 'Таңбалау аяқ киімнің барлық санаттарын қамтиды: ерлер, әйелдер, балалар, былғары, резеңке, тоқыма, спорттық, үй және арнайы жұмыс аяқ киімдері. Таңбаланбаған аяқ киімдердің айналымына тыйым салынған.',
      keyFeatures: [
        'Қорапқа немесе тігілген тілшеге GS1 DataMatrix жапсырмасын жағу',
        'Күрделі құрама партиялармен және әртүрлі өлшемді қораптармен жұмыс істеу мүмкіндігі',
        'TANBOX мобильді көшпелі бригадаларының ҚР қоймаларына шығуы',
        'Дайын стикерлер мен актілерді «Таңба» АЖ-ге кілтке дейін жүктеу',
      ],
      processSteps: [
        { step: '01', title: 'Артикулдарды салыстыру', desc: 'Аяқ киім партияларын өлшемдері, түстері және брендтері бойынша тексеру' },
        { step: '02', title: 'Стикерлерді басу', desc: 'Үйкеліске төзімді жапсырмаларды термотрансферлік басып шығару' },
        { step: '03', title: 'Оклейка және агрегация', desc: 'Қораптарға стикер жапсыру және SSCC-паллеттерге жинақтау' },
        { step: '04', title: 'Айналымға енгізу', desc: 'Қоймада қабылдауды растау және «Таңба» АЖ-де тіркеу' },
      ],
      faq: [
        { q: 'Сатып алушы аяқ киімді қайтарғанда не істеу керек?', a: 'Код зақымдалған жағдайда, «Таңба» АЖ кабинетінде аяқ киімге қайта таңбалау жүргізіледі.' },
      ],
    },
    pharma: {
      title: 'Дәрілік заттар және фармацевтикалық препараттар',
      shortTitle: 'Дәрілік заттар',
      statusText: 'ҚР-дағы міндетті таңбалау',
      dateBadge: '2024 ж. бастап',
      dateFull: '2024 жылғы 1 шілдеден бастап',
      shortDesc: 'Мөлшерленген түрдегі және қаптамадағы барлық препараттар',
      fullDesc: 'Міндетті таңбалау ҚР-да тіркелген мөлшерленген түрдегі барлық дәрілік заттарға (таблеткалар, ампулалар, шәрбаттар, жақпамайлар) бастапқы және қайталама бөлшек қаптамада қолданылады.',
      keyFeatures: [
        'Сериялық нөмірлерді, жарамдылық мерзімдерін және партия нөмірлерін қатаң есепке алу',
        'Оқылу сапасын автоматты түрде верификациялайтын жоғары дәлдіктегі термобаспа',
        'ҚР Денсаулық сақтау министрлігінің Бірыңғай фармацевтикалық дерекқорымен интеграция',
        'Қорғаныс блистерлерін зақымдамай дәл оклейка жасауға кепілдік',
      ],
      processSteps: [
        { step: '01', title: 'Серияларды тіркеу', desc: 'Партияның серия нөмірлері мен жарамдылық мерзімдерін енгізу' },
        { step: '02', title: 'Верификатормен басу', desc: 'A/B оқылу класындағы жапсырмаларды басып шығару' },
        { step: '03', title: 'Қораптарды оклейкалау', desc: 'Дәрілік препараттардың қаптамаларына жекелей жағу' },
        { step: '04', title: 'Деректерді тапсыру', desc: 'Фарм-тізілімдерге және «Таңба» АЖ-ге мәліметтерді жіберу' },
      ],
      faq: [
        { q: 'Ветеринариялық дәрі-дәрмектер таңбалана ма?', a: 'Қазіргі кезеңде ветеринариялық препараттар міндетті тізімнен шығарылған.' },
      ],
    },
    water: {
      title: 'Қапталған су және құрамында шырын бар сусындар',
      shortTitle: 'Су және сусындар',
      statusText: 'ҚР-дағы міндетті таңбалау',
      dateBadge: '2024 ж. бастап',
      dateFull: '2024 жылғы 1 шілдеден бастап',
      shortDesc: 'Минералды, ауыз су, қантты сусындар',
      fullDesc: 'Минералды және ауыз су қапталған сулары, газдалған су, қантты сусындар, ПЭТ-бөтелкелердегі, шыныдағы және тетрапактардағы шырындар таңбалануға жатады.',
      keyFeatures: [
        'Автоматты және жартылай автоматты желілерде жоғары жылдамдықта стикерлеу',
        'Ылғалды қойма жағдайларына арналған суға төзімді жапсырмалар',
        'SSCC қалыптастыру арқылы топтық блоктар мен паллеттерді жинақтау',
      ],
      processSteps: [
        { step: '01', title: 'Макеттерді дайындау', desc: 'Ыдыс түрлері мен көлемдері бойынша кодтарды шығару' },
        { step: '02', title: 'Ағынды оклейка', desc: 'Қақпақтарға немесе затбелгілерге стикер жапсыру' },
        { step: '03', title: 'Топтама қалыптастыру', desc: 'Топтық қаптамаларға бірегей кодтар беру' },
      ],
      faq: [
        { q: 'Ылғал бөтелкелерге арналған стикерлерге қойылатын талаптар қандай?', a: 'Біз арнайы ылғалға төзімді желім мен полипропиленді жапсырмаларды қолданамыз.' },
      ],
    },
    saiga: {
      title: 'Киік дериваттары (мүйіздер)',
      shortTitle: 'Киік дериваттары',
      statusText: 'ҚР-дағы міндетті таңбалау',
      dateBadge: '2025 ж. 1 желтоқсаннан',
      dateFull: '2025 жылғы 1 желтоқсаннан бастап',
      shortDesc: 'Киік мүйіздері кез келген түрде',
      fullDesc: 'Табиғи қорды қатаң қорғау және заңды айналымды бақылау мақсатында киік дериваттарын (кез келген түрдегі мүйіздер) GS1 DataMatrix кодтарымен міндетті түрде даналап есепке алу және таңбалау.',
      keyFeatures: [
        'Әрбір бұйымға микро-таңбалау және қорғаныс биркалары',
        'ҚР биологиялық ресурстар мемлекеттік тізілімдерінде есепке алу',
        'Жалғандықты және заңсыз экспортты толық болдырмау',
      ],
      processSteps: [
        { step: '01', title: 'Түгендеу', desc: 'Даналап өлшеу және параметрлерді тіркеу' },
        { step: '02', title: 'Биркалау', desc: 'Қорғаныс пломба-биркасын бекіту' },
        { step: '03', title: 'Тізілімге енгізу', desc: 'Ұлттық жүйеде кодтарды тіркеу' },
      ],
      faq: [
        { q: 'Код қалай бекітіледі?', a: 'DataMatrix басылған арнайы шешілмейтін пломба-тартылғыш қолданылады.' },
      ],
    },
    oils: {
      title: 'Мотор майлары және автохимия',
      shortTitle: 'Майлар мен автохимия',
      statusText: '2026 жылы енгізіледі',
      dateBadge: '2026 жылдан бастап',
      dateFull: '2026 жыл (Кезең-кезеңімен іске қосу)',
      shortDesc: 'Мотор, трансмиссия майлары және автохимия',
      fullDesc: 'Мотор, компрессор, турбина, трансмиссия майлары, майлағыш материалдар, тежегіш сұйықтықтары және автохимия үшін таңбалау жүйесін енгізу.',
      stages: [
        { date: '2026 ж. 1 ақпаннан бастап', title: 'Мұнай өнімдері бар мотор, компрессор, турбина майлары мен майлағыштар' },
        { date: '2026 ж. 1 қыркүйектен бастап', title: 'Трансмиссия майлары, гидравликалық және тежегіш сұйықтықтары, антифриздер және автохимия' },
      ],
      keyFeatures: [
        'Қапталған канистрлер мен металл бөшкелерге арналған кешенді шешім',
        'DataMatrix жекелей және топтық таңбалауын қолдау',
        '«Таңба» АЖ және есеп жүйелерімен дайын интеграциялық модульдер',
      ],
      processSteps: [
        { step: '01', title: 'Партияларды тіркеу', desc: '«Таңба» АЖ жүйесінде DataMatrix кодтарына тапсырыс беру' },
        { step: '02', title: 'Ыдысты таңбалау', desc: 'Майға төзімді берік стикерлерді жапсыру' },
        { step: '03', title: 'Бөшкелерді/қораптарды агрегациялау', desc: 'Жөнелту кезінде көліктік SSCC-паллеттерді жинақтау' },
      ],
      faq: [
        { q: 'Бөшкелер қалай таңбаланады?', a: 'Бөшкелерге ірі көлемді, майға төзімді DataMatrix стикерлері жапсырылып, кейіннен агрегацияланады.' },
      ],
    },
    beer: {
      title: 'Сыра және сыра сусындары (алкогольсізді қоса алғанда)',
      shortTitle: 'Сыра және сусындар',
      statusText: '2026–2027 жылдары енгізіледі',
      dateBadge: '2026–2027',
      dateFull: '2026–2027 жылдар',
      shortDesc: 'Кегтер, бөтелкелер, алюминий банкалар',
      fullDesc: 'Өндіріс пен импортты есепке алу мақсатында ыдыстың барлық түрлеріндегі алкогольді және алкогольсіз сыраны таңбалау.',
      stages: [
        { date: '2026 ж. 1 ақпаннан бастап', title: 'Кегтерге құйылған өнімдер' },
        { date: '2026 ж. 1 қыркүйектен бастап', title: 'Бөтелкелерге құйылған өнімдер (шыны / ПЭТ)' },
        { date: '2027 ж. 1 қаңтардан бастап', title: 'Алюминий банкаларға құйылған өнімдер' },
      ],
      keyFeatures: [
        'Тығын мен қақпақтарды қорғайтын кегтерді таңбалау',
        'Құю желісінде автоматты тікелей басу немесе стикерлеу',
        'Сыра зауытынан дистрибьюторларға дейінгі партияларды толық есепке алу',
      ],
      processSteps: [
        { step: '01', title: 'Кодтарға тапсырыс', desc: 'Ыдыс түрлері бойынша кодтарды генерациялау (кег/бөтелке/банка)' },
        { step: '02', title: 'Кодтарды жағу', desc: 'Желі жылдамдығында қақпақтар мен банкаларға жапсыру' },
        { step: '03', title: 'Жөнелту', desc: 'Қораптарға агрегациялау және жүкқұжаттарды қалыптастыру' },
      ],
      faq: [
        { q: 'Кегтер қалай таңбаланады?', a: 'Код кег тығыздалмас бұрын қорғаныш қақпақшасына жағылады.' }
      ],
    },
    bad: {
      title: 'Биологиялық белсенді қоспалар (ББҚ)',
      shortTitle: 'ББҚ (Қоспалар)',
      statusText: '2026 жылы енгізіледі',
      dateBadge: '2026 ж. 1 қыркүйектен',
      dateFull: '2026 жылғы 1 қыркүйектен бастап',
      shortDesc: 'МТК куәлігі бар тағамдық қоспалар',
      fullDesc: 'МТК (Мемлекеттік тіркеу туралы куәлік) бірыңғай тізілімінде тіркелген тағамдық биологиялық белсенді қоспаларды (ББҚ) міндетті таңбалау.',
      keyFeatures: [
        'Банкаларды, сашелерді және қораптарды жекелей стикерлеу',
        'Айналымға енгізу кезінде МТК деректерінің сәйкестігін тексеру',
        'Дәріханалар мен маркетплейстер нарығын сұр импорттан қорғау',
      ],
      processSteps: [
        { step: '01', title: 'МТК тексеру', desc: '«Таңба» АЖ-де МТК куәлігін тауар карточкаларына байлау' },
        { step: '02', title: 'Кодтарды басу', desc: 'Құтыларға DataMatrix стикерлерін жағу' },
        { step: '03', title: 'Агрегациялау', desc: 'Қораптарды көліктік қораптарға жинақтау' },
      ],
      faq: [
        { q: 'Спорттық дәрумендер таңбалауға жата ма?', a: 'Егер олар ББҚ ретінде тіркелген болса және МТК куәлігі болса — иә, таңбалауға жатады.' },
      ],
    },
    textile: {
      title: 'Жеңіл өнеркәсіп және тоқыма тауарлары',
      shortTitle: 'Текстиль және киім',
      statusText: '2026–2027 жылдары енгізіледі',
      dateBadge: '2026–2027',
      dateFull: '2026–2027 жж. (Қалдықтар 2028 жылға дейін)',
      shortDesc: 'Былғары, іш киім, күртешелер, 2028 жылға дейінгі қалдықтар',
      fullDesc: 'Киім мен тоқыманың барлық саласын ауқымды кезең-кезеңімен қамту: былғары және үлбір бұйымдары, іш киім, пальто, күртешелер, костюмдер, жейделер, трикотаж. Сатылмаған қалдықтарды 2028 жылғы 1 қаңтарға дейін таңбалау қажет.',
      stages: [
        { date: '2026 ж. 1 желтоқсаннан', title: 'Былғары киім, жасанды үлбір, шаңғы костюмдері, төсек/үстел/асүй жаймалары (ережелер 14.11.2026 бастап)' },
        { date: '2027 ж. 1 наурыздан', title: 'Сыртқы киім (пальто, күртеше, плащ, желбегей), блузкалар, пуловерлер, кардигандар, шарфтар' },
        { date: '2027 ж. 1 қазаннан', title: 'Костюмдер, пиджактар, көйлектер, белдемшелер, шалбарлар, комбинезондар, спорттық костюмдер' },
        { date: '2028 ж. 1 қаңтарға дейін', title: 'Ережелер күшіне енгенге дейін әкелінген сатылмаған тауар қалдықтарын таңбалау' },
      ],
      keyFeatures: [
        'Тауарлық жапсырмаларды, тігілген таспаларды немесе қаптаманы таңбалау',
        'Импорттаушылардың қоймаларын жаппай оклейкалау үшін TANBOX көшпелі сервистік бригадалары',
        '2028 жылғы 1 қаңтарға дейін текстиль қалдықтарын таңбалаудың арнайы модулі',
      ],
      processSteps: [
        { step: '01', title: 'ТН ВЭД бойынша жіктеу', desc: 'Киімнің әрбір тобы үшін күшіне ену кезеңін анықтау' },
        { step: '02', title: 'Жапсырмаларды басу', desc: 'Картон аспалы ярлықтарды стикермен термобасып шығару' },
        { step: '03', title: 'Қалдықтарды таңбалау', desc: 'Қоймадағы ескі қорларды 2028 жылға дейін даналап есепке алу' },
      ],
      faq: [
        { q: 'Кодсыз киім қалдықтарын қай күнге дейін сатуға болады?', a: 'Сатылмаған қалдықтарды 2028 жылғы 1 қаңтарға дейін таңбалауға рұқсат етілген.' },
      ],
    },
    jewelry: {
      title: 'Зергерлік бұйымдар және бағалы металдар',
      shortTitle: 'Зергерлік бұйымдар',
      statusText: '2026 жылы енгізіледі',
      dateBadge: '2026 ж. 1 желтоқсаннан',
      dateFull: '2026 жылғы 1 желтоқсаннан бастап',
      shortDesc: 'Бағалы металдар мен асыл тастардан жасалған бұйымдар',
      fullDesc: 'Бағалы металдардан (алтын, күміс, платина) және асыл тастардан жасалған зергерлік бұйымдарды таңбалау.',
      keyFeatures: [
        'Биркалар мен зергерлік пломбаларға DataMatrix микро-таңбалауы',
        'Өндірістен немесе импорттан бастап витринаға дейін әрбір бұйымды қатаң есепке алу',
        'Зергерлік дүкендер нарығын жасандылықтан және заңсыз әкелуден қорғау',
      ],
      processSteps: [
        { step: '01', title: 'Микро-кодтарға тапсырыс', desc: 'Жоғары тығыздықтағы кодтарды генерациялау' },
        { step: '02', title: 'Пломбалау', desc: 'Зергерлік биркаға қорғаныс пломбасын бекіту' },
        { step: '03', title: 'Сату', desc: 'Зергерлік дүкенде сату кезінде сканерлеу' },
      ],
      faq: [
        { q: 'Код металға тікелей жағыла ма?', a: 'Негізгі әдіс — бұйымның биркалық пломбаларына кодтарды жағу.' },
      ],
    },
  },
  en: {
    tobacco: {
      title: 'Tobacco & Nicotine Products',
      shortTitle: 'Tobacco',
      statusText: 'Mandatory Serialization in KZ',
      dateBadge: 'Since 2020',
      dateFull: 'From October 1, 2020',
      shortDesc: 'Cigarettes, heated tobacco sticks, vapes, e-liquids',
      fullDesc: 'Mandatory serialization applies to filtered cigarettes, cigarillos, hookah tobacco, heated tobacco sticks (IQOS, glo), and electronic cigarettes (vapes, disposable pods, e-liquids). Sale of unmarked tobacco in Kazakhstan is strictly prohibited.',
      keyFeatures: [
        'Item-level GS1 DataMatrix code printing on every pack and container',
        'Aggregation of cartons into transport shippers and pallets (SSCC)',
        'End-to-end traceability from import clearance to retail receipt checkout',
        'Direct integration with 1C ERP, IS Tanba, and digital consignment notes (SNT)',
      ],
      processSteps: [
        { step: '01', title: 'Code Issuance', desc: 'Ordering DataMatrix code pools in IS Tanba via GS1 Kazakhstan' },
        { step: '02', title: 'Print & Apply', desc: 'High-resolution industrial roll printing (300/600 dpi) or direct thermal transfer' },
        { step: '03', title: 'Box Aggregation', desc: 'Scanning packs and generating unique SSCC carton labels' },
        { step: '04', title: 'IS Tanba Turnover', desc: 'Submission of application reports and legal turnover release in KZ' },
      ],
      faq: [
        { q: 'Are disposable vapes subject to serialization?', a: 'Yes, all electronic nicotine delivery systems and e-liquids require mandatory piece-by-piece DataMatrix labeling.' },
        { q: 'How does carton aggregation work?', a: 'Each pack is verified with a scanner, and a parent SSCC barcode label is generated for the shipper carton.' },
      ],
    },
    shoes: {
      title: 'Footwear and Shoes',
      shortTitle: 'Footwear',
      statusText: 'Mandatory Serialization in KZ',
      dateBadge: 'Since 2021',
      dateFull: 'From November 1, 2021',
      shortDesc: 'All footwear types: leather, rubber, textile, safety shoes',
      fullDesc: 'Mandatory labeling applies to all footwear: men’s, women’s, children’s, leather, rubber, textile, athletic, and industrial work shoes. Unmarked footwear circulation is prohibited.',
      keyFeatures: [
        'GS1 DataMatrix label applied to retail shoe box or stitched tongue label',
        'Workflows for mixed SKU batches, multiple sizes, and varied case packs',
        'Dispatched mobile TANBOX labeling crews directly to client warehouses across KZ',
        'Turnkey code commissioning and documentation filing in IS Tanba',
      ],
      processSteps: [
        { step: '01', title: 'SKU Cross-Checking', desc: 'Verifying footwear batch attributes by size, color, brand, and GTIN' },
        { step: '02', title: 'Label Printing', desc: 'Thermal transfer printing of scratch-resistant adhesive labels' },
        { step: '03', title: 'Labeling & Aggregation', desc: 'Applying labels to shoe boxes and packing into SSCC pallet shippers' },
        { step: '04', title: 'Turnover Commissioning', desc: 'Confirmation of warehouse acceptance and IS Tanba activation' },
      ],
      faq: [
        { q: 'What happens when a customer returns shoes?', a: 'If the DataMatrix label is damaged, an official re-labeling procedure is executed in the IS Tanba portal.' },
      ],
    },
    pharma: {
      title: 'Medicines & Pharmaceuticals',
      shortTitle: 'Pharmaceuticals',
      statusText: 'Mandatory Serialization in KZ',
      dateBadge: 'Since 2024',
      dateFull: 'From July 1, 2024',
      shortDesc: 'Dosage-form medications and retail packaged drugs',
      fullDesc: 'Mandatory track & trace applies to all registered medicinal products in Kazakhstan across all dosage forms (tablets, ampoules, syrups, ointments) in primary and secondary retail packaging.',
      keyFeatures: [
        'Strict serialization of serial numbers, batch lot codes, and expiry dates',
        'High-precision thermal transfer printing with automatic ISO grade A/B verification',
        'Synchronized with the Unified Pharmaceutical Database of the Ministry of Healthcare of RK',
        'Flawless labeling execution without compromising protective sterile packaging',
      ],
      processSteps: [
        { step: '01', title: 'Batch Registration', desc: 'Entering batch series numbers and expiration dates into catalog' },
        { step: '02', title: 'Verified Printing', desc: 'Printing grade A/B verified DataMatrix label pools' },
        { step: '03', title: 'Carton Application', desc: 'Piece-by-piece application to secondary pharma cartons' },
        { step: '04', title: 'Registry Sync', desc: 'Submitting turnover reports to pharma registries and IS Tanba' },
      ],
      faq: [
        { q: 'Are veterinary medications serialized?', a: 'At the current stage, veterinary medicines are excluded from mandatory serialization.' },
      ],
    },
    water: {
      title: 'Bottled Water & Juices',
      shortTitle: 'Bottled Water',
      statusText: 'Mandatory Serialization in KZ',
      dateBadge: 'Since 2024',
      dateFull: 'From July 1, 2024',
      shortDesc: 'Mineral water, drinking water, sweetened drinks, juices',
      fullDesc: 'Serialization applies to mineral and drinking packaged water, carbonated water, sugar-sweetened beverages, juices, and nectars in PET bottles, glass, and Tetra Pak.',
      keyFeatures: [
        'High-speed labeling on automated and semi-automated production lines',
        'Moisture-resistant polypropylene labels engineered for humid warehouse environments',
        'Carton shrink-pack and pallet SSCC aggregation',
      ],
      processSteps: [
        { step: '01', title: 'Layout Setup', desc: 'Generating code pools tailored for bottle formats and cap sizes' },
        { step: '02', title: 'Flow Application', desc: 'Applying DataMatrix labels to bottle caps or side packaging' },
        { step: '03', title: 'Shrink-Pack Coding', desc: 'Assigning group aggregation codes to shrink-wrapped bundles' },
      ],
      faq: [
        { q: 'What label material is used for wet condensation bottles?', a: 'We use industrial moisture-proof polypropylene labels with specialized acrylic adhesive.' },
      ],
    },
    saiga: {
      title: 'Saiga Horns & Derivatives',
      shortTitle: 'Saiga Horns',
      statusText: 'Mandatory Serialization in KZ',
      dateBadge: 'From Dec 1, 2025',
      dateFull: 'From December 1, 2025',
      shortDesc: 'Saiga horns and biological derivatives',
      fullDesc: 'Mandatory item-level serialization of saiga antelope derivatives with GS1 DataMatrix codes for wildlife resource preservation and legal supply chain monitoring.',
      keyFeatures: [
        'Micro-serialization and tamper-evident security tags for every unit',
        'Official logging in state biological resource registries of RK',
        'Elimination of illicit export and counterfeit trade',
      ],
      processSteps: [
        { step: '01', title: 'Inventory & Grading', desc: 'Individual measurement, weighing, and attribute logging' },
        { step: '02', title: 'Tagging', desc: 'Fastening tamper-evident DataMatrix seal tags' },
        { step: '03', title: 'Registry Sync', desc: 'Registering serialized items into state environmental portals' },
      ],
      faq: [
        { q: 'How is the code attached?', a: 'A specialized non-removable tamper-evident security tie with laser-marked DataMatrix is fastened.' },
      ],
    },
    oils: {
      title: 'Motor Oils and Automotive Fluids',
      shortTitle: 'Motor Oils',
      statusText: 'Implementation in 2026',
      dateBadge: 'From 2026',
      dateFull: '2026 (Phased Rollout)',
      shortDesc: 'Engine, transmission oils, brake fluids, antifreezes',
      fullDesc: 'Track & trace rollout for motor, compressor, turbine, transmission oils, lubricants, brake fluids, coolants, and automotive chemicals.',
      stages: [
        { date: 'From Feb 1, 2026', title: 'Motor, compressor, turbine oils and petroleum-based lubricants' },
        { date: 'From Sep 1, 2026', title: 'Transmission oils, hydraulic fluids, brake fluids, antifreezes, and car care' },
      ],
      keyFeatures: [
        'Dedicated solutions for retail plastic canisters and 200L industrial steel drums',
        'Support for item-level and group DataMatrix barcode hierarchy',
        'Direct integration modules with IS Tanba and warehouse ERP systems',
      ],
      processSteps: [
        { step: '01', title: 'Batch Issuance', desc: 'Requesting DataMatrix code pools in IS Tanba system' },
        { step: '02', title: 'Container Labeling', desc: 'Applying chemical and oil-resistant polypropylene labels' },
        { step: '03', title: 'Drum & Pallet Aggregation', desc: 'Generating master SSCC shipping pallet barcodes' },
      ],
      faq: [
        { q: 'How are 200-liter drums labeled?', a: 'Enlarged chemical-resistant DataMatrix labels are applied to drum lids with subsequent pallet aggregation.' },
      ],
    },
    beer: {
      title: 'Beer & Malt Beverages (Including Non-Alcoholic)',
      shortTitle: 'Beer & Drinks',
      statusText: 'Implementation in 2026–2027',
      dateBadge: '2026–2027',
      dateFull: '2026–2027',
      shortDesc: 'Kegs, glass bottles, PET, aluminum cans',
      fullDesc: 'Serialization of alcoholic and non-alcoholic beer across all packaging formats for production auditing and customs import tracking.',
      stages: [
        { date: 'From Feb 1, 2026', title: 'Draft beer in industrial kegs' },
        { date: 'From Sep 1, 2026', title: 'Bottled beer in glass and PET containers' },
        { date: 'From Jan 1, 2027', title: 'Canned beer in aluminum cans' },
      ],
      keyFeatures: [
        'Keg cap serialization with tamper-evident seal protection',
        'Direct inline printing or high-speed rotary applicator labeling',
        'End-to-end supply chain auditing from breweries to distributors'
      ],
      processSteps: [
        { step: '01', title: 'Code Ordering', desc: 'Generating code pools by packaging type (keg, bottle, can)' },
        { step: '02', title: 'Inline Application', desc: 'Applying codes to bottle crowns, cans, or keg caps at line speed' },
        { step: '03', title: 'Dispatch', desc: 'Carton and pallet aggregation with digital consignment notes' },
      ],
      faq: [
        { q: 'How are commercial kegs labeled?', a: 'The DataMatrix code is placed onto the protective keg cap seal prior to delivery.' },
      ],
    },
    bad: {
      title: 'Dietary Supplements (Supplements)',
      shortTitle: 'Supplements',
      statusText: 'Implementation in 2026',
      dateBadge: 'From Sep 1, 2026',
      dateFull: 'From September 1, 2026',
      shortDesc: 'Nutritional supplements with State Registration Certificate',
      fullDesc: 'Mandatory track & trace for dietary supplements registered in the Unified State Registration Certificate (SGR) registry.',
      keyFeatures: [
        'Item-level labeling on bottles, blister packs, and sachets',
        'Mandatory SGR certificate validation upon turnover release',
        'Protection of pharmacies and marketplaces from counterfeit trade',
      ],
      processSteps: [
        { step: '01', title: 'SGR Verification', desc: 'Linking SGR certificate numbers to product cards in IS Tanba' },
        { step: '02', title: 'Code Printing', desc: 'Applying verified DataMatrix labels to supplement jars' },
        { step: '03', title: 'Box Aggregation', desc: 'Packing retail units into master shipping cases with SSCC' },
      ],
      faq: [
        { q: 'Are sports fitness vitamins serialized?', a: 'If registered as dietary supplements with an official SGR certificate, they are mandatory for serialization.' },
      ],
    },
    textile: {
      title: 'Apparel and Light Industry Textiles',
      shortTitle: 'Textiles & Apparel',
      statusText: 'Implementation in 2026–2027',
      dateBadge: '2026–2027',
      dateFull: '2026–2027 (Remaining stock until 2028)',
      shortDesc: 'Leather, linen, outerwear, unsold stock until 2028',
      fullDesc: 'Extensive phased track & trace across apparel: leather goods, faux fur, bed linen, coats, jackets, suits, knitwear, and dresses. Existing unsold warehouse inventory must be serialized by January 1, 2028.',
      stages: [
        { date: 'From Dec 1, 2026', title: 'Leather apparel, faux fur, ski suits, bed/table/kitchen linen' },
        { date: 'From Mar 1, 2027', title: 'Outerwear (coats, jackets, raincoats), blouses, pullovers, cardigans, scarves' },
        { date: 'From Oct 1, 2027', title: 'Suits, blazers, dresses, skirts, trousers, jumpsuits, tracksuits' },
        { date: 'Until Jan 1, 2028', title: 'Deadline for labeling remaining unsold stock imported prior to regulations' },
      ],
      keyFeatures: [
        'Serialization of hang tags, sewn-in care ribbons, or polybags',
        'Traveling TANBOX mobile teams dispatched to client warehouses across Kazakhstan',
        'Turnkey legacy inventory serialization module up until January 1, 2028',
      ],
      processSteps: [
        { step: '01', title: 'HS Code Classification', desc: 'Determining exact regulatory enforcement dates per clothing category' },
        { step: '02', title: 'Tag Printing', desc: 'Thermal printing of adhesive labels and attached hang tags' },
        { step: '03', title: 'Stock Serialization', desc: 'Item-level cataloging and labeling of legacy warehouse inventory' },
      ],
      faq: [
        { q: 'Until what date can apparel inventory without codes be sold?', a: 'Unsold inventory may be serialized and put into circulation until January 1, 2028.' },
      ],
    },
    jewelry: {
      title: 'Jewelry and Precious Metals',
      shortTitle: 'Jewelry',
      statusText: 'Implementation in 2026',
      dateBadge: 'From Dec 1, 2026',
      dateFull: 'From December 1, 2026',
      shortDesc: 'Jewelry items and parts made of precious metals and gemstones',
      fullDesc: 'Mandatory track & trace for jewelry crafted from precious metals (gold, silver, platinum) and gemstones.',
      keyFeatures: [
        'Micro DataMatrix marking on jewelry hang tags and tamper-evident seals',
        'Strict item-level tracing from manufacture/import to retail showroom showcase',
        'Safeguarding jewelry retail chains against counterfeits and contraband',
      ],
      processSteps: [
        { step: '01', title: 'Micro-Code Ordering', desc: 'High-density DataMatrix code generation for small surfaces' },
        { step: '02', title: 'Sealing', desc: 'Fastening certified tamper-evident seal to jewelry tags' },
        { step: '03', title: 'Retail Sale', desc: 'Checkout point scanning with automated fiscal decommissioning' },
      ],
      faq: [
        { q: 'Is the code laser-engraved directly onto the precious metal?', a: 'The primary regulatory method is applying high-density codes to official jewelry hang tag seals.' },
      ],
    },
  },
};

export function getLocalizedCategory(cat: CategoryData, lang: 'kz' | 'ru' | 'en'): CategoryData {
  if (lang === 'ru') return cat;
  const loc = CATEGORIES_LOCALIZATION[lang]?.[cat.id];
  if (!loc) return cat;
  return {
    ...cat,
    ...loc,
  };
}
