/**
 * TANBOX.KZ Unified Design System Tokens
 * Strict B2B Kaz Modern Retail Style (Kaspi / Technodom / Tanba inspiration)
 * Pure white background, high contrast black typography, crisp 1px borders.
 */

export const themeTokens = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceHover: '#F1F3F5',
    border: '#E5E7EB',
    borderDark: '#111827',
    textPrimary: '#000000',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    primary: '#000000',
    primaryHover: '#1F2937',
    accentBadge: '#F3F4F6',
    status: {
      new: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
      processing: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
      printing: { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
      stickering: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
      completed: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
      cancelled: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    }
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    headings: "font-extrabold tracking-tight text-black",
    subheadings: "font-semibold text-gray-700",
  },
  buttons: {
    primary: "bg-black text-white hover:bg-gray-800 font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50",
    secondary: "bg-white text-black border border-gray-300 hover:bg-gray-100 font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-95",
    outline: "bg-transparent text-black border border-black hover:bg-black hover:text-white font-semibold px-5 py-2.5 rounded-lg transition-all",
  },
  cards: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-black transition-all",
  modals: "bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 md:p-8 max-w-lg w-full z-50",
};
