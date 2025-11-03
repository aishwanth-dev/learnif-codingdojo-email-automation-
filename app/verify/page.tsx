'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import CheckmarkAnimation from '../components/CheckmarkAnimation';
import styles from './page.module.css';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    // Verify the email
    fetch(`/api/verify?token=${token}`)
      .then(async (response) => {
        if (response.ok) {
          setStatus('success');
          setMessage('All set! Your email has been verified. 🎉');
          console.log('[VERIFY PAGE] ✓ Verification successful');
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
          console.error('[VERIFY PAGE] ✗ Verification failed:', data.error);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      });
  }, []);

  return (
    <PageLayout showParticles={true}>
      <main className={styles.container}>
        {/* Title at top */}
        <motion.h1
          className={styles.topTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          learnif.
        </motion.h1>

        {/* Glass Card */}
        <motion.div
          className={styles.glassCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className={styles.content}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {status === 'loading' && (
              <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
              </div>
            )}
            
            {status === 'success' && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className={styles.checkmarkContainer}
                >
                  <CheckmarkAnimation />
                </motion.div>
                <h2 className={styles.headline}>
                  Verified!
                </h2>
                <p className={styles.description}>
                  You've successfully verified your email. A new chapter of learning starts here.
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <h2 className={styles.headline}>
                  Verification Failed
                </h2>
                <p className={styles.description}>
                  {message}
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className={styles.errorIcon}
                >
                  ✗
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <a href="/" className={styles.footerLink}>Back to Home</a>
        </motion.footer>
      </main>
    </PageLayout>
  );
}

