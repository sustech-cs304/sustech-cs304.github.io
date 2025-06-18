import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658']; // Chinese / English / Mixed

export default function CommitMessageLanguageDistribution({ selectedSemester }) {
  const [data, setData] = useState([]);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const langCounter = json[semesterKey]?.commit_message_info?.lang_counter || {};
        if (!langCounter) return;
        const formatted = Object.entries(langCounter).map(([lang, count]) => ({
          name:
            lang === 'chinese'
              ? 'Chinese'
              : lang === 'english'
              ? 'English'
              : 'Mix',
          value: count
        }));
        setData(formatted);
      })
      .catch(err => {
        console.error('Failed to load language distribution data:', err);
        setData([]);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={180}
            label={props => {
              const { name, percent, x, y, index, cx, cy, outerRadius, midAngle } = props;
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 24;
              const xOut = cx + radius * Math.cos(-midAngle * RADIAN);
              const yOut = cy + radius * Math.sin(-midAngle * RADIAN);
              const cleanName = name.replace(/-group$/, '');
              return (
                <text x={xOut} y={yOut} fontSize={18} fill={COLORS[index % COLORS.length]} textAnchor={xOut > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${cleanName}: ${(percent * 100).toFixed(1)}%`}
                </text>
              );
            }}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} commit messages`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
