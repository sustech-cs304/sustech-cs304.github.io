import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function IssueCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgIssue, setAvgIssue] = useState(0);

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const groupNames = json[semesterKey]?.issue_count_per_repo?.group_names || [];
        const issueCounts = json[semesterKey]?.issue_count_per_repo?.issue_counts || [];
        const averageIssues = json[semesterKey]?.issue_count_per_repo?.average_issues || 0;
        const formattedData = groupNames.map((repo, idx) => ({
          repo,
          issues: issueCounts[idx] || 0,
        })).sort((a, b) => b.issues - a.issues);
        setData(formattedData);
        setAvgIssue(averageIssues);
      })
      .catch(err => {
        console.error('Failed to load issue data:', err);
        setData([]);
        setAvgIssue(0);
      });
  }, [selectedSemester]);
  console.log("issue");
  console.log(data);
  return (
    <div style={{ width: '100%', height: 500 }}>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="repo" angle={-45} textAnchor="end" height={100} interval={0} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="issues" fill="#8884d8" label={{ position: 'top' }} />
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
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
