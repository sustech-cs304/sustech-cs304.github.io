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
          <p className="hero__subtitle">Southern University of Science and Technology (SUSTech)</p>
          <div className={styles.heroButtons}>
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
            <Link
              className={styles.heroButton}
              to="/docs/dashboard/25S">
              <span>Dashboard →</span>
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
              <h3>👨‍💻 Team Collaboration</h3>
              <p>Great software is built by people working in harmony with smart tools. Learn to coordinate roles, manage project timelines, and lead your team to turn a shared vision into a reality.</p>
            </div>
            <div className={styles.feature}>
              <h3>🌐 Open Source Contribution</h3>
              <p>Move beyond the classroom. Submit your first PRs to real-world projects and leave your mark on the global open-source community.</p>
            </div>
            <div className={styles.feature}>
              <h3>📊 The Pulse of CS304</h3>
              <p>See the course in motion! Follow the collective activity of all teams through live analytics, tracking every commit and contribution as we build the semester together.</p>
            </div>
          </div>


                    {/* Instructors cards at the bottom */}
                    <section className="margin-top--lg">
            <h2 className={styles.sectionTitle}>Course Instructors</h2>
            <div className={styles.features}>
              <div className={styles.feature}>
                <img
                  className="avatar__photo avatar__photo--xl"
                  src="/img/tyd.jpg"
                  alt="Yida Tao"
                  width="160"
                  height="160"
                  style={{ borderRadius: '50%', marginBottom: '1rem' }}
                />
                <h3>Yida Tao</h3>
                <p>Course Instructor</p>
                <p>
                  <a href="mailto:your.email@sustech.edu.cn">✉ Email</a>{' '}
                  ·{' '}
                  <a href="https://your-website.example.com" target="_blank" rel="noreferrer">
                    🌐 Website
                  </a>
                </p>
              </div>

              <div className={styles.feature}>
                <img
                  className="avatar__photo avatar__photo--xl"
                  src="/img/sustech-logo.png"
                  alt="Co‑Instructor"
                  width="160"
                  height="160"
                  style={{ borderRadius: '50%', marginBottom: '1rem' }}
                />
                <h3>Co‑Instructor</h3>
                <p>Teaching Assistant</p>
                <p>
                  <a href="mailto:co.instructor@sustech.edu.cn">✉ Email</a>{' '}
                  ·{' '}
                  <a href="https://co-instructor.example.com" target="_blank" rel="noreferrer">
                    🌐 Website
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* <div className="container margin-top--lg">
            <div className="row">
              <div className="col col--6">
                <div className="avatar avatar--vertical">
                  <img
                    className="avatar__photo avatar__photo--xl"
                    src="/img/tyd.jpg"
                    alt="Instructor"
                    width="300"
                    height="300"
                  />
                  <div className="avatar__intro">
                    <div className="avatar__name">Yida Tao</div>
                    <p className="avatar__subtitle">
                      Course Instructor
                    </p>
                  </div>
                </div>
              </div>

              <div className="col col--6">
                <div className="avatar avatar--vertical">
                  <img
                    className="avatar__photo avatar__photo--xl"
                    src="/img/sustech-logo.png"
                    alt="Co-Instructor"
                  />
                  <div className="avatar__intro">
                    <h3 className="avatar__name">Co‑Instructor</h3>
                    <small className="avatar__subtitle">Teaching Assistant</small>
                    <p className="avatar__subtitle">
                      Another short bio. Adjust as needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

        </div>
      </main>
    </Layout>
  );
}
