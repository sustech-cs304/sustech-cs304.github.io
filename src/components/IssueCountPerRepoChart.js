import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function IssueCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgIssue, setAvgIssue] = useState(0);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/issue_count_per_repo.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { repo_names, issue_counts, average_issues } = json;

        const formattedData = repo_names.map((repo, idx) => ({
          repo,
          issues: issue_counts[idx] || 0,
        })).sort((a, b) => b.issues - a.issues); // 降序排序

        setData(formattedData);
        setAvgIssue(average_issues);
      })
      .catch(err => {
        console.error('加载 issue 数据失败:', err);
        setData([]);
        setAvgIssue(0);
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
            y={avgIssue}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Average Issue: ${avgIssue.toFixed(2)}`,
              position: 'top',
              fill: 'red',
              fontWeight: 'bold'
            }}
          />
          <Bar dataKey="issues" fill="#8884d8" label={{ position: 'top' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
