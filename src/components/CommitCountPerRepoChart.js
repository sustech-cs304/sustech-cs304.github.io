import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function CommitCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgCommits, setAvgCommits] = useState(0);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const groupNames = json[semesterKey]?.commit_count_per_repo?.group_names || [];
        const commitCounts = json[semesterKey]?.commit_count_per_repo?.commit_counts || [];
        const averageCommitCount = json[semesterKey]?.commit_count_per_repo?.average_commit_count || 0;
        const formattedData = groupNames.map((repo, idx) => ({
          repo,
          commits: commitCounts[idx] || 0,
        })).sort((a, b) => b.commits - a.commits);
        setData(formattedData);
        setAvgCommits(averageCommitCount);
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
          <Bar dataKey="commits" fill="#8884d8" />
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
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
