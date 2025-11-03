'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import styles from './page.module.css';

export default function PrivacyPage() {
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
            <h2 className={styles.title}>Privacy Policy</h2>
            
            <p className={styles.meta}>
              <strong>Effective Date:</strong> November 2, 2025<br />
              <strong>Owner:</strong> Learnif by 16x Studios
            </p>

            <p className={styles.text}>
              Your privacy is important to us. This Privacy Policy explains how Learnif ("we", "our", or "us") collects, uses, and protects your information when you use our website, app, or related services.
            </p>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>1. Information We Collect</h3>
              <p className={styles.text}>
                We collect only the data necessary to improve your learning experience:
              </p>
              <ul className={styles.list}>
                <li><strong>Account details:</strong> name, email address, and login credentials</li>
                <li><strong>Usage data:</strong> your activity, preferences, and learning progress</li>
                <li><strong>Device data:</strong> browser type, IP address, and general analytics information</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>2. How We Use Your Information</h3>
              <p className={styles.text}>We use collected data to:</p>
              <ul className={styles.list}>
                <li>Provide and improve our learning services</li>
                <li>Personalize your experience</li>
                <li>Send important updates and verification emails</li>
                <li>Maintain security and prevent misuse</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>3. Data Protection</h3>
              <p className={styles.text}>
                We use SSL encryption and secure databases to protect your information.
                Your data is never sold, rented, or shared with third parties without consent.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>4. Email Communication</h3>
              <p className={styles.text}>
                We may send you emails for verification, updates, or learning-related information.
                You can unsubscribe anytime through the link provided in the email or by contacting{' '}
                <a href="mailto:support@16xstudios.space" className={styles.link}>support@16xstudios.space</a>.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>5. Third-Party Services</h3>
              <p className={styles.text}>
                We may use trusted tools for analytics, hosting, or email delivery. These services follow strong data protection standards.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>6. Your Rights</h3>
              <p className={styles.text}>You can:</p>
              <ul className={styles.list}>
                <li>Request access to your personal data</li>
                <li>Request correction or deletion of your data</li>
                <li>Withdraw consent at any time by contacting{' '}
                  <a href="mailto:support@16xstudios.space" className={styles.link}>support@16xstudios.space</a>
                </li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>7. Policy Updates</h3>
              <p className={styles.text}>
                We may update this Privacy Policy periodically. Any updates will be reflected on this page with a new "Effective Date."
              </p>
            </div>

            <div className={styles.contact}>
              <p className={styles.text}>
                📩 <strong>Contact for Privacy Matters:</strong>{' '}
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

