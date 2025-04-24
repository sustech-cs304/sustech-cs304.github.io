import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function GiniCommitDistributionChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);

  useEffect(() => {
    const DATA_URL = `/sustech-cs304/output/${selectedSemester}/contribution_difference.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { gini_commit } = json;

        if (!gini_commit || gini_commit.length === 0) return;

        const binWidth = 0.05;
        const numBins = Math.ceil(1 / binWidth);
        const bins = new Array(numBins).fill(0);

        gini_commit.forEach(value => {
          const index = Math.min(Math.floor(value / binWidth), numBins - 1);
          bins[index]++;
        });

        const chartData = bins.map((count, idx) => ({
          gini_range: `${(idx * binWidth).toFixed(2)}–${((idx + 1) * binWidth).toFixed(2)}`,
          group_count: count
        }));

        setDistributionData(chartData);
      })
      .catch(err => {
        console.error('加载 gini_commit 分布失败:', err);
        setDistributionData([]);
      });
  }, [selectedSemester]);

  const yValues = distributionData.map(d => d.group_count || 0);
  const maxY = Math.max(...yValues);
  const yDomain = [0, Math.ceil(maxY * 1.2)];

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="gini_range"
            label={{ value: 'Gini Range (Commit)', position: 'insideBottom', offset: -5 }}
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            label={{ value: 'Number of Groups', angle: -90, position: 'insideLeft' }}
            domain={yDomain}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="group_count"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 3 }}
            label={({ x, y, value }) => (
              <text
                x={x}
                y={y - 8}
                fill="#000000"
                fontSize={16}
                textAnchor="middle"
              >
                {value}
              </text>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
