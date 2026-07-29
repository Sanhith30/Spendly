import { useEffect } from 'react';

const COLORS = ['#C9F31D', '#ffffff', '#60a5fa', '#f472b6', '#34d399', '#fb923c'];

export default function Confetti({ trigger }) {
  useEffect(() => {
    if (!trigger) return;

    const particles = [];
    const count = 36;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-particle';
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = `${20 + Math.random() * 20}vh`;
      el.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.style.animationDelay = `${Math.random() * 0.5}s`;
      el.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;
      el.style.width = `${5 + Math.random() * 6}px`;
      el.style.height = `${5 + Math.random() * 6}px`;
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(el);
      particles.push(el);
    }

    const cleanup = setTimeout(() => {
      particles.forEach(el => el.remove());
    }, 2000);

    return () => {
      clearTimeout(cleanup);
      particles.forEach(el => el.remove());
    };
  }, [trigger]);

  return null;
}
