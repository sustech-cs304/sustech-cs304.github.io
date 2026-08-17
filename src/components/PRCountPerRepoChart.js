import React from 'react';
import TeamMetricBarChart from './TeamMetricBarChart';

export default function PRCountPerRepoChart({ selectedSemester }) {
  return (
    <TeamMetricBarChart
      selectedSemester={selectedSemester}
      sectionKey="pr_count_per_repo"
      groupNamesKey="group_names"
      valuesKey="pr_counts"
      averageKey="average_pr"
      valueKey="pullRequests"
      valueLabel="Pull Requests"
      averageLabel="Average PR Count"
      fill="#b7791f"
    />
  );
}
