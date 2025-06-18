import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function BranchDistributionChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const branchCounts = json[semesterKey]?.branch_count_per_repo?.branch_counts || [];
        // Calculate frequency of each branch count
        const frequencyMap = {};
        branchCounts.forEach(count => {
          frequencyMap[count] = (frequencyMap[count] || 0) + 1;
        });

        // Convert to chart data format and sort by count ascending
        const chartData = Object.entries(frequencyMap)
          .map(([count, frequency]) => ({
            branch_count: parseInt(count),
            group_count: frequency
          }))
          .sort((a, b) => a.branch_count - b.branch_count);

        setDistributionData(chartData);
      })
      .catch(err => {
        console.error('Failed to load branch distribution data:', err);
        setDistributionData([]);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="branch_count" label={{ value: 'Branch Count', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Number of Groups', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="group_count"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            label={({ x, y, value }) => (
                <text
                x={x}
                y={y - 8}
                fill="#000000"
                fontSize={18}
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
