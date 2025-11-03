'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import PageLayout from '../components/PageLayout';
import styles from './page.module.css';

export default function TermsPage() {
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
            <h2 className={styles.title}>Terms and Conditions</h2>
            
            <p className={styles.meta}>
              <strong>Effective Date:</strong> November 2, 2025<br />
              <strong>Operated by:</strong> 16x Studios
            </p>

            <p className={styles.text}>
              By using Learnif, you agree to the following Terms and Conditions. Please read them carefully.
            </p>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>1. Acceptance of Terms</h3>
              <p className={styles.text}>
                By accessing or using Learnif, you agree to comply with these terms. If you disagree with any part, please do not use our services.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>2. Use of Service</h3>
              <ul className={styles.list}>
                <li>Learnif provides educational and productivity tools for personal, non-commercial use.</li>
                <li>You agree not to misuse, reproduce, or modify the platform for unlawful purposes.</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>3. Accounts and Security</h3>
              <ul className={styles.list}>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>We are not liable for any loss caused by unauthorized account access.</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>4. Content Ownership</h3>
              <p className={styles.text}>
                All materials, designs, and learning content provided on Learnif are owned or licensed by 16x Studios.
                You may not redistribute, copy, or use them commercially without permission.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>5. Limitation of Liability</h3>
              <ul className={styles.list}>
                <li>Learnif is provided "as is" without any warranties.</li>
                <li>We do not guarantee uninterrupted service or absolute accuracy of content.</li>
                <li>16x Studios shall not be liable for any indirect or incidental damages arising from your use of the platform.</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>6. Modifications</h3>
              <p className={styles.text}>
                We reserve the right to modify, suspend, or discontinue Learnif at any time.
                Any changes to these Terms will be updated on this page.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>7. Termination</h3>
              <p className={styles.text}>
                We may suspend or terminate your access if you violate these Terms or engage in harmful behavior toward the service or other users.
              </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>8. Governing Law</h3>
              <p className={styles.text}>
                These Terms are governed by the laws of India. Any disputes shall be resolved under Indian jurisdiction.
              </p>
            </div>

            <div className={styles.contact}>
              <p className={styles.text}>
                📩 <strong>Contact for Legal Inquiries:</strong>{' '}
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

