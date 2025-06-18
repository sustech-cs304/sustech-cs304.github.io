import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1',
  '#a4de6c', '#d0ed57', '#d88884', '#a28df4', '#bbbbbb',
  '#f56692', '#69c0ff'
];

export default function ActiveContributorPieChart({ selectedSemester }) {
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
        const pieData = json[semesterKey]?.active_contributor_pie_chart || {};
        const formatted = Object.entries(pieData).map(([people, projectCount]) => ({
          name: `${people}-people-group`,
          value: projectCount
        }));
        setData(formatted);
      })
      .catch(err => {
        console.error('Failed to load active contributor pie chart data:', err);
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
              return (
                <text x={xOut} y={yOut} fontSize={18} fill={COLORS[index % COLORS.length]} textAnchor={xOut > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${name}: ${(percent * 100).toFixed(1)}%`}
                </text>
              );
            }}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} projects`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
