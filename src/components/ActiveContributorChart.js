import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function ActiveContributorChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const rawData = json[semesterKey]?.repo_active_contributor_count || [];
        const sortedData = rawData
          .map(({ group_name, active_contributor_count }) => ({
            repo: group_name,
            contributors: active_contributor_count,
          }))
          .sort((a, b) => b.contributors - a.contributors);
        setData(sortedData);
      })
      .catch(err => {
        console.error('Failed to load active contributor data:', err);
        setData([]);
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
          <Bar dataKey="contributors" fill="#8884d8" label={{ position: 'top' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
