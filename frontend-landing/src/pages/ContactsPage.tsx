import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { ContactsSection } from '../components/landing/ContactsSection';

export const ContactsPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const leadObject = {
      id: `lead-${Date.now()}`,
      serviceTitle: 'Запрос с формы контактов (Консультация)',
      companyName: name,
      phone,
      email: email || undefined,
      notes: notes || undefined,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save locally
    try {
      const existing = JSON.parse(localStorage.getItem('tanbox_service_leads') || '[]');
      localStorage.setItem('tanbox_service_leads', JSON.stringify([leadObject, ...existing]));
    } catch (err) {
      console.error('LocalStorage save error:', err);
    }

    // 2. Post to backend REST API
    try {
      await apiClient.post('/leads', {
        serviceTitle: 'Запрос с формы контактов (Консультация)',
        companyName: name,
        phone,
        email: email || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      console.warn('Backend API submission warning (saved locally):', err);
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-8">
      
      {/* Header Banner */}
      <section className="py-10 sm:py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight max-w-4xl">
            Контакты и Реквизиты
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl font-normal leading-relaxed">
            Официальный отдел продаж и центр обслуживания клиентов ИС Танба в Республике Казахстан.
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Telegram & Email quick contact cards from tanba.telecom.kz (Image 1) */}
        <ContactsSection showTitle={false} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Info Side */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-[#111827]">Главный офис TANBOX</h3>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">Адрес головного офиса</p>
                  <p className="text-[#64748B] mt-1">г. Алматы, пр. Аль-Фараби 77/7, Бизнес-Центр Esentai Tower, 12 этаж</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">Горячая линия (24/7)</p>
                  <p className="text-[#111827] mt-1 font-bold">+7 (727) 355-10-20</p>
                  <p className="text-[#64748B]">+7 (701) 555-12-34 (WhatsApp / Telegram)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">Электронная почта</p>
                  <p className="text-[#64748B] mt-1">info@tanbox.kz • sales@tanbox.kz</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-xs uppercase tracking-wider">График работы мобильных бригад</p>
                  <p className="text-[#64748B] mt-1">Пн - Сб: 08:00 - 22:00 (Выезд на склады 24/7 по согласованию)</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-xs font-bold uppercase text-[#111827] mb-2">Юридические реквизиты:</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                ТОО "TANBOX LOGISTICS AND MARKING"<br />
                БИН: 240540019283<br />
                ИИК: KZ899261802840192831 в АО "Kaspi Bank"
              </p>
            </div>

          </div>

          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-[#111827]">Написать в отдел маркировки</h3>
            <p className="text-sm text-[#64748B]">Оставьте запрос на КП или коммерческий расчет партии товара.</p>

            {submitted ? (
              <div className="bg-[#EBF5FF] border border-[#0082FB]/20 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[#0082FB] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-extrabold text-[#111827]">Сообщение успешно отправлено!</h4>
                <p className="text-sm text-[#64748B]">
                  Спасибо, <span className="font-bold text-[#111827]">{name}</span>. Наш менеджер отдела маркировки свяжется с вами по номеру <span className="font-mono font-bold text-[#0082FB]">{phone}</span> в ближайшее время.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setPhone('');
                    setEmail('');
                    setNotes('');
                  }}
                  className="bg-white text-[#0082FB] hover:bg-gray-50 border border-[#0082FB]/30 font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Отправить еще одно сообщение
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#111827] uppercase block mb-1">Ваше имя <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Аскар Ермеков"
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0082FB]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#111827] uppercase block mb-1">Телефон в РК <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 707 123 4567"
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0082FB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] uppercase block mb-1">E-mail организации</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="askar@company.kz"
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0082FB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] uppercase block mb-1">Сообщение / Детали партий</label>
                  <textarea
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Опишите объемы товара (обувь, одежда, вода) и ваш склад..."
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0082FB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#0082FB] text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl hover:bg-[#0070DA] transition-all active:scale-95 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Отправить сообщение
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
