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
          reverse={false}
        >
          <CommitDateLineChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Hourly Commit Distribution"
          reverse={true}
        >
          <CommitHourBarChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Commit Count per Repo"
          reverse={false}
        >
          <CommitCountPerRepoChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard
          title="Commit Distribution"
          reverse={true}
        >
          <CommitDistributionChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard
          title="Gini Commit Distribution"
          reverse={false}
        >
          <GiniCommitDistributionChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard
          title="Gini Change Lines Distribution"
          reverse={true}
        >
          <GiniChangeLinesDistributionChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard
          title="Commit Message Language Distribution"
          reverse={false}
        >
          <CommitMessageLanguageDistribution selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard
          title="Commit Message Length Distribution"
          reverse={true}
        >
          <CommitMessageLengthChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
            title="Code Line Count per Repo"
            reverse={false}
        >
          <CodeLineCountChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
            title="Programming Language Distribution"
            reverse={true}
        >
          <LanguageDistributionPieChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
            title="PR Count per Repo"
            reverse={false}
        >
          <PRCountPerRepoChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="PR Merge Status"
          reverse={true}
        >
          <PRStatusPieChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard
          title="PR Distribution"
          reverse={false}
        >
          <PRDistributionChart  selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Issue Count per Repo"
          reverse={true}
        >
          <IssueCountPerRepoChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Issue Distribution"
          reverse={false}
        >
          <IssueDistributionChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Issue Closed Status"
          reverse={true}
        >
          <IssueStatusPieChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Branch Count per Repo"
          reverse={false}
        >
          <BranchCountPerRepoChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Branch Count Distribution"
          reverse={true}
        >
          <BranchCountDistributionChart selectedSemester={selectedSemester} />
        </ChartCard>

        <ChartCard 
          title="Active Contributors per Project"
          reverse={false}
        >
          <ActiveContributorChart selectedSemester={selectedSemester} />
        </ChartCard>
        
        <ChartCard 
          title="Active Contributor Distribution"
          reverse={true}
        >
          <ActiveContributorPieChart selectedSemester={selectedSemester} />
        </ChartCard>
      </div>
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
function ChartCard({ title, children, reverse }) {
  return (
    <div className="chart-card">
      <div className={`chart-card-content ${reverse ? 'reverse' : ''}`}>
        <div className="chart-image">
          {children}
        </div>
        <div className="chart-text">
          <h3>{title}</h3>
          <p>
            {/* Chart description text can be added here as needed */}
            Description for "{title}" goes here.
          </p>
        </div>
      </div>
    </div>
  );
}
