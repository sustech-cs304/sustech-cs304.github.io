import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function CommitDateLineChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/chart_data.json`;
    setLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const { full_dates = [], counts = [] } = json[semesterKey]?.commit_time_distribution_date || {};
        const dateRanges = {
          '23 Spring': ['2023-02-01', '2023-06-10'],
          '24 Spring': ['2024-02-01', '2024-06-10'],
          '25 Spring': ['2025-02-01', '2025-06-10'],
        };
        const [startStr, endStr] = dateRanges[selectedSemester];
        const start = new Date(startStr);
        const end = new Date(endStr);
        const filtered = full_dates
          .map((date, idx) => ({
            date,
            commits: counts[idx] || 0,
          }))
          .filter(({ date }) => {
            const d = new Date(date);
            return d >= start && d <= end;
          });
        setData(filtered);
      })
      .catch(err => {
        console.error('数据加载失败:', err);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedSemester]);

  return (
    // 将宽度设置为70%，并用 margin 居中
    <div style={{ width: '100%', height: 500, margin: '0 auto' }}>
      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-gray-400 italic">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="date"
              tickFormatter={(tick) => tick.slice(5)} // MM-DD
              minTickGap={20}
              stroke="#999"
            />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value) => [`${value} commits`, 'Commits']}
            />
            <Line
              type="monotone"
              dataKey="commits"
              stroke="#6a5acd"
              dot={false}
              strokeWidth={3}
              animationDuration={800}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
