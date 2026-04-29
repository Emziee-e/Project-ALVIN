import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  {
    name: 'May 4',
    Grade: 40,
  },
  {
    name: 'May 6',
    Grade: 52,
  },
  {
    name: 'May 8',
    Grade: 79,
  },
  {
    name: 'May 11',
    Grade: 65,
  },
  {
    name: 'May 13',
    Grade: 93,
  },
  {
    name: 'May 15',
    Grade: 80,
  },
  {
    name: 'May 18',
    Grade: 71,
  },
];

export default function StudentLineChart() {
  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}>
      <div style={{ minWidth: '800px' }}>
        <LineChart
          style={{ width: '100%', height: '100%', maxHeight: '55vh', aspectRatio: 1.618 }}
          responsive
          data={data}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#862334" />
          <XAxis dataKey="name" padding={{ left: 30, right: 30, top: 20 }} stroke="var(--color-text-3)" />
          <YAxis width="auto" stroke="var(--color-text-3)" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`}/>
          <Tooltip
            cursor={{ stroke: '#862334' }}
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#862334' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Grade"
            stroke="#383631"
            dot={{
              fill: 'var(--color-surface-base)',
            }}
            activeDot={{ stroke: '#ffb003' }}
          />
        </LineChart>
      </div>
    </div>
  );
}