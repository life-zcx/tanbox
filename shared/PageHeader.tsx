import React from 'react';

export interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200/80">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-[#64748B] font-normal mt-1 leading-relaxed">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
