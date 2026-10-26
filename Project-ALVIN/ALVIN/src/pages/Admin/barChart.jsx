import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const WEEKLY_USER_DATA = [
  { label: 'MON', weekly: 12, monthly: 28 },
  { label: 'TUE', weekly: 15, monthly: 30 },
  { label: 'WED', weekly: 18, monthly: 35 },
  { label: 'THU', weekly: 20, monthly: 40 },
  { label: 'FRI', weekly: 16, monthly: 38 },
  { label: 'SAT', weekly: 22, monthly: 42 },
  { label: 'SUN', weekly: 20, monthly: 40 },
];

const MONTHLY_USER_DATA = [
  { label: 'Week 1', weekly: 14, monthly: 25 },
  { label: 'Week 2', weekly: 18, monthly: 32 },
  { label: 'Week 3', weekly: 20, monthly: 40 },
  { label: 'Week 4', weekly: 25, monthly: 48 },
];

export default function barChart() {
  const [timeframe, setTimeframe] = useState('Weekly');
  const data = timeframe === 'Weekly' ? WEEKLY_USER_DATA : MONTHLY_USER_DATA;

  return (
    <div className="w-full flex flex-col h-full">
      {/* Chart Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <h3 className="text-lg font-bold font-[Geist,Inter] text-black">
          User Activity Trend
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#862334]"></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Weekly (20)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB003]"></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Monthly (40)
              </span>
            </div>
          </div>

          <div className="relative group">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="appearance-none bg-white text-gray-700 text-[10px] font-Inter font-bold py-2 px-4 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer uppercase tracking-wider transition-all hover:bg-gray-50"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-hover:text-gray-600" />
          </div>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="p-6 w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#862334" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#862334" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB003" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFB003" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
              }}
              formatter={(value, name) => [
                `${value} Active Users`,
                name === 'weekly' ? 'Weekly Active' : 'Monthly Active',
              ]}
            />
            <Area
              type="monotone"
              dataKey="monthly"
              stroke="#FFB003"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorMonthly)"
            />
            <Area
              type="monotone"
              dataKey="weekly"
              stroke="#862334"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorWeekly)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}