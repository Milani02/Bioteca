import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import logo from '@/assets/bioteca_logo.png';
import videoBg from '@/assets/312849_small.mp4';

const TITLE = 'Bem-vindo';
const SUBTITLE = 'Sua jornada de conhecimento na Biodinâmica começa agora.'.split(' ');

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Video bg */}
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-45"
      >
        <source src={videoBg} type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-0" />

      {/* Content */}
      <div className="z-10 flex flex-col items-center text-center max-w-4xl w-full">
        {/* Logo */}
        <motion.img
          src={logo}
          alt="Bioteca"
          className="h-14 md:h-20 mb-12 drop-shadow-2xl"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 0 40px hsl(78 45% 40% / 0.5))' }}
        />

        {/* Title — letter stagger */}
        <h1
          className="text-6xl md:text-[7rem] font-black text-white tracking-tighter uppercase leading-none mb-6"
          aria-label={TITLE}
        >
          {Array.from(TITLE).map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60, rotateX: -80 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: 0.2 + i * 0.065,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle — word stagger */}
        <p className="text-white/60 text-lg md:text-xl font-medium mb-14 leading-relaxed max-w-xl">
          {SUBTITLE.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.055, duration: 0.5, ease: 'easeOut' }}
              style={{ display: 'inline-block', marginRight: '0.32em' }}
            >
              {word === 'Biodinâmica' ? (
                <span className="text-primary font-bold">{word}</span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </p>

        {/* CTA button */}
        <motion.button
          onClick={() => navigate('/dashboard')}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="relative flex items-center gap-4 px-12 py-5 rounded-full text-white font-extrabold text-lg uppercase tracking-widest overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            boxShadow: '0 0 60px hsl(var(--primary) / 0.45), 0 8px 32px hsl(0 0% 0% / 0.4)',
          }}
        >
          {/* Repeating shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          />
          <span className="relative z-10">Acessar Conteúdo</span>
          <Play className="w-5 h-5 relative z-10 fill-current" />
        </motion.button>
      </div>

      {/* Footer */}
      <motion.div
        className="absolute bottom-8 text-white/20 text-[10px] font-mono uppercase tracking-[0.5em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
      >
        Biodinâmica • Hub de Treinamentos • 2026
      </motion.div>
    </motion.div>
  );
}
