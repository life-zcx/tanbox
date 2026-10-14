import React, { useState } from 'react';
import {
  Activity,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Cpu,
  Layers,
  HardDrive,
  Wifi,
  ShieldCheck,
} from 'lucide-react';

export const AdminSystemNetdataPage: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const netdataUrl = '/netdata/';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(netdataUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F4F6F9] p-4 flex flex-col' : ''}`}>
      {/* Top Banner / Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-900">
                Мониторинг сервера (Netdata Real-Time)
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                1 сек. телеметрия
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Детальные графики CPU, оперативной памяти, Docker-контейнеров, дисков и сетевого трафика
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] text-gray-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200">
            <Cpu className="w-3.5 h-3.5 text-blue-500" /> CPU & RAM
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200">
            <Layers className="w-3.5 h-3.5 text-purple-500" /> Docker Cgroups
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200">
            <HardDrive className="w-3.5 h-3.5 text-amber-500" /> Disk I/O & SSD
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200">
            <Wifi className="w-3.5 h-3.5 text-teal-500" /> Network
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all active:scale-95"
            title="Перезагрузить фрейм"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Обновить
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all active:scale-95"
            title={isFullscreen ? 'Свернуть' : 'Развернуть на весь экран'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Свернуть
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Во весь экран
              </>
            )}
          </button>

          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0082FB] hover:bg-[#0072DD] rounded-xl shadow-xs transition-all active:scale-95"
            title="Открыть в новой вкладке браузера"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            В новой вкладке
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div
        className={`bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden relative ${
          isFullscreen ? 'flex-1' : 'h-[calc(100vh-280px)] min-h-[650px]'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-gray-600">
              Подключение к службе мониторинга Netdata...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={netdataUrl}
          title="Netdata Monitoring Dashboard"
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Safety Notice Footer */}
      {!isFullscreen && (
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Netdata изолирован внутри Docker-сети и доступен только авторизованным администраторам.</span>
          </div>
          <span className="text-gray-400">Лимит RAM: 150 MB (Cgroups protected)</span>
        </div>
      )}
    </div>
  );
};
