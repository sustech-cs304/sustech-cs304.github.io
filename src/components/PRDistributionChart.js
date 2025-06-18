import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function PRDistributionChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const pr_counts = json[semesterKey]?.pr_count_per_repo?.pr_counts || [];
        if (!pr_counts || pr_counts.length === 0) return;
        const min = Math.min(...pr_counts);
        const max = Math.max(...pr_counts);
        const numBins = Math.ceil(Math.sqrt(pr_counts.length));
        const binWidth = Math.ceil((max - min + 1) / numBins);
        const bins = new Array(numBins).fill(0);
        pr_counts.forEach(count => {
          const index = Math.min(Math.floor((count - min) / binWidth), numBins - 1);
          bins[index]++;
        });
        const chartData = bins.map((groupCount, idx) => ({
          pr_range: `${min + idx * binWidth}-${min + (idx + 1) * binWidth - 1}`,
          group_count: groupCount,
        }));
        setDistributionData(chartData);
      })
      .catch(err => {
        console.error('Failed to load PR distribution data:', err);
        setDistributionData([]);
      });
  }, [selectedSemester]);

  const groupCounts = distributionData.map(d => d.group_count || 0);
  const maxY = Math.max(...groupCounts);
  const minY = Math.min(...groupCounts);
  const yDomain = [
    Math.floor(minY * 0.8 - 1),
    Math.ceil(maxY * 1.2)
  ];

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="pr_range"
            label={{ value: 'PR Count Range', position: 'insideBottom', offset: -5 }}
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            label={{ value: 'Number of Groups', angle: -90, position: 'insideLeft' }}
            domain={yDomain}
            allowDataOverflow
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="group_count"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ r: 4 }}
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
