import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const defaultData = [
  { subject: 'Eye Contact', Score: 90, fullMark: 100 },
  { subject: 'Grammar', Score: 68, fullMark: 100 },
  { subject: 'Confidence', Score: 78, fullMark: 100 },
  { subject: 'Answer Quality', Score: 80, fullMark: 100 },
  { subject: 'Posture', Score: 82, fullMark: 100 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl text-xs font-sans">
        <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider mb-1">{dataItem.subject}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFB003]" />
          <p className="text-gray-900 font-bold text-sm">
            {dataItem.Score}% <span className="text-gray-400 text-xs font-normal">Score</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const RadarChartComponent = ({ data = defaultData }) => {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 25, left: 25, bottom: 10 }}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="#64748B"
            tick={{ fontSize: 11, fontWeight: 600, fill: '#334155' }}
          />
          <PolarRadiusAxis
            stroke="#CBD5E1"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 9, fill: '#94A3B8' }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="Score"
            stroke="#862334"
            strokeWidth={2}
            fill="#862334"
            fillOpacity={0.25}
            dot={{
              r: 4,
              fill: '#FFB003',
              stroke: '#862334',
              strokeWidth: 1.5,
            }}
            activeDot={{
              r: 6,
              fill: '#FFB003',
              stroke: '#862334',
              strokeWidth: 2,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;