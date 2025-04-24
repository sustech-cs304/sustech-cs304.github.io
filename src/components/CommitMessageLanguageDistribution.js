import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend
} from 'recharts';

const BASE_URL = '/sustech-cs304';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658']; // 中文 / 英文 / 混合

export default function CommitMessageLanguageDistribution({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/commit_message_info.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const langCounter = json["lang_counter"];
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
        console.error('加载语言分布数据失败:', err);
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
          <Tooltip formatter={(value) => `${value} commit messages`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
