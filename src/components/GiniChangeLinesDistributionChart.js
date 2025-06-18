import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function GiniAddLinesDistributionChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);
  const [keyPoints, setKeyPoints] = useState([]);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const gini_add_lines = json[semesterKey]?.contribution_difference?.gini_add_lines || [];
        if (!gini_add_lines || gini_add_lines.length === 0) return;
        const binWidth = 0.1;
        const numBins = Math.ceil(1 / binWidth);
        const bins = new Array(numBins).fill(0);
        gini_add_lines.forEach(value => {
          const index = Math.min(Math.floor(value / binWidth), numBins - 1);
          bins[index]++;
        });
        const chartData = bins.map((count, idx) => ({
          gini_range: `${(idx * binWidth).toFixed(2)}–${((idx + 1) * binWidth).toFixed(2)}`,
          group_count: count
        }));
        setDistributionData(chartData);
        // 1. Only record max value index
        let maxIdx = 0;
        chartData.forEach((d, i) => {
          if (d.group_count > chartData[maxIdx].group_count) maxIdx = i;
        });
        setKeyPoints([maxIdx]);
      })
      .catch(err => {
        console.error('Failed to load gini_add_lines distribution:', err);
        setDistributionData([]);
        setKeyPoints([]);
      });
  }, [selectedSemester]);

  const yValues = distributionData.map(d => d.group_count || 0);
  const maxY = Math.max(...yValues, 0);
  const yDomain = [0, Math.ceil(maxY * 1.2)];

      // 2. renderLabel only renders max value and value is not 0
  const renderLabel = (props) => {
    const { x, y, value, index } = props;
    if (keyPoints.includes(index) && value !== 0) {
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
                  Group Count Distribution by Gini Range (Added Lines)
      </div>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="gini_range"
            label={{ value: 'Gini Range (Added Lines)', position: 'insideBottom', offset: -10, fill: '#000' }}
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
                  Description: X-axis shows Gini ranges (Added Lines), Y-axis shows group count in each range. Only max values are labeled.<br />
          Line color is purple, red dots indicate extreme values.
      </div>
    </div>
  );
}
