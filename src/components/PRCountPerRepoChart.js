import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function PRCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgPR, setAvgPR] = useState(0);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/pr_count_per_repo.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { repo_names, pr_counts, average_pr } = json;

        const formattedData = repo_names.map((repo, idx) => ({
          repo,
          pr: pr_counts[idx] || 0,
        })).sort((a, b) => b.pr - a.pr); // 降序排序

        setData(formattedData);
        setAvgPR(average_pr);
      })
      .catch(err => {
        console.error('加载 PR 数据失败:', err);
        setData([]);
        setAvgPR(0);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="repo" angle={-45} textAnchor="end" height={100} interval={0} />
          <YAxis />
          <Tooltip />
          <ReferenceLine
            y={avgPR}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Average PR Count：${avgPR.toFixed(2)}`,
              position: 'top',
              fill: 'red',
              fontWeight: 'bold'
            }}
          />
          <Bar dataKey="pr" fill="#8884d8" label={{ position: 'top' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
