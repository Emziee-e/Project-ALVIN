import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const defaultData = [
  { name: 'May 4', Performance: 47 },
  { name: 'May 6', Performance: 68 },
  { name: 'May 8', Performance: 60 },
  { name: 'May 11', Performance: 72 },
  { name: 'May 13', Performance: 85 },
  { name: 'May 15', Performance: 59 },
  { name: 'May 18', Performance: 71 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl text-xs font-sans">
        <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#862334]" />
          <p className="text-gray-900 font-bold text-sm">
            {payload[0].value}% <span className="text-gray-400 text-xs font-normal">Performance</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const OverallStats = ({ data = defaultData }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] font-bold text-[#862334] uppercase tracking-widest block mb-0.5">
            Cohort Analytics
          </span>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Overall Class Performance Trend
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#862334]" />
          <span className="text-xs font-medium text-gray-500">Average Performance (%)</span>
        </div>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#862334" stopOpacity={1} />
                <stop offset="100%" stopColor="#862334" stopOpacity={0.75} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#862334', opacity: 0.04 }} />
            <Bar
              dataKey="Performance"
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} className="transition-all duration-300 hover:opacity-80" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverallStats;