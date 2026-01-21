import React, { useState } from 'react';
import './Dashboard.css';

import CommitDateLineChart from './CommitDateLineChart';
import CommitHourBarChart from './CommitHourBarChart';
import CommitCountPerRepoChart from './CommitCountPerRepoChart';
import CodeLineCountChart from './CodeLineCountChart';
import LanguageDistributionPieChart from './LanguageDistributionPieChart';
import PRCountPerRepoChart from './PRCountPerRepoChart';
import PRStatusPieChart from './PRStatusPieChart';
import IssueCountPerRepoChart from './IssueCountPerRepoChart';
import IssueStatusPieChart from './IssueStatusPieChart';
import ActiveContributorChart from './ActiveContributorChart';
import ActiveContributorPieChart from './ActiveContributorPieChart';
import BranchCountPerRepoChart from './BranchCountPerRepoChart';
import BranchCountDistributionChart from './BranchCountDistributionChart';
import IssueDistributionChart from './IssueDistributionChart';
import PRDistributionChart from './PRDistributionChart';
import CommitDistributionChart from './CommitDistributionChart';
import GiniCommitDistributionChart from './GinCommitiDistributionChart';
import GiniChangeLinesDistributionChart from './GiniChangeLinesDistributionChart';
import CommitMessageLanguageDistribution from './CommitMessageLanguageDistribution';
import CommitMessageLengthChart from './CommitMessageLengthChart';

const SEMESTERS = ['23 Spring', '24 Spring', '25 Spring'];

export default function Dashboard() {
  const [selectedSemester, setSelectedSemester] = useState('23 Spring');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Visualization Panel</h2>
        <SemesterSelector 
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          options={SEMESTERS}
        />
      </div>

      {/* Single column card layout */}
<div className="charts-grid">
  <ChartCard
    title="Daily Commit Distribution Over the Year"
    description="Daily commits across the year; spikes line up with sprint deadlines and releases."
    reverse={false}
  >
    <CommitDateLineChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Hourly Commit Distribution"
    description="Commit volume by hour of day to see when teams are most active."
    reverse={true}
  >
    <CommitHourBarChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Commit Count per Repo"
    description="Total commits per repository to compare team activity."
    reverse={false}
  >
    <CommitCountPerRepoChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Commit Distribution"
    description="Distribution of commits to spot uneven contributions or bursty work."
    reverse={true}
  >
    <CommitDistributionChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Gini Commit Distribution"
    description="Gini coefficient on commits; higher means more uneven contributions."
    reverse={false}
  >
    <GiniCommitDistributionChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Gini Change Lines Distribution"
    description="Gini on changed lines to see who is making the larger edits."
    reverse={true}
  >
    <GiniChangeLinesDistributionChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Commit Message Language Distribution"
    description="Language breakdown of commit messages."
    reverse={false}
  >
    <CommitMessageLanguageDistribution selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Commit Message Length Distribution"
    description="Typical commit message length; shorter can hint at low-quality messages."
    reverse={true}
  >
    <CommitMessageLengthChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Code Line Count per Repo"
    description="Lines of code per repository."
    reverse={false}
  >
    <CodeLineCountChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Programming Language Distribution"
    description="Language mix across the codebase."
    reverse={true}
  >
    <LanguageDistributionPieChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="PR Count per Repo"
    description="Pull requests opened per repository."
    reverse={false}
  >
    <PRCountPerRepoChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="PR Merge Status"
    description="Merge vs open PRs to track throughput."
    reverse={true}
  >
    <PRStatusPieChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="PR Distribution"
    description="Distribution of PR counts to find outliers."
    reverse={false}
  >
    <PRDistributionChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Issue Count per Repo"
    description="Open issues per repository."
    reverse={true}
  >
    <IssueCountPerRepoChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Issue Distribution"
    description="Issue distribution across projects."
    reverse={false}
  >
    <IssueDistributionChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Issue Closed Status"
    description="Closed vs open issues to gauge resolution rate."
    reverse={true}
  >
    <IssueStatusPieChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Branch Count per Repo"
    description="How many branches each repo maintains."
    reverse={false}
  >
    <BranchCountPerRepoChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Branch Count Distribution"
    description="Distribution of branch counts; high counts can indicate experimentation."
    reverse={true}
  >
    <BranchCountDistributionChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Active Contributors per Project"
    description="Number of active contributors on each project."
    reverse={false}
  >
    <ActiveContributorChart selectedSemester={selectedSemester} />
  </ChartCard>

  <ChartCard
    title="Active Contributor Distribution"
    description="Distribution of contributor counts across projects."
    reverse={true}
  >
    <ActiveContributorPieChart selectedSemester={selectedSemester} />
  </ChartCard>
</div>
  );
}

function SemesterSelector({ value, onChange, options }) {
  return (
    <div className="semester-selector">
      <select value={value} onChange={onChange} className="semester-select">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// ChartCard component: Internal left-right column layout, supports reversal (alternating left-right)
function ChartCard({ title, description, children, reverse }) {
  return (
    <div className="chart-card">
      <div className={`chart-card-content ${reverse ? 'reverse' : ''}`}>
        <div className="chart-image">
          {children}
        </div>
        <div className="chart-text">
          <h3>{title}</h3>
          <p>{description ?? `Description for "${title}" goes here.`}</p>
        </div>
      </div>
    </div>
  );
}
