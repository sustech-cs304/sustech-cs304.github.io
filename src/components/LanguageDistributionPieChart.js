import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = [
  '#8884d8', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57',
  '#ffc658', '#ff8042', '#d88884', '#a28df4', '#bbbbbb' // Last one for "Other" in gray
];
const THRESHOLD_OTHER = 0.03;

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function LanguageDistributionPieChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const { languages = [], counts = [] } = json[semesterKey]?.language_distribution || {};
        const rawData = languages.map((lang, idx) => ({
          name: lang,
          value: counts[idx] || 0,
        }));
        const total = rawData.reduce((sum, item) => sum + item.value, 0);
        const threshold = total * THRESHOLD_OTHER;
        const filtered = [];
        let otherTotal = 0;
        rawData.forEach(item => {
          if (item.value >= threshold) {
            filtered.push(item);
          } else {
            otherTotal += item.value;
          }
        });
        if (otherTotal > 0) {
          filtered.push({ name: 'Other', value: otherTotal });
        }
        setData(filtered);
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
              return (
                <text x={xOut} y={yOut} fontSize={18} fill={COLORS[index % COLORS.length]} textAnchor={xOut > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${name}: ${(percent * 100).toFixed(1)}%`}
                </text>
              );
            }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
