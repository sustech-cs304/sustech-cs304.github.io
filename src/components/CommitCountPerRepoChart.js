import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function CommitCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgCommits, setAvgCommits] = useState(0);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/commit_count_per_repo.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { repo_names, commit_counts, average_commit_count } = json;

        const formattedData = repo_names.map((repo, idx) => ({
          repo,
          commits: commit_counts[idx] || 0,
        })).sort((a, b) => b.commits - a.commits); // 排序

        setData(formattedData);
        setAvgCommits(average_commit_count);
      })
      .catch(err => {
        console.error('加载 commit count 数据失败:', err);
        setData([]);
        setAvgCommits(0);
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
            y={avgCommits}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Average Commit Count：${avgCommits.toFixed(2)}`,
              position: 'top',
              fill: 'red',
              fontWeight: 'bold'
            }}
          />
          <Bar dataKey="commits" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
