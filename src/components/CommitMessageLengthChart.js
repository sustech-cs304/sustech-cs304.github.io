import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function CommitMessageLengthChart({ selectedSemester }) {
  const [distributionData, setDistributionData] = useState([]);

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const length_distribution = json[semesterKey]?.commit_message_info?.length_distribution || [];
        // Merge every two intervals into one
        const merged = [];
        for (let i = 0; i < length_distribution.length; i += 2) {
          const first = length_distribution[i];
          const second = length_distribution[i + 1];
          // Take the start of the first interval and the end of the second interval
          const start = first.length_range.split('–')[0];
          const end = second ? second.length_range.split('–')[1] : first.length_range.split('–')[1];
          const length_range = `${start}-${end}`;
          const count = first.count + (second ? second.count : 0);
          merged.push({ length_range, count });
        }
        setDistributionData(merged);
      })
      .catch(err => {
        console.error('Failed to load commit message length distribution data:', err);
        setDistributionData([]);
      });
  }, [selectedSemester]);

  const groupCounts = distributionData.map(d => d.count || 0);
  const maxY = Math.max(...groupCounts);
  const minY = Math.min(...groupCounts);
  const yDomain = [
    Math.floor(minY * 0.8) - 0.3,
    Math.ceil(maxY * 1.2)
  ];
      // Find the index of the maximum value
  const maxIndex = distributionData.findIndex(d => d.count === maxY);

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="length_range"
            label={{ value: 'Message Length Range', position: 'insideBottom', offset: -5 }}
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            label={{ value: 'Number of Messages', angle: -90, position: 'insideLeft' }}
            domain={yDomain}
            allowDataOverflow
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            label={({ x, y, value, index }) => (
              index === maxIndex ? (
                <text
                  x={x}
                  y={y - 8}
                  fill="#000000"
                  fontSize={16}
                  textAnchor="middle"
                >
                  {value}
                </text>
              ) : null
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
