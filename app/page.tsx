'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

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
        style={{ opacity }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >

        {/* Main Content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className={styles.headline}>
            Turn your inbox into your <span className={styles.cursiveSpan}>coding</span> dojo.
          </h2>
          <p className={styles.description}>
            Daily coding questions, complete answers, endless growth.
          </p>
        </motion.div>

        {/* Email Form */}
        <motion.form
          className={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <div className={styles.inputContainer}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Get Notified'}
            </button>
          </div>
          {status === 'success' && (
            <motion.p
              className={styles.statusMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Successfully joined! 🎉
            </motion.p>
          )}
          {status === 'error' && (
            <motion.p
              className={styles.errorMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Something went wrong. Please try again.
            </motion.p>
          )}
        </motion.form>

        {/* Social Proof */}
        <motion.div
          className={styles.socialProof}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <div className={styles.avatars}>
            <div className={`${styles.avatar} ${styles.avatar1}`}></div>
            <div className={`${styles.avatar} ${styles.avatar2}`}></div>
            <div className={`${styles.avatar} ${styles.avatar3}`}></div>
          </div>
          <span className={styles.socialText}>~ 2k+ Peoples already joined</span>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        <a href="#about" className={styles.footerLink}>About Us</a>
        <span className={styles.footerSeparator}>•</span>
        <a href="#privacy" className={styles.footerLink}>Privacy Policy</a>
        <span className={styles.footerSeparator}>•</span>
        <a href="#terms" className={styles.footerLink}>Terms and Conditions</a>
      </motion.footer>
    </main>
  );
}

