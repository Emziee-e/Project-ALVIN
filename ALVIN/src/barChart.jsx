import React, { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data generator
const generateMockData = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    label: `Day ${i + 1}`,
    x: Math.floor(Math.random() * 6) + 5, // Random between 5 and 10
  }));
};

const data = generateMockData(7);

export default function barCharts(props) {
  const barCategoryGap = props?.barCategoryGap ?? 0.1;
  const barGap = props?.barGap ?? 0.1;

  return (
    <div style={{ width: '100%', height: '400px', minHeight: 400 }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Last 7 days</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap={`${barCategoryGap * 100}%`}
          barGap={`${barGap * 100}%`}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="x" fill="#862334" isAnimationActive={true} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Renders a simple form to control the band scale properties.
 * Each property is a slider input, ranging from 0 to 1 in 0.01 steps.
 * Calls onChange with the new values when an input changes.
 * @param onChange
 * @param sessionStoreValues data from session storage, or null if this is the first visit
 */
export function BarAlignControls({ onChange, sessionStoreValues }) {
  const [state, setState] = React.useState(
    sessionStoreValues ?? {
      paddingInner: 0,
      paddingOuter: 0.8,
      align: 0.7,
      barGap: 0.1,
      barCategoryGap: 0.1,
    },
  );

  const handleChange = (key, value) => {
    const newState = { ...state, [key]: value };
    setState(newState);
    onChange(newState);
  };

  // Emit initial state only on mount so the chart is correct
  React.useEffect(() => {
    onChange(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px' }}>
              <label htmlFor="bar-align-bar-gap">BarChart.barGap</label>
            </td>
            <td style={{ padding: '8px' }}>
              <input
                id="bar-align-bar-gap"
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={state.barGap}
                onChange={e => handleChange('barGap', parseFloat(e.target.value))}
              />
            </td>
            <td style={{ padding: '8px' }}>{`${(state.barGap * 100).toFixed(0)}%`}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>
              <label htmlFor="bar-align-bar-category-gap">BarChart.barCategoryGap</label>
            </td>
            <td style={{ padding: '8px' }}>
              <input
                id="bar-align-bar-category-gap"
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={state.barCategoryGap}
                onChange={e => handleChange('barCategoryGap', parseFloat(e.target.value))}
              />
            </td>
            <td style={{ padding: '8px' }}>{`${(state.barCategoryGap * 100).toFixed(0)}%`}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>
              <label htmlFor="bar-align-padding-inner">bandScale.paddingInner</label>
            </td>
            <td style={{ padding: '8px' }}>
              <input
                id="bar-align-padding-inner"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.paddingInner}
                onChange={e => handleChange('paddingInner', parseFloat(e.target.value))}
              />
            </td>
            <td style={{ padding: '8px' }}>{state.paddingInner.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>
              <label htmlFor="bar-align-padding-outer">bandScale.paddingOuter</label>
            </td>
            <td style={{ padding: '8px' }}>
              <input
                id="bar-align-padding-outer"
                type="range"
                min="0"
                max="10"
                step="0.01"
                value={state.paddingOuter}
                onChange={e => handleChange('paddingOuter', parseFloat(e.target.value))}
              />
            </td>
            <td style={{ padding: '8px' }}>{state.paddingOuter.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>
              <label htmlFor="bar-align-align">bandScale.align</label>
            </td>
            <td style={{ padding: '8px' }}>
              <input
                id="bar-align-align"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.align}
                onChange={e => handleChange('align', parseFloat(e.target.value))}
              />
            </td>
            <td style={{ padding: '8px' }}>{state.align.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}