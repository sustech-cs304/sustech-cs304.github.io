import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function CodeLineCountChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgLines, setAvgLines] = useState(0);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const groupNames = json[semesterKey]?.code_line_per_repo?.group_names || [];
        const totalLines = json[semesterKey]?.code_line_per_repo?.total_lines || [];
        const averageLines = json[semesterKey]?.code_line_per_repo?.average_lines || 0;
        const formattedData = groupNames.map((repo, idx) => ({
          repo,
          lines: totalLines[idx] || 0,
        })).sort((a, b) => b.lines - a.lines);
        setData(formattedData);
        setAvgLines(averageLines);
      })
      .catch(err => {
        console.error('Failed to load code line count:', err);
        setData([]);
        setAvgLines(0);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 700 }}>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="repo" angle={-45} textAnchor="end" height={100} interval={0} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="lines" fill="#8884d8" label={{ position: 'top' }} />
          <ReferenceLine
            y={avgLines}
            stroke="red"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              value: `Average Code Lines Count：${avgLines.toFixed(0)}`,
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
