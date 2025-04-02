import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const BASE_URL = '/sustech-cs304';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1',
  '#a4de6c', '#d0ed57', '#d88884', '#a28df4', '#bbbbbb',
  '#f56692', '#69c0ff'
];

export default function ActiveContributorPieChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/active_contributor_pie_chart.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const formatted = Object.entries(json).map(([people, projectCount]) => ({
          name: `${people}-people-group`,
          value: projectCount
        }));
        setData(formatted);
      })
      .catch(err => {
        console.error('加载活跃贡献者饼图数据失败:', err);
        setData([]);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={130}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} 个项目`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
