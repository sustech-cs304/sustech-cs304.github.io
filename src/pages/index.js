import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Dashboard from '../components/DashBoard';
import React, { useEffect, useState } from 'react';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={clsx(styles.heroContent, { [styles.visible]: isVisible })}>
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">Software Engineering Course at SUSTech</p>
          <div className={styles.heroButtons}>
            <Link
              className={styles.heroButton}
              to="/docs/projects/current-requirement">
              <span>Explore Projects →</span>
            </Link>
            <Link
              className={styles.heroButton}
              to="/docs/outstanding-projects/25S/group1">
              <span>Outstanding Projects →</span>
            </Link>
            <Link
              className={styles.heroButton}
              to="/docs/merged-prs/25S">
              <span>Merged PRs →</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Software Engineering Course at SUSTech">
      <HomepageHeader />
      <main className={styles.mainContent}>
        <div className={styles.mainContainer}>
          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>👨‍💻 Team Development</h3>
              <p>Experience real-world software development through team projects. Learn to collaborate, manage repositories, and build robust applications.</p>
            </div>
            <div className={styles.feature}>
              <h3>🌐 Open Source Contribution</h3>
              <p>Make meaningful contributions to open source projects. Learn to write quality code, submit PRs, and engage with the open source community.</p>
            </div>
            <div className={styles.feature}>
              <h3>📊 Project Analytics</h3>
              <p>Track project progress with detailed analytics. Monitor commits, PRs, and team collaboration patterns to improve development efficiency.</p>
            </div>
          </div>
          <div className={styles.dashboardSection}>
            <h2 className={styles.sectionTitle}>Project Analytics Dashboard</h2>
            <p className={styles.sectionDescription}>
              Explore detailed analytics of past semester projects, including commit patterns, 
              contribution distributions, and team collaboration metrics.
            </p>
            <Dashboard />
          </div>
        </div>
      </main>
    </Layout>
  );
}