'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Particles from './Particles';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: React.ReactNode;
  showParticles?: boolean;
}

export default function PageLayout({ children, showParticles = true }: PageLayoutProps) {
  const [backgroundImage, setBackgroundImage] = useState('/image/images.jpg');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load saved background image from localStorage
    const savedBg = localStorage.getItem('learnif-background-image');
    if (savedBg) {
      setBackgroundImage(savedBg);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setBackgroundImage(result);
            localStorage.setItem('learnif-background-image', result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setBackgroundImage(result);
            localStorage.setItem('learnif-background-image', result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className={styles.hiddenInput}
        aria-label="Upload background image"
      />
      <div
        className={`${styles.backgroundImage} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBackgroundClick}
      >
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          priority
          quality={100}
          style={{ objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
        {showParticles && (
          <div className={styles.particlesWrapper}>
            <Particles
              particleColors={['#ffffff', '#ffffff']}
              particleCount={200}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={100}
              moveParticlesOnHover={true}
              alphaParticles={false}
              disableRotation={false}
            />
          </div>
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

