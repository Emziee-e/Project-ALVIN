import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';


const data = [
  {
    subject: 'Eye Contact',
    Score: 90,
    fullMark: 100,
  },
  {
    subject: 'Grammar',
    Score: 68,
    fullMark: 100,
  },
  {
    subject: 'Confidence',
    Score: 78,
    fullMark: 100,
  },
  {
    subject: 'Answer Quality',
    Score: 80,
    fullMark: 100,
  },
  {
    subject: 'Posture',
    Score: 82,
    fullMark: 100,
  },
];

// #endregion
const RadarChartComponent = () => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px', maxHeight: '400px', aspectRatio: '1/1' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          outerRadius="70%"
          data={data}
          margin={{
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
          }}
        >
          <PolarGrid className="stroke-[#862334]" />
          <PolarAngleAxis dataKey="subject" stroke="var(--color-text-3)" />
          <PolarRadiusAxis 
            stroke="var(--color-text-1)" 
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Radar 
            name="Score" 
            dataKey="Score" 
            className="stroke-[#ffb003] fill-[#ffb003]" 
            fillOpacity={0.6} 
            activeDot={{ stroke: '#862334', fill: '#ffb003' }}
          />
          <Tooltip
            cursor={{
              stroke: '#862334',
            }}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#862334',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;