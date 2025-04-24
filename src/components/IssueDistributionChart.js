import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BASE_URL = '/sustech-cs304';

export default function IssueDistributionChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);

  useEffect(() => {
    const DATA_URL = `${BASE_URL}/output/${selectedSemester}/issue_count_per_repo.json`;

    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const { issue_counts } = json;

        if (!issue_counts || issue_counts.length === 0) return;

        const min = Math.min(...issue_counts);
        const max = Math.max(...issue_counts);
        const numBins = Math.ceil(Math.sqrt(issue_counts.length)); // 常用分 bin 公式 √n
        const binWidth = Math.ceil((max - min + 1) / numBins);

        // 初始化 bin
        const bins = new Array(numBins).fill(0);
        issue_counts.forEach(count => {
          const index = Math.min(Math.floor((count - min) / binWidth), numBins - 1);
          bins[index]++;
        });

        // 构造 chartData
        const chartData = bins.map((groupCount, idx) => ({
          issue_range: `${min + idx * binWidth}-${min + (idx + 1) * binWidth - 1}`,
          group_count: groupCount,
        }));

        setDistributionData(chartData);
      })
      .catch(err => {
        console.error('加载 issue 分布数据失败:', err);
        setDistributionData([]);
      });
  }, [selectedSemester]);

  // 计算最大 y 值以添加 padding
    const groupCounts = distributionData.map(d => d.group_count || 0);
    const maxY = Math.max(...groupCounts);
    const minY = Math.min(...groupCounts);
    const yDomain = [
        Math.floor(minY * 0.8 - 1), // 下界扩大
        Math.ceil(maxY * 1.2)   // 上界扩大
    ];

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="issue_range"
            label={{ value: 'Issue Count Range', position: 'insideBottom', offset: -5 }}
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
            stroke="#8884d8"
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
