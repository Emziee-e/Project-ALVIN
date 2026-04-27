import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// #region Sample data
const data = [
 {
    name: 'May 4',
    Performance: 47,
  },
  {
    name: 'May 6',
    Performance: 68,
  },
  {
    name: 'May 8',
    Performance: 60,
  },
  {
    name: 'May 11',
    Performance: 72,
  },
  {
    name: 'May 13',
    Performance: 85,
  },
  {
    name: 'May 15',
    Performance: 59,
  },
  {
    name: 'May 18',
    Performance: 71,
  },
];

// #endregion
const OverallStats = () => {
  return (
    <BarChart
      style={{ width: '100%', maxWidth: '900px', maxHeight: '50vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
        width="auto" 
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" 
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(value) => {
          if (value === 0) return 'Bad';
          if (value === 25) return 'Poor';
          if (value === 50) return 'Average';
          if (value === 75) return 'Great';
          if (value === 100) return 'Excellent';
          return value;
        }}
      />
      <Tooltip 
        formatter={(value) => `${value}%`}
        contentStyle={{ backgroundColor: '#fff', borderColor: '#862334' }}
      />
      <Legend />
      <Bar dataKey="Performance" fill="#862334" activeBar={{ fill: '#ffb003', stroke: 'black' }} radius={[10, 10, 0, 0]} />
    </BarChart>
  );
};

export default OverallStats;