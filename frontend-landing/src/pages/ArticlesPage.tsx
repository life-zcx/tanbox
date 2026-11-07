import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  ArrowRight, 
  PhoneCall,
  FileText
} from 'lucide-react';
import { ARTICLES_DATA, ArticleData, getLocalizedArticles } from '../data/articlesData';
import { useLanguage } from '../context/LanguageContext';

const ServiceOrderModal = React.lazy(() => import('../components/modals/ServiceOrderModal').then(module => ({ default: module.ServiceOrderModal })));

export const ArticlesPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState(
    lang === 'kz' ? 'Кешенді аудит / Басқа сұрақ' : lang === 'en' ? 'Turnkey Audit / Inquiries' : 'Другой вопрос / Комплексный аудит'
  );

  const handleOpenModal = (title?: string) => {
    setSelectedServiceTitle(
      title || (lang === 'kz' ? 'Кешенді аудит / Басқа сұрақ' : lang === 'en' ? 'Turnkey Audit / Inquiries' : 'Другой вопрос / Комплексный аудит')
    );
    setIsModalOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Законодательство':
        return lang === 'kz' ? 'Заңнама' : lang === 'en' ? 'Regulations' : 'Законодательство';
      case 'Тренды 2026':
        return lang === 'kz' ? '2026 трендтері' : lang === 'en' ? '2026 Trends' : 'Тренды 2026';
      case 'Отрасли':
        return lang === 'kz' ? 'Салалық нұсқаулық' : lang === 'en' ? 'Industry Guides' : 'Отрасли';
      case 'Практика':
        return lang === 'kz' ? 'Тәжірибе және ТМБ АЖ' : lang === 'en' ? 'IS Tanba Practice' : 'Практика';
      case 'Инструкции':
        return lang === 'kz' ? 'Нұсқаулықтар' : lang === 'en' ? 'Instructions' : 'Инструкции';
      default:
        return category;
    }
  };

  const localizedArticles = useMemo(() => {
    return getLocalizedArticles(ARTICLES_DATA, lang);
  }, [lang]);

  const filteredArticles = useMemo(() => {
    const list = localizedArticles.filter((article) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.shortTitle.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.metaKeywords.toLowerCase().includes(q);
      return matchesSearch;
    });

    return [...list].sort((a, b) => {
      const dateA = a.publishedAt || a.date;
      const dateB = b.publishedAt || b.date;
      return dateB.localeCompare(dateA);
    });
  }, [localizedArticles, searchQuery]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-8 sm:pb-24">
      {/* Hero Header */}
      <section className="relative py-4 sm:py-8 lg:py-9 bg-white border-b border-gray-200/80 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 lg:gap-8">
          <div className="space-y-1.5 sm:space-y-4 max-w-3xl">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {lang === 'kz'
                ? 'Таңбалау бойынша білім базасы мен мақалалар'
                : lang === 'en'
                ? 'Guides & Insights on Serialization in Kazakhstan'
                : 'Статьи, законы и практические руководства по маркировке в РК'}
            </h1>

            <p className="text-xs sm:text-base lg:text-lg text-[#64748B] font-normal leading-relaxed">
              {lang === 'kz'
                ? 'ТМБ АЖ ережелері, заңдық жауапкершіліктер, айыппұлдардан қорғану және 2026 жылғы жаңа тауар санаттарын қосу бойынша ресми түсіндірмелер.'
                : lang === 'en'
                ? 'Official regulatory breakdowns, penalty risks, 2026 roadmap, and step-by-step procedures for Kazakhstan product marking.'
                : 'Разбор статей КоАП РК, правила работы с ИС Танба, требования к оклейке новых товарных групп 2026 года и способы защиты бизнеса от штрафов.'}
            </p>
          </div>

          <div className="hidden md:flex shrink-0 items-center justify-end">
            <img
              src="/banners/articles.svg"
              alt="База знаний Танбокс"
              className="w-40 sm:w-52 md:w-60 lg:w-72 h-auto max-h-36 sm:max-h-44 md:max-h-52 lg:max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 space-y-6 sm:space-y-8">
        
        {/* Article search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'kz'
                  ? 'Мақалаларды іздеу...'
                  : lang === 'en'
                  ? 'Search articles...'
                  : 'Поиск по статьям...'
              }
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#0082FB] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-gray-100 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-[#0082FB] rounded-2xl mx-auto flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#111827]">
              {lang === 'kz' ? 'Мақалалар табылмады' : lang === 'en' ? 'No articles found' : 'Статьи не найдены'}
            </h3>
            <p className="text-sm text-[#64748B]">
              {lang === 'kz'
                ? 'Сұрауыңыз бойынша ештеңе табылмады. Іздеу сөзін өзгертіп көріңіз.'
                : lang === 'en'
                ? 'No matching articles for your query. Try different keywords.'
                : 'По вашему запросу ничего не нашлось. Попробуйте изменить ключевые слова или сбросить фильтр.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0082FB] hover:underline cursor-pointer"
            >
              {lang === 'kz' ? 'Барлық мақалаларды көрсету' : lang === 'en' ? 'Clear search' : 'Сбросить поиск'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => {
              return (
                <article
                  key={article.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 grid grid-rows-[subgrid] row-span-4 gap-y-4 group"
                >
                  <div className="contents">
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF5FF] text-[#0082FB]">
                        {getCategoryLabel(article.category)}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] group-hover:text-[#0082FB] transition-colors leading-snug">
                      <Link to={getLocalizedPath(`/articles/${article.slug}`)} title={article.title}>
                        {article.shortTitle}
                      </Link>
                    </h2>

                    {/* Summary */}
                    <p className="text-sm text-[#64748B] leading-6 line-clamp-3 self-start">
                      {article.summary}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-1 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-[#94A3B8]">
                      {article.date}
                    </span>

                    <Link
                      to={getLocalizedPath(`/articles/${article.slug}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0082FB] group-hover:translate-x-1 transition-transform"
                    >
                      <span>{lang === 'kz' ? 'Оқу' : lang === 'en' ? 'Read article' : 'Читать'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="bg-[#0F172A] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-12 flex flex-col md:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8 sm:shadow-xl mt-6 sm:mt-16">
          <div className="space-y-1.5 sm:space-y-2 max-w-2xl text-left sm:text-center md:text-left">
            <h3 className="text-base sm:text-2xl font-bold text-white tracking-tight">
              <span className="sm:hidden">{lang === 'kz' ? 'Жеке есептеу қажет пе?' : lang === 'en' ? 'Need a custom quote?' : 'Нужен индивидуальный расчёт?'}</span>
              <span className="hidden sm:inline">{lang === 'kz'
                ? 'Таңбалау немесе ҰТК карточкаларын енгізу бойынша жеке есептеу қажет пе?'
                : lang === 'en'
                ? 'Need a custom quote for batch serialization or NKT catalog registration?'
                : 'Нужен индивидуальный расчет маркировки партии или заведения карточек в НКТ?'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="sm:hidden">{lang === 'kz' ? '15 минутта коммерциялық ұсыныс дайындаймыз.' : lang === 'en' ? 'Get a commercial offer in 15 minutes.' : 'Подготовим коммерческое предложение за 15 минут.'}</span>
              <span className="hidden sm:inline">{lang === 'kz'
                ? 'Біздің мамандармен хабарласыңыз. Номенклатураңызға тегін аудит жүргізіп, 15 минутта коммерциялық ұсыныс дайындаймыз.'
                : lang === 'en'
                ? 'Contact our specialists. We will conduct a free SKU audit and deliver a customized commercial offer in 15 minutes.'
                : 'Свяжитесь с нашими специалистами. Проведем бесплатный аудит вашей номенклатуры и подготовим коммерческое предложение за 15 минут.'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex min-h-11 items-center gap-2 bg-[#0082FB] text-white font-bold sm:font-extrabold text-xs sm:text-sm px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-[#0070DA] transition-all shrink-0 active:scale-95 sm:shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            {lang === 'kz' ? 'Кеңес алу' : lang === 'en' ? 'Get Consultation' : 'Получить консультацию'}
          </button>
        </div>

      </div>

      {/* Service Order Modal */}
      <ServiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialServiceTitle={selectedServiceTitle}
      />
    </div>
  );
};
