import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'May 4', Grade: 40 },
  { name: 'May 6', Grade: 52 },
  { name: 'May 8', Grade: 79 },
  { name: 'May 11', Grade: 65 },
  { name: 'May 13', Grade: 93 },
  { name: 'May 15', Grade: 80 },
  { name: 'May 18', Grade: 71 },
];

export default function StudentLineChart() {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="name"
            stroke="#4a4a4a"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            width={50}
            stroke="#4a4a4a"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            cursor={{ stroke: '#862334', strokeWidth: 2 }}
            contentStyle={{
              backgroundColor: '#fff',
              borderColor: '#862334',
              borderRadius: '6px',
              border: '1px solid #e5e5e5',
            }}
            formatter={(value) => `${value}%`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Grade"
            stroke="#862334"
            dot={{
              fill: '#862334',
              r: 5,
            }}
            activeDot={{
              r: 7,
              fill: '#ffb003',
            }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}