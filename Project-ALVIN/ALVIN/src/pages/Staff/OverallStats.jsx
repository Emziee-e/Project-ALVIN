import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'May 4', Performance: 47 },
  { name: 'May 6', Performance: 68 },
  { name: 'May 8', Performance: 60 },
  { name: 'May 11', Performance: 72 },
  { name: 'May 13', Performance: 85 },
  { name: 'May 15', Performance: 59 },
  { name: 'May 18', Performance: 71 },
];

const OverallStats = () => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="name" stroke="#4a4a4a" style={{ fontSize: '12px' }} />
          <YAxis
            width={50}
            stroke="#4a4a4a"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#862334',
              borderRadius: '6px',
              border: '1px solid #e5e5e5',
            }}
            cursor={{ fill: '#862334', opacity: 0.1 }}
          />
          <Legend />
          <Bar
            dataKey="Performance"
            fill="#862334"
            activeBar={{ fill: '#ffb003' }}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverallStats;