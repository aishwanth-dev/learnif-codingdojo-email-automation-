'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export default function CheckmarkAnimation() {
  const progress = useMotionValue(0);
  const circleLength = useTransform(progress, [0, 100], [0, 1]);
  const checkmarkPathLength = useTransform(progress, [0, 95, 100], [0, 0, 1]);
  const circleColor = useTransform(
    progress,
    [0, 95, 100],
    ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.8)', 'rgba(123, 184, 111, 0.9)']
  );

  useEffect(() => {
    progress.set(0);
    const timer = setTimeout(() => {
      progress.set(100);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="200"
      height="200"
      viewBox="0 0 258 258"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(123, 184, 111, 0.3))' }}
    >
      {/* Check mark */}
      <motion.path
        transform="translate(60 85)"
        d="M3 50L45 92L134 3"
        fill="transparent"
        stroke="rgba(123, 184, 111, 1)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: checkmarkPathLength, opacity: checkmarkPathLength }}
      />
      {/* Circle */}
      <motion.path
        d="M 130 6 C 198.483 6 254 61.517 254 130 C 254 198.483 198.483 254 130 254 C 61.517 254 6 198.483 6 130 C 6 61.517 61.517 6 130 6 Z"
        fill="transparent"
        strokeWidth="8"
        stroke={circleColor}
        strokeLinecap="round"
        style={{
          pathLength: circleLength,
          filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
        }}
      />
    </motion.svg>
  );
}

