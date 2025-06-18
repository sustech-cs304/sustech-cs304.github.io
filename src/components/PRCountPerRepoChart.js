import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function PRCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgPR, setAvgPR] = useState(0);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const groupNames = json[semesterKey]?.pr_count_per_repo?.group_names || [];
        const prCounts = json[semesterKey]?.pr_count_per_repo?.pr_counts || [];
        const averagePR = json[semesterKey]?.pr_count_per_repo?.average_pr || 0;
        const formattedData = groupNames.map((repo, idx) => ({
          repo,
          pr: prCounts[idx] || 0,
        })).sort((a, b) => b.pr - a.pr);
        setData(formattedData);
        setAvgPR(averagePR);
      })
      .catch(err => {
        console.error('Failed to load PR data:', err);
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
          <Bar dataKey="pr" fill="#8884d8" label={{ position: 'top' }} />
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
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
