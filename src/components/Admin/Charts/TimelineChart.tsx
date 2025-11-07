import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  purple: '#7C4DFF',
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

function formatMs(value?: number) {
  const v = Number(value || 0);
  const digits = v >= 1000 ? 0 : 1;
  return `${v.toFixed(digits)}ms`;
}

const TimelineTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload.reduce((acc: any, p: any) => ({ ...acc, [p.dataKey]: p.value }), {});
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="text-xs text-gray-500 mb-2">{new Date(label).toLocaleString('pt-BR')}</div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">Score</span><span className="font-medium">{point.performanceScore || 0}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">LCP</span><span className="font-medium">{formatMs(point.lcp || 0)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">FCP</span><span className="font-medium">{formatMs(point.fcp || 0)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">TTFB</span><span className="font-medium">{formatMs(point.ttfb || 0)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">FID</span><span className="font-medium">{formatMs(point.fid || 0)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">CLS</span><span className="font-medium">{(point.cls || 0).toFixed(3)}</span></div>
      </div>
    </div>
  );
};

export interface TimelineChartProps {
  data: Array<any>;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          stroke={COLORS.darkAxis}
        />
        <YAxis stroke={COLORS.darkAxis} />
        <Tooltip content={<TimelineTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="performanceScore" stroke={COLORS.purple} strokeWidth={3} name="Performance Score" dot={{ fill: COLORS.purple, strokeWidth: 2, r: 4 }} />
        <Line type="monotone" dataKey="lcp" stroke={VITAL_COLORS.LCP} strokeWidth={2} name="LCP (ms)" dot={false} />
        <Line type="monotone" dataKey="fcp" stroke={VITAL_COLORS.FCP} strokeWidth={2} name="FCP (ms)" dot={false} />
        <Line type="monotone" dataKey="cls" stroke={VITAL_COLORS.CLS} strokeWidth={2} name="CLS" dot={false} />
        <Line type="monotone" dataKey="ttfb" stroke={VITAL_COLORS.TTFB} strokeWidth={2} name="TTFB (ms)" dot={false} />
        <Line type="monotone" dataKey="fid" stroke={VITAL_COLORS.FID} strokeWidth={2} name="FID (ms)" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;