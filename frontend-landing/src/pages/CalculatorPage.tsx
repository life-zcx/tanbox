import React from 'react';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { TariffCode } from '../types';

interface CalculatorPageProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ onOrderQuick }) => {
  return (
    <div className="pt-2 pb-10">
      <CalculatorSection onOrderQuick={onOrderQuick} />
    </div>
  );
};
