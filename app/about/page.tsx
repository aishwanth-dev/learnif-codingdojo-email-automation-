'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <PageLayout showParticles={true}>
      <main className={styles.container}>
        <motion.h1
          className={styles.topTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          learnif.
        </motion.h1>

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className={styles.glassCard}>
            <h2 className={styles.title}>🪞 About Us — Learnif</h2>
            
            <p className={styles.text}>
              Welcome to Learnif, a modern learning platform built by <span className={styles.highlight}>16x Studios</span>.
              Our mission is simple — to make learning interactive, inspiring, and truly personal.
            </p>

            <p className={styles.text}>
              We believe education should never feel distant. Learnif helps learners stay consistent through smart automation, daily updates, and personalized guidance — all designed with creativity and focus.
            </p>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🌱 Our Vision</h3>
              <p className={styles.text}>
                To bridge the gap between curiosity and confidence — helping learners grow every single day, with tools that motivate and connect.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>💡 What We Do</h3>
              <ul className={styles.list}>
                <li>Deliver personalized learning content and updates</li>
                <li>Help students track their daily progress</li>
                <li>Simplify access to educational resources</li>
                <li>Build tools that make learning fun, focused, and rewarding</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🧩 Who We Are</h3>
              <p className={styles.text}>
                16x Studios is a creative technology studio focused on building aesthetic, functional, and learner-centered experiences. From automation tools to AI-based platforms, we create projects that blend simplicity with purpose.
              </p>
            </div>

            <div className={styles.contact}>
              <p className={styles.text}>
                📩 <strong>Contact us:</strong>{' '}
                <a href="mailto:support@16xstudios.space" className={styles.link}>
                  support@16xstudios.space
                </a>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.footer
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Link href="/" className={styles.footerLink}>Back to Home</Link>
        </motion.footer>
      </main>
    </PageLayout>
  );
}

