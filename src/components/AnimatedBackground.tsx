import { memo, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const AnimatedBackground = () => {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { damping: 60, stiffness: 80 });
  const smoothY = useSpring(mouseY, { damping: 60, stiffness: 80 });

  const orb1X = useTransform(smoothX, [0, 1], ['-6%', '6%']);
  const orb1Y = useTransform(smoothY, [0, 1], ['-5%', '5%']);
  const orb2X = useTransform(smoothX, [0, 1], ['4%', '-4%']);
  const orb2Y = useTransform(smoothY, [0, 1], ['3%', '-3%']);
  const orb3X = useTransform(smoothX, [0, 1], ['-9%', '9%']);
  const orb3Y = useTransform(smoothY, [0, 1], ['4%', '-4%']);
  const orb4X = useTransform(smoothX, [0, 1], ['5%', '-5%']);
  const orb4Y = useTransform(smoothY, [0, 1], ['-3%', '3%']);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950/80 to-black" />

      {/* Orb 1 — main green, top-left */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(78 38% 26% / 0.22) 0%, transparent 65%)',
          top: '0%', left: '10%',
          x: orb1X, y: orb1Y,
        }}
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orb 2 — lighter green, bottom-right */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(90 30% 40% / 0.14) 0%, transparent 65%)',
          bottom: '5%', right: '5%',
          x: orb2X, y: orb2Y,
        }}
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Orb 3 — accent, center */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(78 50% 32% / 0.1) 0%, transparent 65%)',
          top: '35%', right: '25%',
          x: orb3X, y: orb3Y,
        }}
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
      />

      {/* Orb 4 — subtle, bottom-left */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(85 40% 30% / 0.09) 0%, transparent 65%)',
          bottom: '20%', left: '5%',
          x: orb4X, y: orb4Y,
        }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 11 }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
};

export default memo(AnimatedBackground);
