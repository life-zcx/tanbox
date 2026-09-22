import React from 'react';

export interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-black text-black tracking-tight">{title}</h1>
        <p className="text-xs text-gray-500 font-medium mt-1">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
