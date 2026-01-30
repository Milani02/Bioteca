import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base mesh gradient */}
      <div className="absolute inset-0 mesh-gradient-bg" />
      
      {/* Floating orbs for extra depth */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(78 38% 26% / 0.4) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
        }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, hsl(85 35% 35% / 0.4) 0%, transparent 70%)',
          top: '50%',
          right: '10%',
        }}
        animate={{
          x: [0, -80, -40, 0],
          y: [0, -60, 80, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(90 25% 45% / 0.3) 0%, transparent 70%)',
          bottom: '5%',
          left: '40%',
        }}
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle noise overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
