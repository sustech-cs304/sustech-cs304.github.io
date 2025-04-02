import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function ActiveContributorChart({ selectedSemester }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/repo_active_contributor_count.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const sortedData = json
          .map(({ repo_name, active_contributor_count }) => ({
            repo: repo_name,
            contributors: active_contributor_count,
          }))
          .sort((a, b) => b.contributors - a.contributors); // 降序
        setData(sortedData);
      })
      .catch(err => {
        console.error('加载活跃人数数据失败:', err);
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
