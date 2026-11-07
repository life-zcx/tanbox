import type { CategoryStage } from './categoriesData';

// Translate the owner's original timeline without replacing or dropping dates.
const TITLES: Record<string, [string, string]> = {
  'Начало пилотного проекта': ['Пилоттық жобаның басталуы', 'Pilot project starts'],
  'Завершение пилотного проекта': ['Пилоттық жобаның аяқталуы', 'Pilot project ends'],
  'Проведение эксперимента': ['Эксперимент өткізу', 'Experiment conducted'],
  'Обязательная маркировка сигарет с фильтром': ['Сүзгілі сигареттерді міндетті таңбалау', 'Mandatory marking of filter cigarettes'],
  'Введение маркировки нагреваемого табака (стики для IQOS, glo)': ['Қыздырылатын темекіні таңбалауды енгізу (IQOS, glo стиктері)', 'Marking introduced for heated tobacco (IQOS, glo sticks)'],
  'Маркировка прочих табачных изделий (сигариллы, сигары, кальянный табак)': ['Өзге темекі өнімдерін таңбалау (сигариллалар, сигаралар, қорқор темекісі)', 'Marking of other tobacco products (cigarillos, cigars, hookah tobacco)'],
  'Запрет на производство и импорт обуви без маркировки': ['Таңбалаусыз аяқ киімді өндіруге және импорттауға тыйым салу', 'Production and import of unmarked footwear prohibited'],
  'Разрешена реализация немаркированных остатков, ввезенных до 1 ноября 2021 г.': ['2021 жылғы 1 қарашаға дейін әкелінген таңбаланбаған қалдықтарды сатуға рұқсат етіледі', 'Sale permitted for unmarked stock imported before 1 November 2021'],
  'Окончание маркировки остатков: полный запрет на оборот немаркированной обуви': ['Қалдықтарды таңбалау аяқталады: таңбаланбаған аяқ киім айналымына толық тыйым салынады', 'Stock marking deadline: circulation of unmarked footwear fully prohibited'],
  'Разрешена маркировка на собственных складах импортеров из Перечня складов': ['Қоймалар тізіміндегі импорттаушылардың өз қоймаларында таңбалауға рұқсат етіледі', 'Marking permitted at importers’ own warehouses included in the warehouse list'],
  'Вступление в силу ст. 284 КоАП РК: штрафы за продажу товаров без маркировки': ['ҚР ӘҚБтК 284-бабының күшіне енуі: таңбаланбаған тауарларды сатқаны үшін айыппұлдар', 'Article 284 of Kazakhstan’s Administrative Code takes effect: penalties for selling unmarked goods'],
  'Передача администрирования маркировки обуви из МПС РК в Министерство финансов': ['Аяқ киімді таңбалауды әкімшілендіруді ӨҚМ-нен Қаржы министрлігіне беру', 'Footwear marking administration transferred from the Ministry of Industry to the Ministry of Finance'],
  'Запуск пилотного проекта маркировки лекарств в РК': ['ҚР-да дәрілерді таңбалау пилоттық жобасының іске қосылуы', 'Medicine marking pilot launched in Kazakhstan'],
  'Утверждение методических рекомендаций и перечня пилотных препаратов': ['Әдістемелік ұсынымдар мен пилоттық дәрілер тізімін бекіту', 'Guidelines and pilot medicine list approved'],
  'Комплексный план развития фармпромышленности (Распоряжение № 132-Р)': ['Фармацевтика өнеркәсібін дамытудың кешенді жоспары (№ 132-Р өкім)', 'Comprehensive pharmaceutical industry development plan (Order No. 132-R)'],
  'Успешное завершение пилотного проекта': ['Пилоттық жобаның сәтті аяқталуы', 'Pilot project successfully completed'],
  'Введение 100% обязательной маркировки всех зарегистрированных лекарств': ['Барлық тіркелген дәрілерді 100% міндетті таңбалауды енгізу', 'Mandatory marking introduced for all registered medicines'],
  'Обязательная маркировка упакованной питьевой и минеральной воды': ['Қапталған ауыз су мен минералды суды міндетті таңбалау', 'Mandatory marking of packaged drinking and mineral water'],
  'Введение маркировки сладких сахаросодержащих напитков и соков': ['Қант қосылған тәтті сусындар мен шырындарды таңбалауды енгізу', 'Marking introduced for sweetened drinks and juices'],
  'Сквозная прослеживаемость групповых упаковок и кассовое выбытие': ['Топтық қаптамалардың толық қадағалануы және кассада айналымнан шығарылуы', 'End-to-end traceability of grouped packaging and checkout withdrawal'],
  'Введение обязательной маркировки дериватов (рогов) сайгака': ['Киік дериваттарын (мүйіздерін) міндетті таңбалауды енгізу', 'Mandatory marking introduced for saiga derivatives (horns)'],
  'Ввод обязательной маркировки в отношении моторных масел (произведенных с 1 февраля 2026 года)': ['2026 жылғы 1 ақпаннан бастап өндірілген мотор майларын міндетті таңбалауды енгізу', 'Mandatory marking introduced for motor oils manufactured from 1 February 2026'],
  'Введение обязательной маркировки прочих смазочных жидкостей по кодам ТН ВЭД ЕАЭС': ['ЕАЭО СЭҚ ТН кодтары бойынша өзге майлау сұйықтықтарын міндетті таңбалауды енгізу', 'Mandatory marking introduced for other lubricating fluids under EAEU HS codes'],
  'Введение обязательной прослеживаемости товаров': ['Тауарларды міндетті қадағалауды енгізу', 'Mandatory product traceability introduced'],
  'Введение обязательной маркировки пива и пивных напитков в кегах (произведенных с 1 февраля)': ['1 ақпаннан бастап өндірілген кегтегі сыра мен сыра сусындарын міндетті таңбалауды енгізу', 'Mandatory marking introduced for keg beer and beer drinks manufactured from 1 February'],
  'Введение обязательной маркировки пива и пивных напитков в бутылках (произведенных с 1 сентября)': ['1 қыркүйектен бастап өндірілген бөтелкедегі сыра мен сыра сусындарын міндетті таңбалауды енгізу', 'Mandatory marking introduced for bottled beer and beer drinks manufactured from 1 September'],
  'Введение обязательной маркировки в банках (произведенных с 1 января) и полная прослеживаемость': ['1 қаңтардан бастап өндірілген банкадағы өнімдерді міндетті таңбалау және толық қадағалау', 'Mandatory marking introduced for canned products manufactured from 1 January, with full traceability'],
  'Запуск пилотного проекта маркировки добавок': ['Қоспаларды таңбалау пилоттық жобасының іске қосылуы', 'Supplement marking pilot launched'],
  'Завершение пилотного тестирования': ['Пилоттық сынақтың аяқталуы', 'Pilot testing completed'],
  'Старт обязательной маркировки (для БАД, произведенных с 1 сентября)': ['1 қыркүйектен бастап өндірілген ББҚ-ны міндетті таңбалаудың басталуы', 'Mandatory marking starts for supplements manufactured from 1 September'],
  'Обязательная передача сведений об обороте (акты приёма-передачи и кассы)': ['Айналым туралы мәліметтерді міндетті беру (қабылдау-тапсыру актілері және кассалар)', 'Mandatory circulation reporting through transfer acts and cash registers'],
  'Публичные обсуждения АРВ по ТЛП': ['Жеңіл өнеркәсіп тауарлары бойынша реттеушілік әсерді талдауды қоғамдық талқылау', 'Public consultation on regulatory impact analysis for light-industry goods'],
  'Запуск услуги по получению КИЗ для экспорта ТЛП в РФ': ['Жеңіл өнеркәсіп тауарларын РФ-ға экспорттау үшін сәйкестендіру белгілерін алу қызметінің іске қосылуы', 'Identification-code service launched for light-industry exports to Russia'],
  'Публичные обсуждения АРВ по ТЛП и одобрение результатов АРВ на МВК': ['Жеңіл өнеркәсіп тауарлары бойынша талдауды қоғамдық талқылау және нәтижелерін ведомствоаралық комиссияда мақұлдау', 'Public consultation and interdepartmental approval of regulatory impact analysis for light-industry goods'],
  'Введение поэтапной обязательной маркировки произведённых и (или) импортированных ТЛП': ['Өндірілген және (немесе) импортталған жеңіл өнеркәсіп тауарларын кезең-кезеңімен міндетті таңбалауды енгізу', 'Phased mandatory marking introduced for manufactured and/or imported light-industry goods'],
  'Прослеживаемость маркированных ТЛП': ['Таңбаланған жеңіл өнеркәсіп тауарларын қадағалау', 'Traceability of marked light-industry goods'],
  'Разрешается продажа немаркированных остатков ТЛП, произведённых или импортированных до 1 декабря 2026 года': ['2026 жылғы 1 желтоқсанға дейін өндірілген немесе импортталған жеңіл өнеркәсіп тауарларының таңбаланбаған қалдықтарын сатуға рұқсат етіледі', 'Sale permitted for unmarked light-industry stock manufactured or imported before 1 December 2026'],
  'Введение обязательной маркировки ювелирных изделий из драгоценных металлов и драгоценных камней': ['Бағалы металдар мен асыл тастардан жасалған зергерлік бұйымдарды міндетті таңбалауды енгізу', 'Mandatory marking introduced for jewelry made of precious metals and gemstones'],
  'Введение обязательной маркировки древесины': ['Сүректі міндетті таңбалауды енгізу', 'Mandatory timber marking introduced'],
  'Введение обязательной маркировки сжиженного нефтяного газа, реализуемого в бытовых баллонах': ['Тұрмыстық баллондарда сатылатын сұйытылған мұнай газын міндетті таңбалауды енгізу', 'Mandatory marking introduced for liquefied petroleum gas sold in domestic cylinders'],
};

const MONTHS = [
  ['января', 'Январь', 'қаңтар', 'January', 'қаңтарға'], ['февраля', 'Февраль', 'ақпан', 'February', 'ақпанға'],
  ['марта', 'Март', 'наурыз', 'March', 'наурызға'], ['апреля', 'Апрель', 'сәуір', 'April', 'сәуірге'],
  ['мая', 'Май', 'мамыр', 'May', 'мамырға'], ['июня', 'Июнь', 'маусым', 'June', 'маусымға'],
  ['июля', 'Июль', 'шілде', 'July', 'шілдеге'], ['августа', 'Август', 'тамыз', 'August', 'тамызға'],
  ['сентября', 'Сентябрь', 'қыркүйек', 'September', 'қыркүйекке'], ['октября', 'Октябрь', 'қазан', 'October', 'қазанға'],
  ['ноября', 'Ноябрь', 'қараша', 'November', 'қарашаға'], ['декабря', 'Декабрь', 'желтоқсан', 'December', 'желтоқсанға'],
];

function translatedDate(date: string, lang: 'kz' | 'en'): string {
  const match = /^(До )?(?:(\d{1,2}) )?([А-Яа-яё]+) (\d{4}) г\.$/.exec(date);
  if (!match) return date.replace(/ год$/, lang === 'kz' ? ' жыл' : '');
  const [, until, day, month, year] = match;
  const names = MONTHS.find(row => row[0] === month || row[1] === month);
  if (!names) throw new Error(`Untranslated timeline date: ${date}`);
  return lang === 'en' ? `${until ? 'By ' : ''}${day ? day + ' ' : ''}${names[3]} ${year}`
    : `${year} ж. ${day ? day + ' ' : ''}${names[until ? 4 : 2]}${until ? ' дейін' : ''}`;
}

export function translateCategoryStages(stages: CategoryStage[] | undefined, lang: 'kz' | 'en'): CategoryStage[] | undefined {
  return stages?.map(stage => {
    const title = TITLES[stage.title]?.[lang === 'kz' ? 0 : 1];
    if (!title) throw new Error(`Untranslated timeline title: ${stage.title}`);
    return { date: translatedDate(stage.date, lang), title };
  });
}
