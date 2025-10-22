
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Theme } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface CalorieRingChartProps {
  consumed: number;
  goal: number;
  theme: Theme;
}

const CalorieRingChart: React.FC<CalorieRingChartProps> = ({ consumed, goal, theme }) => {
  const { t } = useTranslation();
  const remaining = Math.max(0, goal - consumed);
  const data = [
    { name: 'Consumed', value: consumed },
    { name: 'Remaining', value: remaining },
  ];
  
  const percent = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;
  
  let color = '#34d399'; // emerald-400
  if (percent > 85) color = '#f59e0b'; // amber-500
  if (percent > 100) color = '#ef4444'; // red-500

  const isDarkMode = theme === 'dark';
  const COLORS = [color, isDarkMode ? '#334155' : '#e5e7eb']; // dark: slate-700, light: gray-200

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            fill="#8884d8"
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">{Math.max(0, goal-consumed)}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{t('chartRemaining')}</span>
      </div>
    </div>
  );
};

export default CalorieRingChart;