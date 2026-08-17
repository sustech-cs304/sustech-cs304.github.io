import React from 'react';
import TeamMetricBarChart from './TeamMetricBarChart';

export default function CommitCountPerRepoChart({ selectedSemester }) {
  return (
    <TeamMetricBarChart
      selectedSemester={selectedSemester}
      sectionKey="commit_count_per_repo"
      groupNamesKey="group_names"
      valuesKey="commit_counts"
      averageKey="average_commit_count"
      valueKey="commits"
      valueLabel="Commits"
      averageLabel="Average Commit Count"
    />
  );
}
