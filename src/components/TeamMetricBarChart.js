import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

function getSemesterKey(selectedSemester) {
  return selectedSemester.replace(/\s/g, '').toLowerCase();
}

export default function TeamMetricBarChart({
  selectedSemester,
  sectionKey,
  groupNamesKey,
  valuesKey,
  averageKey,
  valueKey,
  valueLabel,
  averageLabel,
  fill = '#6a5acd',
}) {
  const [data, setData] = useState([]);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    fetch('/chart_data.json')
      .then(res => res.json())
      .then(json => {
        const semesterKey = getSemesterKey(selectedSemester);
        const section = json[semesterKey]?.[sectionKey] || {};
        const groupNames = section[groupNamesKey] || [];
        const values = section[valuesKey] || [];
        const formattedData = groupNames.map((repo, idx) => ({
          repo,
          [valueKey]: values[idx] || 0,
        })).sort((a, b) => b[valueKey] - a[valueKey]);

        setData(formattedData);
        setAverage(section[averageKey] || 0);
      })
      .catch(err => {
        console.error(`Failed to load ${valueLabel.toLowerCase()} data:`, err);
        setData([]);
        setAverage(0);
      });
  }, [averageKey, groupNamesKey, sectionKey, selectedSemester, valueKey, valueLabel, valuesKey]);

  const chartHeight = useMemo(() => Math.max(520, data.length * 24 + 90), [data.length]);

  return (
    <div className="team-metric-chart" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 72, left: 16, bottom: 24 }}
          barCategoryGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" allowDecimals={false} stroke="#718096" tickLine={false} />
          <YAxis
            type="category"
            dataKey="repo"
            interval={0}
            width={96}
            stroke="#718096"
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [`${value}`, valueLabel]}
            labelFormatter={(label) => `Team: ${label}`}
          />
          <ReferenceLine
            x={average}
            stroke="#e53e3e"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `${averageLabel}: ${average.toFixed(2)}`,
              position: 'top',
              fill: '#e53e3e',
              fontWeight: 600,
              fontSize: 12,
            }}
          />
          <Bar dataKey={valueKey} fill={fill} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
