import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const SEMESTERS = ['23 Spring', '24 Spring', '25 Spring'];

function formatHourLabel(hour) {
  const pad = (n) => n.toString().padStart(2, '0');
  const nextHour = (hour + 1) % 24;
  return `${pad(hour)}:00 - ${pad(nextHour)}:00`;
}

export default function CommitHourBarChart({ selectedSemester }) {
  const [data, setData] = useState([]);
  const [avgCommits, setAvgCommits] = useState(0);

  function getSemesterKey(selectedSemester) {
    return selectedSemester.replace(/\s/g, '').toLowerCase();
  }

  useEffect(() => {
    const DATA_URL = `/chart_data.json`;
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const { hours = [], counts = [] } = json[semesterKey]?.commit_time_distribution_hourly || {};
        const formattedData = hours.map((hour, idx) => ({
          hourLabel: formatHourLabel(hour),
          commits: counts[idx] || 0,
        }));
        setData(formattedData);
        setAvgCommits(formattedData.length > 0 ? formattedData.reduce((acc, item) => acc + item.commits, 0) / formattedData.length : 0);
      })
      .catch(err => {
        console.error('Failed to load commit hour data:', err);
        setData([]);
        setAvgCommits(0);
      });
  }, [selectedSemester]);

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hourLabel" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          {/* <ReferenceLine y={avgCommits} stroke="red" strokeDasharray="3 3" label="Average" /> */}
          <Bar dataKey="commits" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
