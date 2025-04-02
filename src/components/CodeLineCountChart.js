import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function CodeLineCountChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgLines, setAvgLines] = useState(0);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/code_line_per_repo.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { repo_names, total_lines, average_lines } = json;

        const formattedData = repo_names.map((repo, idx) => ({
          repo,
          lines: total_lines[idx] || 0,
        })).sort((a, b) => b.lines - a.lines); // 降序

        setData(formattedData);
        setAvgLines(average_lines);
      })
      .catch(err => {
        console.error('加载代码行数失败:', err);
        setData([]);
        setAvgLines(0);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 700 }}>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="repo" angle={-45} textAnchor="end" height={100} interval={0} />
          <YAxis />
          <Tooltip />
          <ReferenceLine
            y={avgLines}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Average Code Lines Count：${avgLines.toFixed(0)}`,
              position: 'top',
              fill: 'red',
              fontWeight: 'bold'
            }}
          />
          <Bar dataKey="lines" fill="#8884d8" label={{ position: 'top' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
