import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { subject: 'Eye Contact', Score: 90, fullMark: 100 },
  { subject: 'Grammar', Score: 68, fullMark: 100 },
  { subject: 'Confidence', Score: 78, fullMark: 100 },
  { subject: 'Answer Quality', Score: 80, fullMark: 100 },
  { subject: 'Posture', Score: 82, fullMark: 100 },
];

const RadarChartComponent = () => {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 30,
            bottom: 20,
          }}
        >
          <PolarGrid stroke="#e5e5e5" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="#4a4a4a"
            style={{ fontSize: '12px' }}
          />
          <PolarRadiusAxis
            stroke="#4a4a4a"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            style={{ fontSize: '11px' }}
          />
          <Radar
            name="Score"
            dataKey="Score"
            stroke="#862334"
            fill="#862334"
            fillOpacity={0.6}
            activeDot={{ fill: '#ffb003', stroke: '#862334', strokeWidth: 2 }}
          />
          <Tooltip
            cursor={{ stroke: '#862334' }}
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#862334',
              borderRadius: '6px',
              border: '1px solid #e5e5e5',
            }}
            formatter={(value) => `${value}%`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;