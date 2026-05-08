import { motion } from 'framer-motion';
import { memo } from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
      {/* Fundo base estático */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900/50 to-black" />
      
      {/* Orb 1 - Apenas Opacidade (MUITO mais leve que translação + blur) */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(78 38% 26% / 0.15) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Orb 2 */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(90 25% 45% / 0.1) 0%, transparent 70%)',
          bottom: '5%',
          left: '40%',
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

export default memo(AnimatedBackground);