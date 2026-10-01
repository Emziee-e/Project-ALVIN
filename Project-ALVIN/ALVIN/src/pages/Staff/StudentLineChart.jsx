import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const defaultData = [
  { name: 'May 4', Grade: 40 },
  { name: 'May 6', Grade: 52 },
  { name: 'May 8', Grade: 79 },
  { name: 'May 11', Grade: 65 },
  { name: 'May 13', Grade: 93 },
  { name: 'May 15', Grade: 80 },
  { name: 'May 18', Grade: 71 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl text-xs font-sans">
        <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#862334]" />
          <p className="text-gray-900 font-bold text-sm">
            {payload[0].value}% <span className="text-gray-400 text-xs font-normal">Score</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function StudentLineChart({ data = defaultData }) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#862334" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#862334" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94A3B8"
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            tick={{ fontSize: 11, fill: '#64748B' }}
            dy={8}
          />
          <YAxis
            stroke="#94A3B8"
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="Grade"
            stroke="#862334"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#lineAreaGradient)"
            dot={{
              r: 4,
              fill: '#FFFFFF',
              stroke: '#862334',
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: '#FFB003',
              stroke: '#862334',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}