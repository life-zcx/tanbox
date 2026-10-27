import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  Check, 
  BookOpen, 
  ArrowRight, 
  HelpCircle, 
  ChevronDown, 
  PhoneCall, 
  FileText
} from 'lucide-react';
import { getArticleBySlug, ARTICLES_DATA, ArticleData } from '../data/articlesData';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';
import { ServiceOrderModal } from '../components/modals/ServiceOrderModal';

export const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { lang, getLocalizedPath } = useLanguage();
  const article = articleId ? getArticleBySlug(articleId, lang) : undefined;

  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
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

  useEffect(() => {
    window.scrollTo(0, 0);
    if (article) {
      setPageSeo(
        `${article.title} | TANBOX.KZ`,
        article.metaDescription,
        {
          lang: (lang as 'ru' | 'kz' | 'en') || 'ru',
          keywords: article.metaKeywords,
        }
      );

      // Inject Schema.org Article and FAQ structured data (Rich Snippets for Google & Yandex)
      const pageUrl = `https://tanbox.kz${lang === 'ru' ? '' : `/${lang}`}/articles/${article.slug}`;
      const articleSchema: any = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.metaDescription,
        inLanguage: lang === 'kz' ? 'kk' : lang,
        author: {
          '@type': 'Organization',
          name: article.author,
          url: 'https://tanbox.kz',
        },
        publisher: {
          '@type': 'Organization',
          name: 'TANBOX.KZ',
          logo: {
            '@type': 'ImageObject',
            url: 'https://tanbox.kz/tanbox-white.svg',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageUrl,
        },
      };

      const graph: any[] = [articleSchema];

      if (article.faq && article.faq.length > 0) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: article.faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        });
      }

      let schemaScript = document.querySelector('#article-schema-org') as HTMLScriptElement | null;
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'article-schema-org';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(
        graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph }
      );
    }
  }, [articleId, article]);

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-[#111827]">
          {lang === 'kz' ? 'Мақала табылмады' : lang === 'en' ? 'Article Not Found' : 'Статья не найдена'}
        </h2>
        <p className="text-gray-600 max-w-md">
          {lang === 'kz'
            ? 'Сұралған мақала жоқ немесе жылжытылған.'
            : lang === 'en'
            ? 'The requested article does not exist or has been moved.'
            : 'Запрошенная статья не существует или была перемещена.'}
        </p>
        <Link
          to={getLocalizedPath('/articles')}
          className="inline-flex items-center gap-2 bg-[#0082FB] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0070DA] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'kz' ? 'Базаға оралу' : lang === 'en' ? 'Back to Knowledge Base' : 'Вернуться в базу знаний'}</span>
        </Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const relatedArticles = (article.relatedSlugs || [])
    .map((slug) => getArticleBySlug(slug, lang))
    .filter((a): a is ArticleData => !!a)
    .slice(0, 3);

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

  // Render markdown-like text to formatted HTML with HTML-escaping to prevent XSS
  const formatSectionContent = (text: string) => {
    const sanitizeAndFormat = (raw: string, isParagraph = false) => {
      const safe = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      let formatted = safe
        .replace(/•\s/g, '•&nbsp;')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-[#111827]">$1</strong>');

      if (isParagraph) {
        formatted = formatted.replace(/\n\n/g, '<br/><br/>');
      }
      return formatted;
    };

    // If it contains a markdown table
    if (text.includes('| :---')) {
      const parts = text.split(/(?=\|[^\n]+\|\n\| :---)/);
      return parts.map((part, idx) => {
        if (part.startsWith('|') && part.includes('| :---')) {
          const lines = part.trim().split('\n').filter(Boolean);
          const headers = lines[0].split('|').map((h) => h.trim()).filter(Boolean);
          const rows = lines.slice(2).map((row) =>
            row.split('|').map((c) => c.trim()).filter(Boolean)
          );

          return (
            <div key={idx} className="my-6 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-gray-200 text-[#111827] font-bold">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-4 py-3 font-extrabold uppercase text-[11px] tracking-wider text-[#475569]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 text-[#334155] leading-relaxed">
                          <span dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(cell) }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Regular paragraphs
        return (
          <div
            key={idx}
            className="space-y-3 leading-relaxed text-[#334155]"
            dangerouslySetInnerHTML={{
              __html: sanitizeAndFormat(part, true),
            }}
          />
        );
      });
    }

    return (
      <div
        className="space-y-4 leading-relaxed text-[#334155]"
        dangerouslySetInnerHTML={{
          __html: sanitizeAndFormat(text, true),
        }}
      />
    );
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24">
      {/* Top Breadcrumb & Hero */}
      <section className="bg-white border-b border-gray-100 pt-4 sm:pt-8 pb-6 sm:pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <Link to={getLocalizedPath('/')} className="hover:text-[#0082FB] transition-colors">
              {lang === 'kz' ? 'Басты бет' : lang === 'en' ? 'Home' : 'Главная'}
            </Link>
            <span>/</span>
            <Link to={getLocalizedPath('/articles')} className="hover:text-[#0082FB] transition-colors">
              {lang === 'kz' ? 'Білім базасы' : lang === 'en' ? 'Knowledge Base' : 'База знаний'}
            </Link>
            <span>/</span>
            <span className="text-[#111827] truncate max-w-xs">{article.shortTitle}</span>
          </nav>

          {/* Header Metadata */}
          <div className="max-w-4xl space-y-2.5 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="inline-flex items-center px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold bg-[#EBF5FF] text-[#0082FB]">
                {getCategoryLabel(article.category)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{article.date}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTime}</span>
              </div>
            </div>

            {/* Main H1 */}
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {article.title}
            </h1>

            {/* Lead Summary */}
            <p className="text-xs sm:text-base lg:text-lg text-[#64748B] leading-relaxed font-normal pt-1 sm:pt-2">
              {article.summary}
            </p>

            {/* Author info & Share button */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#111827]">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0082FB] flex items-center justify-center text-xs">
                  <User className="w-4 h-4" />
                </div>
                <span>{article.author}</span>
              </div>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0082FB] bg-gray-50 hover:bg-blue-50 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-gray-200/80"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">
                      {lang === 'kz' ? 'Сілтеме көшірілді!' : lang === 'en' ? 'Link copied!' : 'Ссылка скопирована!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'kz' ? 'Мақаламен бөлісу' : lang === 'en' ? 'Share article' : 'Поделиться статьей'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Article Body (8 cols) */}
          <main className="lg:col-span-8 space-y-10">
            {article.contentSections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-gray-100 scroll-mt-24 space-y-4"
              >
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                  {sec.title}
                </h2>
                <div className="text-sm sm:text-base leading-relaxed">
                  {formatSectionContent(sec.content)}
                </div>
              </section>
            ))}

            {/* FAQ Accordion Section */}
            {article.faq && article.faq.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0082FB]">
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    {lang === 'kz'
                      ? 'Жиі қойылатын сұрақтар'
                      : lang === 'en'
                      ? 'Frequently Asked Questions'
                      : 'Часто задаваемые вопросы'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                  {lang === 'kz'
                    ? 'Тақырып бойынша сұрақтар мен жауаптар'
                    : lang === 'en'
                    ? 'Questions and Answers'
                    : 'Вопросы и ответы по теме'}
                </h2>

                <div className="space-y-3">
                  {article.faq.map((item, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-200/80 overflow-hidden transition-all duration-200"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm text-[#111827] hover:bg-gray-50/80 cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#0082FB]' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-gray-100 bg-[#FBFDFF]">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="space-y-4 pt-4">
                <h3 className="text-xl font-extrabold text-[#111827]">
                  {lang === 'kz'
                    ? 'Осы тақырып бойынша оқуға кеңес береміз:'
                    : lang === 'en'
                    ? 'Recommended reading:'
                    : 'Полезно прочитать также:'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.id}
                      to={getLocalizedPath(`/articles/${rel.slug}`)}
                      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0082FB]">
                          {getCategoryLabel(rel.category)}
                        </span>
                        <h4 className="text-sm font-bold text-[#111827] group-hover:text-[#0082FB] transition-colors leading-snug">
                          {rel.title}
                        </h4>
                      </div>
                      <div className="pt-3 flex items-center justify-between text-xs text-[#64748B]">
                        <span>{rel.readTime}</span>
                        <ArrowRight className="w-4 h-4 text-[#0082FB] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Right Column: Sticky Navigation & Lead Magnet (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Table of Contents Box */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0082FB]" />
                  <span>
                    {lang === 'kz'
                      ? 'Мақала мазмұны'
                      : lang === 'en'
                      ? 'Table of Contents'
                      : 'Содержание статьи'}
                  </span>
                </h3>
                <nav className="space-y-1.5 text-xs font-semibold">
                  {article.tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block px-3 py-2 rounded-xl text-[#64748B] hover:text-[#0082FB] hover:bg-blue-50/50 transition-colors"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Consultation Card */}
              <div className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-white leading-snug">
                  {lang === 'kz'
                    ? 'Таңбалау бойынша жеке кеңес қажет пе?'
                    : lang === 'en'
                    ? 'Need custom consultation on serialization?'
                    : 'Нужен индивидуальный расчет маркировки?'}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {lang === 'kz'
                    ? 'Біздің мамандармен хабарласыңыз. Номенклатураңызға тегін аудит жүргізіп, 15 минутта коммерциялық ұсыныс дайындаймыз.'
                    : lang === 'en'
                    ? 'Contact our specialists. We will conduct a free SKU audit and deliver a customized offer in 15 minutes.'
                    : 'Свяжитесь с нашими специалистами. Проведем бесплатный аудит вашей номенклатуры и подготовим коммерческое предложение за 15 минут.'}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(article.title)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{lang === 'kz' ? 'Кеңес алу' : lang === 'en' ? 'Get Consultation' : 'Получить консультацию'}</span>
                  </button>
                </div>
              </div>

              {/* Back to articles */}
              <div className="text-center">
                <Link
                  to={getLocalizedPath('/articles')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0082FB] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'kz'
                      ? 'Білім базасының барлық мақалалары'
                      : lang === 'en'
                      ? 'All Knowledge Base articles'
                      : 'Все статьи базы знаний'}
                  </span>
                </Link>
              </div>

            </div>
          </aside>

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
