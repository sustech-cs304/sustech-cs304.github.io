import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = '/sustech-cs304';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function BranchCountPerRepoChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgBranch, setAvgBranch] = useState(0);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const branchCounts = json[semesterKey]?.branch_count_per_repo?.branch_counts || [];
        const groupNames = json[semesterKey]?.branch_count_per_repo?.group_names || [];
        const averageBranches = json[semesterKey]?.branch_count_per_repo?.average_branches || 0;
        const formattedData = groupNames.map((repo, idx) => ({
          repo,
          branch: branchCounts[idx] || 0,
        })).sort((a, b) => b.branch - a.branch);
        setData(formattedData);
        setAvgBranch(averageBranches);
      })
      .catch(err => {
        console.error('加载 branch 数据失败:', err);
        setData([]);
        setAvgBranch(0);
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
          <Bar dataKey="branch" fill="#8884d8" label={{ position: 'top' }} />
          <ReferenceLine
            y={avgBranch}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Average Branch: ${avgBranch.toFixed(2)}`,
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
