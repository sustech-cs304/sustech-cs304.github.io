import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const BASE_URL = '/sustech-cs304';
const COLORS = [
  '#8884d8', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57',
  '#ffc658', '#ff8042', '#d88884', '#a28df4', '#bbbbbb' // 最后一个为 Other 用灰色
];
const THRESHOLD_OTHER = 0.03;
export default function LanguageDistributionPieChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/language_distribution.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { languages, counts } = json;
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
        console.error('加载语言分布数据失败:', err);
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
            outerRadius={150}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
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
