import React from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  return (
    <div className="py-8 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-4xl mx-auto mb-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Контакты и Реквизиты</h1>
          <p className="text-base text-gray-600">
            Официальный отдел продаж и центр обслуживания клиентов ИС Танба в Республике Казахстан.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Info Side */}
          <div className="lg:col-span-5 bg-gray-50 border border-gray-200 rounded-3xl p-8 space-y-8">
            <h3 className="text-2xl font-extrabold text-black">Главный офис TANBOX</h3>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase text-xs">Адрес головного офиса</p>
                  <p className="text-gray-700 mt-1">г. Алматы, пр. Аль-Фараби 77/7, Бизнес-Центр Esentai Tower, 12 этаж</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase text-xs">Горячая линия (24/7)</p>
                  <p className="text-gray-700 mt-1 font-bold">+7 (727) 355-10-20</p>
                  <p className="text-gray-700">+7 (701) 555-12-34 (WhatsApp / Telegram)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase text-xs">Электронная почта</p>
                  <p className="text-gray-700 mt-1">info@tanbox.kz • sales@tanbox.kz</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase text-xs">График работы мобильных бригад</p>
                  <p className="text-gray-700 mt-1">Пн - Сб: 08:00 - 22:00 (Выезд на склады 24/7 по согласованию)</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-xs font-bold uppercase text-black mb-2">Юридические реквизиты:</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                ТОО "TANBOX LOGISTICS AND MARKING"<br />
                БИН: 240540019283<br />
                ИИК: KZ899261802840192831 в АО "Kaspi Bank"
              </p>
            </div>

          </div>

          {/* Form Side */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-8 space-y-6">
            <h3 className="text-2xl font-extrabold text-black">Написать в отдел маркировки</h3>
            <p className="text-sm text-gray-600">Оставьте запрос на КП или коммерческий расчет партии товара.</p>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Спасибо! Сообщение отправлено.'); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-black uppercase block mb-1">Ваше имя</label>
                  <input
                    type="text"
                    required
                    placeholder="Аскар Ермеков"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black uppercase block mb-1">Телефон в РК</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 707 123 4567"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase block mb-1">E-mail организации</label>
                <input
                  type="email"
                  required
                  placeholder="askar@company.kz"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black uppercase block mb-1">Сообщение / Детали партий</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Опишите объемы товара (обувь, одежда, вода) и ваш склад..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-black text-white font-extrabold text-sm px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Отправить сообщение
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
