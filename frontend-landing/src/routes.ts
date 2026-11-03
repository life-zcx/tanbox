// Shared by React Router and the static page generator.
export const LANDING_PATHS = {
  calculator: '/calculator',
  categories: '/categories',
  category: '/categories/:categoryId',
  services: '/services',
  tariffs: '/tariffs',
  articles: '/articles',
  article: '/articles/:articleId',
  blog: '/blog',
  blogArticle: '/blog/:articleId',
  contacts: '/contacts',
  privacy: '/privacy',
  terms: '/terms',
  paymentProcedure: '/payment-procedure',
  payments: '/payments',
  payment: '/payment',
  cookies: '/cookies',
  cookiePolicy: '/cookie-policy',
} as const;
export const STATIC_LANDING_PATHS = ['/', ...Object.values(LANDING_PATHS).filter(path => !path.includes(':'))];
