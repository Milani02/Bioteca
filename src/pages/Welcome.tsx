import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import logo from '@/assets/bioteca_logo.png';
import videoBg from '@/assets/312849_small.mp4'; // O vídeo que você mandou

export default function Welcome() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black px-4">
      {/* VÍDEO DE FUNDO EM LOOP */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
      >
        <source src={videoBg} type="video/mp4" />
      </video>

      {/* Camada de Gradiente para garantir a leitura do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-0" />

      <motion.div 
        className="z-10 flex flex-col items-center text-center max-w-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Logo flutuando */}
        <motion.img
          src={logo}
          alt="Bioteca"
          className="h-20 md:h-28 mb-10 drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase drop-shadow-2xl">
            Bem-vindo
          </h1>
          <p className="text-gray-300 text-lg md:text-2xl mb-12 font-medium leading-relaxed drop-shadow-lg">
            Sua jornada de conhecimento na <span className="text-primary font-bold">Biodinâmica</span> começa agora.
          </p>
        </motion.div>

        {/* Botão de Ação Principal */}
        <motion.button
          onClick={handleEnter}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-4 px-12 py-5 bg-primary text-white rounded-full text-xl font-extrabold overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.4)] transition-all"
        >
          <span className="relative z-10 uppercase tracking-widest">Acessar Conteúdo</span>
          <Play className="w-6 h-6 relative z-10 fill-current group-hover:translate-x-1 transition-transform" />
          
          {/* Efeito de brilho ao passar o mouse */}
          <motion.div 
            className="absolute inset-0 bg-white/20 -translate-x-full"
            whileHover={{ translateX: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </motion.button>
      </motion.div>

      {/* Footer minimalista */}
      <motion.div 
        className="absolute bottom-10 text-white/30 text-xs font-mono uppercase tracking-[0.5em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Biodinâmica • Hub de Treinamentos • 2026
      </motion.div>
    </div>
  );
}