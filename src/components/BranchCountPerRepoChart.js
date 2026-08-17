import React from 'react';
import TeamMetricBarChart from './TeamMetricBarChart';

export default function BranchCountPerRepoChart({ selectedSemester }) {
  return (
    <TeamMetricBarChart
      selectedSemester={selectedSemester}
      sectionKey="branch_count_per_repo"
      groupNamesKey="group_names"
      valuesKey="branch_counts"
      averageKey="average_branches"
      valueKey="branches"
      valueLabel="Branches"
      averageLabel="Average Branch Count"
      fill="#2f855a"
    />
  );
}
