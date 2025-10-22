


import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Nutrition, Theme } from '../../types';

interface MacroBarChartProps {
  consumed: Nutrition;
  goals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  theme: Theme;
}

const MacroBarChart: React.FC<MacroBarChartProps> = ({ consumed, goals, theme }) => {
  const data = [
    { name: 'Protein', consumed: consumed.protein, goal: goals.protein },
    { name: 'Carbs', consumed: consumed.carbs, goal: goals.carbs },
    { name: 'Fat', consumed: consumed.fat, goal: goals.fat },
  ];
  
  const colors = ['#38bdf8', '#a78bfa', '#f472b6']; // sky-400, violet-400, pink-400
  const isDarkMode = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#475569' }} />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            background: isDarkMode ? '#1e293b' : 'white',
            border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            color: isDarkMode ? '#f1f5f9' : '#1e293b'
          }}
          formatter={(value: number, name, props) => [`${Math.round(props.payload.consumed)}g / ${props.payload.goal}g`, props.payload.name]}
          labelFormatter={() => ''}
        />
        {/* FIX: The `radius` prop for recharts Bar component is incorrectly typed as string | number. */}
        {/* The library supports a number array for individual corner radii. Casting to `any` to bypass the type error. */}
        <Bar dataKey="consumed" radius={[0, 8, 8, 0] as any} background={{ fill: isDarkMode ? '#334155' : '#f1f5f9', radius: [0, 8, 8, 0] as any }}>
           {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MacroBarChart;