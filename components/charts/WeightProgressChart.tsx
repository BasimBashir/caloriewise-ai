import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeightEntry, Theme } from '../../types';

interface WeightProgressChartProps {
  data: WeightEntry[];
  targetWeight: number;
  theme: Theme;
}

const WeightProgressChart: React.FC<WeightProgressChartProps> = ({ data, targetWeight, theme }) => {
  const formattedData = data.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: entry.weight,
  }));
  
  const isDarkMode = theme === 'dark';

  const yDomain = data.length > 0 ? [
      Math.min(...data.map(d => d.weight), targetWeight) - 5,
      Math.max(...data.map(d => d.weight), targetWeight) + 5,
  ] : [targetWeight - 10, targetWeight + 10];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
        <XAxis dataKey="date" tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 12 }} />
        <YAxis domain={yDomain} tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 12 }} unit="kg" />
        <Tooltip
          contentStyle={{
            background: isDarkMode ? '#1e293b' : 'white',
            border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: '0.5rem',
          }}
        />
        <ReferenceLine y={targetWeight} label={{ value: 'Target', position: 'insideTopRight', fill: '#059669' }} stroke="#10b981" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} name="Weight (kg)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default WeightProgressChart;