import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function CommitDistributionChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);
  const [keyPoints, setKeyPoints] = useState([]);

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const commit_counts = json[semesterKey]?.commit_count_per_repo?.commit_counts || [];
        if (!commit_counts || commit_counts.length === 0) return;
        const min = Math.min(...commit_counts);
        const max = Math.max(...commit_counts);
        const maxBins = 10;
        const binWidth = Math.max(1, Math.ceil((max - min + 1) / maxBins));
        const numBins = Math.ceil((max - min + 1) / binWidth);
        const bins = new Array(numBins).fill(0);
        commit_counts.forEach(count => {
          const index = Math.min(Math.floor((count - min) / binWidth), numBins - 1);
          bins[index]++;
        });
        const chartData = bins.map((groupCount, idx) => ({
          commit_range: `${min + idx * binWidth}-${min + (idx + 1) * binWidth - 1}`,
          group_count: groupCount,
        }));
        setDistributionData(chartData);
        let maxIdx = 0, minIdx = 0;
        chartData.forEach((d, i) => {
          if (d.group_count > chartData[maxIdx].group_count) maxIdx = i;
          if (d.group_count < chartData[minIdx].group_count) minIdx = i;
        });
        setKeyPoints([maxIdx, minIdx]);
      })
      .catch(err => {
        console.error('Failed to load commit distribution data:', err);
        setDistributionData([]);
        setKeyPoints([]);
      });
  }, [selectedSemester]);

  const groupCounts = distributionData.map(d => d.group_count || 0);
  const maxY = Math.max(...groupCounts, 0);
  const yDomain = [0, Math.ceil(maxY * 1.2)];

  const renderLabel = (props) => {
    const { x, y, value, index } = props;
    if (keyPoints.includes(index)) {
      return (
        <text
          x={x}
          y={y - 8}
          fill="#8884d8"
          fontSize={16}
          textAnchor="middle"
        >
          {value}
        </text>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 540 }}>
      <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
                  Group Count Distribution by Commit Count Range
      </div>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="commit_range"
            label={{ value: 'Commit Count Range', position: 'insideBottom', offset: -10, fill: '#000' }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis
            label={{ value: 'Group Count', angle: -90, position: 'insideLeft', fill: '#000' }}
            domain={yDomain}
            allowDataOverflow
            tickCount={Math.min(6, yDomain[1] + 1)}
          />
                      <Tooltip formatter={(value) => `${value} Groups`} labelFormatter={label => `Range: ${label}`} />
          <Line
            type="monotone"
            dataKey="group_count"
            stroke="#8884d8"
            strokeWidth={3}
            dot={{ r: 4, stroke: '#8884d8', strokeWidth: 2, fill: '#fff' }}
            label={renderLabel}
            activeDot={{ r: 7, fill: '#d62728' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, fontSize: 15, color: '#555', textAlign: 'center' }}>
                  Description: X-axis shows commit count ranges, Y-axis shows group count in each range. Only max/min values are labeled.<br />
          Line color is purple, red dots indicate extreme values.
      </div>
    </div>
  );
}
