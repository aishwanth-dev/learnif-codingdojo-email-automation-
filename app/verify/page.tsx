'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';
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
    <main className={styles.container}>
      {/* Background Image */}
      <div className={styles.backgroundImage}>
        <Image
          src="/image/images.jpg"
          alt="Background"
          fill
          priority
          quality={100}
          style={{ objectFit: 'cover' }}
        />
      </div>

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
          
          <h2 className={styles.headline}>
            {status === 'success' ? (
              <>
                All set! <span className={styles.cursiveSpan}>You're verified</span>
              </>
            ) : status === 'error' ? (
              'Verification Failed'
            ) : (
              'Verifying...'
            )}
          </h2>
          
          <p className={styles.description}>
            {message}
          </p>

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className={styles.successIcon}
            >
              ✓
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className={styles.errorIcon}
            >
              ✗
            </motion.div>
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
  );
}

