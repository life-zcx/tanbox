import React from 'react';
import { Link } from 'react-router-dom';
import { Barcode, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white border-t border-gray-800 pt-16 pb-12">
      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/tanbox-white.svg" alt="tanbox.kz" className="h-6 w-auto" />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Национальный сервис оперативной маркировки товаров в Республике Казахстан. Полный цикл от эмиссии кодов в ИС Танба до потоковой оклейки на складе.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Навигация</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/" className="hover:text-white transition-colors">Главная страница</Link></li>
            <li><Link to="/calculator" className="hover:text-white transition-colors">Калькулятор стоимости</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Категории товаров РК</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Услуги под ключ (ВЭД, НКТ)</Link></li>
            <li><Link to="/contacts" className="hover:text-white transition-colors">Контакты и Реквизиты</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Категории товаров РК</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/categories" className="hover:text-white transition-colors">Обувь и легкая промышленность</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Текстиль и одежда</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Лекарства и фармпрепараты</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Упакованная вода и напитки</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Табачные изделия</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Контакты HQ</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-white" />
              <span>+7 (727) 355-10-20</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-white" />
              <span>info@tanbox.kz</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-white mt-1 shrink-0" />
              <span>г. Алматы, пр. Аль-Фараби 77/7, Бизнес-Центр Esentai Tower</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
        <p>© 2026 TANBOX.KZ — Все права защищены. Оператор маркировки в Казахстанe.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span className="hover:text-gray-300 cursor-pointer">Политика конфиденциальности</span>
        </div>
      </div>
    </footer>
  );
};
