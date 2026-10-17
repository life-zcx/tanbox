import React from 'react';
import { SymbolType } from '../types';

interface LabelSymbolSvgProps {
  symbolType: SymbolType;
  sizePx: number;
}

export const LabelSymbolSvg: React.FC<LabelSymbolSvgProps> = ({ symbolType, sizePx }) => {
  switch (symbolType) {
    case 'EAC':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
          <rect x="0" y="0" width="14" height="100"/>
          <rect x="14" y="0" width="14" height="14"/>
          <rect x="14" y="43" width="11" height="14"/>
          <rect x="14" y="86" width="14" height="14"/>
          <rect x="36" y="0" width="10" height="100"/>
          <rect x="54" y="0" width="10" height="100"/>
          <rect x="46" y="0" width="8" height="14"/>
          <rect x="46" y="43" width="8" height="14"/>
          <rect x="72" y="0" width="14" height="100"/>
          <rect x="86" y="0" width="14" height="14"/>
          <rect x="86" y="86" width="14" height="14"/>
        </svg>
      );

    case 'EAC_BOX':
      return (
        <div 
          className="w-full h-full border-[1.5px] border-black font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
          style={{ fontSize: `${sizePx * 0.38}px` }}
        >
          EAC
        </div>
      );

    case 'KZ_GOST':
      return (
        <div 
          className="w-full h-full border-[1.5px] border-black font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
          style={{ fontSize: `${sizePx * 0.28}px` }}
        >
          СТ РК
        </div>
      );

    case 'CE':
      return (
        <div 
          className="w-full h-full font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
          style={{ fontSize: `${sizePx * 0.55}px` }}
        >
          CE
        </div>
      );

    case 'RECYCLE':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,10 92,80 8,80" />
          <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">21</text>
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">PAP</text>
        </svg>
      );

    case 'RECYCLE_LDPE':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,10 92,80 8,80" />
          <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">04</text>
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">LDPE</text>
        </svg>
      );

    case 'RECYCLE_PP':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,10 92,80 8,80" />
          <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">05</text>
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">PP</text>
        </svg>
      );

    case 'GLASS_FORK':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 20 L 45 20 L 40 55 Q 30 65 20 55 Z" />
          <line x1="30" y1="65" x2="30" y2="85" />
          <line x1="18" y1="85" x2="42" y2="85" />
          <line x1="72" y1="45" x2="72" y2="85" />
          <line x1="62" y1="20" x2="62" y2="45" />
          <line x1="72" y1="20" x2="72" y2="45" />
          <line x1="82" y1="20" x2="82" y2="45" />
          <line x1="62" y1="45" x2="82" y2="45" />
        </svg>
      );

    case 'FRAGILE':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 28 15 L 72 15 L 68 50 Q 50 65 32 50 Z" />
          <path d="M 55 15 L 47 30 L 54 42" />
          <line x1="50" y1="65" x2="50" y2="85" />
          <line x1="30" y1="85" x2="70" y2="85" />
        </svg>
      );

    case 'THIS_WAY_UP':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="85" x2="90" y2="85" />
          <line x1="32" y1="78" x2="32" y2="20" />
          <polyline points="18,38 32,18 46,38" />
          <line x1="68" y1="78" x2="68" y2="20" />
          <polyline points="54,38 68,18 82,38" />
        </svg>
      );

    case 'TIDY_MAN':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="40" cy="22" r="8" fill="currentColor" />
          <line x1="40" y1="30" x2="38" y2="58" />
          <line x1="38" y1="58" x2="30" y2="85" />
          <line x1="38" y1="58" x2="46" y2="85" />
          <line x1="40" y1="35" x2="60" y2="42" />
          <circle cx="63" cy="49" r="3" fill="currentColor" />
          <polyline points="60,55 63,85 80,85 83,55" />
        </svg>
      );

    case 'KEEP_AWAY_SUN':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="60" r="16" />
          <line x1="50" y1="40" x2="50" y2="30" />
          <line x1="50" y1="80" x2="50" y2="90" />
          <line x1="30" y1="60" x2="20" y2="60" />
          <line x1="70" y1="60" x2="80" y2="60" />
          <polyline points="15,25 50,15 85,25" />
        </svg>
      );

    case 'TEMPERATURE_LIMIT':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="43" y="15" width="14" height="50" rx="7" />
          <circle cx="50" cy="75" r="14" fill="currentColor" />
          <line x1="57" y1="25" x2="69" y2="25" />
          <line x1="57" y1="40" x2="69" y2="40" />
          <line x1="57" y1="55" x2="69" y2="55" />
        </svg>
      );

    case 'WASH_30':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="25" fontWeight="bold" fontFamily="Arial, sans-serif">30°</text>
        </svg>
      );

    case 'WASH_40':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="25" fontWeight="bold" fontFamily="Arial, sans-serif">40°</text>
        </svg>
      );

    case 'WASH_HAND':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <polyline points="35,15 50,50 65,35" strokeWidth="5" />
        </svg>
      );

    case 'DO_NOT_WASH':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <line x1="15" y1="85" x2="85" y2="25" strokeWidth="7" />
          <line x1="15" y1="25" x2="85" y2="85" strokeWidth="7" />
        </svg>
      );

    case 'NO_BLEACH':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,15 88,85 12,85" />
          <line x1="20" y1="80" x2="80" y2="20" />
          <line x1="20" y1="20" x2="80" y2="80" />
        </svg>
      );

    case 'BLEACH_OK':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,15 88,85 12,85" />
        </svg>
      );

    case 'IRON_LOW':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
          <circle cx="45" cy="55" r="5" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'IRON_MED':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
          <circle cx="38" cy="55" r="4.5" fill="currentColor" stroke="none" />
          <circle cx="52" cy="55" r="4.5" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'DO_NOT_IRON':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
          <line x1="15" y1="80" x2="85" y2="30" strokeWidth="7" />
          <line x1="15" y1="30" x2="85" y2="80" strokeWidth="7" />
        </svg>
      );

    case 'NO_TUMBLE_DRY':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="15" y="15" width="70" height="70" />
          <circle cx="50" cy="50" r="28" />
          <line x1="15" y1="85" x2="85" y2="15" strokeWidth="6" />
          <line x1="15" y1="15" x2="85" y2="85" strokeWidth="6" />
        </svg>
      );

    case 'NO_DRY_CLEAN':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="38" />
          <line x1="15" y1="85" x2="85" y2="15" strokeWidth="7" />
          <line x1="15" y1="15" x2="85" y2="85" strokeWidth="7" />
        </svg>
      );

    case 'KEEP_DRY':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 50 Q 50 15 85 50 Z" />
          <line x1="15" y1="50" x2="85" y2="50" />
          <path d="M 50 50 L 50 80 Q 50 90 40 90" />
        </svg>
      );

    default:
      return null;
  }
};
