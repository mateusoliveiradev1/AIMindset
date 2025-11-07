import React from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';

const COLORS = {
  darkAxis: '#111827',
  grid: '#e5e7eb'
};

const VITAL_COLORS: Record<string, string> = {
  LCP: '#D50000',
  FCP: '#2962FF',
  TTFB: '#00B8D4',
  FID: '#7C4DFF',
  CLS: '#FFAB00'
};

export interface CoreVitalsChartProps {
  data: Array<{ name: string; value: number; target: number; unit: string }>;
}

const CoreVitalsChart: React.FC<CoreVitalsChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="name" stroke={COLORS.darkAxis} />
        <YAxis stroke={COLORS.darkAxis} />
        <Tooltip 
          formatter={(value: any, name: any, props: any) => [`${value}${props.payload.unit}`, 'Atual']}
          labelFormatter={(label) => `${label}`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', maxWidth: '260px', overflow: 'hidden' }}
        />
        <Legend />
        <Bar dataKey="value" name="Atual">
          {['LCP','FID','CLS','TTFB','FCP'].map((k, i) => (
            <Cell key={`cell-${i}`} fill={VITAL_COLORS[k]} />
          ))}
        </Bar>
        <Bar dataKey="target" name="Meta" fill="#cbd5e1" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CoreVitalsChart;