import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const BASE_URL = '/sustech-cs304';

const STATUS_COLORS = {
  merged: '#82ca9d',   // green
  closed: '#ff8042',   // orange
  open: '#8884d8',     // purple
};

export default function PRStatusPieChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const prStatus = json[semesterKey]?.pr_status_distribution || {};
        const formattedData = Object.entries(prStatus).map(([status, count]) => ({
          name: status,
          value: count,
        }));
        setData(formattedData);
      })
      .catch(err => {
        console.error('加载 PR 状态数据失败:', err);
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
                <text x={xOut} y={yOut} fontSize={18} fill={STATUS_COLORS[name] || '#ccc'} textAnchor={xOut > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${name}: ${(percent * 100).toFixed(1)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#ccc'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} 个`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
