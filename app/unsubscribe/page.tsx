'use client';

import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import styles from './page.module.css';

export default function UnsubscribePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('Processing your request...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link.');
      return;
    }

    // Decode just to show the email at top
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [e] = decoded.split('|');
      if (e && e.includes('@')) setEmail(e);
    } catch {}

    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage('Done. You have been unsubscribed.');
          if (data?.email) setEmail(data.email);
        } else {
          setStatus('error');
          setMessage(data?.error || 'Failed to unsubscribe.');
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
        <h1 className={styles.topTitle}>learnif.</h1>

        <div className={styles.glassCard}>
          <div className={styles.content}>
            {email && (
              <p className={`${styles.description} ${styles.emailLine}`}>
                Unsubscribing: <span className={styles.emailStrong}>{email}</span>
              </p>
            )}

            {status === 'loading' && (
              <div className={styles.loaderContainer}>
                <div className={styles.loader}></div>
              </div>
            )}

            {status === 'success' && (
              <>
                <h2 className={styles.headline}>Done</h2>
                <p className={styles.description}>{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <h2 className={styles.headline}>Unable to Unsubscribe</h2>
                <p className={styles.description}>{message}</p>
              </>
            )}
          </div>
        </div>
      </main>
    </PageLayout>
  );
}


