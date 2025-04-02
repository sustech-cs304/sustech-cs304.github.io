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

const SEMESTERS = ['23 Spring', '24 Spring', '25 Spring'];

export default function Dashboard() {
  const [selectedSemester, setSelectedSemester] = useState('23 Spring');

  return (
    <div className="dashboard-container">
      {/* Header和学期选择器 */}
      <div className="dashboard-header">
        <h2>Dashboard Visualization Panel</h2>
        <SemesterSelector 
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          options={SEMESTERS}
        />
      </div>

      {/* 单列卡片排列 */}
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
          title="Code Line Count per Repo"
          reverse={true}
        >
          <CodeLineCountChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="Programming Language Distribution"
          reverse={false}
        >
          <LanguageDistributionPieChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="PR Count per Repo"
          reverse={true}
        >
          <PRCountPerRepoChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="PR Merge Status"
          reverse={false}
        >
          <PRStatusPieChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="Issue Count per Repo"
          reverse={true}
        >
          <IssueCountPerRepoChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="Issue Closed Status"
          reverse={false}
        >
          <IssueStatusPieChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="Active Contributors per Project"
          reverse={true}
        >
          <ActiveContributorChart selectedSemester={selectedSemester} />
        </ChartCard>
        <ChartCard 
          title="Active Contributor Distribution"
          reverse={false}
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

// ChartCard组件：内部采用左右分栏布局，支持反转（左右错落）
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
            {/* 此处可以根据需要添加对应图表的描述文本 */}
            Description for "{title}" goes here.
          </p>
        </div>
      </div>
    </div>
  );
}
