import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const BASE_URL = '/sustech-cs304';
const SEMESTERS = ['23 Spring', '24 Spring', '25 Spring'];

function formatHourLabel(hour) {
  const pad = (n) => n.toString().padStart(2, '0');
  const nextHour = (hour + 1) % 24;
  return `${pad(hour)}:00 - ${pad(nextHour)}:00`;
}

export default function CommitHourBarChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/commit_time_distribution_hourly.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { hours, counts } = json;
        const formattedData = hours.map((hour, idx) => ({
          hourLabel: formatHourLabel(hour),
          commits: counts[idx] || 0,
        }));
        setData(formattedData);
      })
      .catch(err => {
        console.error('加载 commit 小时数据失败:', err);
        setData([]);
      });
  }, [selectedSemester]);

  const avgCommits = data.length > 0
    ? data.reduce((acc, item) => acc + item.commits, 0) / data.length
    : 0;

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hourLabel" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          {/* <ReferenceLine y={avgCommits} stroke="red" strokeDasharray="3 3" label="平均" /> */}
          <Bar dataKey="commits" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
