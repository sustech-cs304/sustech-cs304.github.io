import React from 'react';
import TeamMetricBarChart from './TeamMetricBarChart';

export default function IssueCountPerRepoChart({ selectedSemester }) {
  return (
    <TeamMetricBarChart
      selectedSemester={selectedSemester}
      sectionKey="issue_count_per_repo"
      groupNamesKey="group_names"
      valuesKey="issue_counts"
      averageKey="average_issues"
      valueKey="issues"
      valueLabel="Issues"
      averageLabel="Average Issue Count"
      fill="#2b6cb0"
    />
  );
}
