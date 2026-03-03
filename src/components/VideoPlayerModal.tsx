import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { Video } from '@/lib/supabase';

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fecha com a tecla ESC e bloqueia o scroll do fundo
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Função manual para tela cheia (fallback para mobile)
  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && video && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Fundo escuro */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Container do Modal */}
          <motion.div
            // [MUDANÇA CRÍTICA]: sm:h-[80vh] fixa a altura no desktop.
            // Isso garante que o flexbox calcule o espaço restante para o vídeo corretamente.
            className="relative z-10 w-full h-[100dvh] sm:h-[80vh] sm:max-w-5xl glass-card rounded-none sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header (Fixo no topo) */}
            <div className="flex-none flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/90 backdrop-blur-md z-20">
              <h2 className="font-bold text-sm sm:text-lg text-white truncate pr-4 flex-1">
                {video.title}
              </h2>
              <div className="flex items-center gap-2">
                {/* Botão extra de tela cheia (útil para mobile) */}
                <button
                  onClick={toggleFullScreen}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors sm:hidden text-white"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </div>
            </div>

            {/* Área do Vídeo (Ocupa todo o espaço restante) */}
            <div className="flex-1 relative bg-black w-full overflow-hidden group">
              {/* [MUDANÇA CRÍTICA]: absolute inset-0 
                Isso força o vídeo a respeitar exatamente as bordas da área cinza.
                Se o vídeo for maior, o object-contain vai reduzi-lo para caber.
                Se for menor, vai centralizar.
              */}
              <video
                ref={videoRef}
                src={video.url}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              >
                Seu navegador não suporta vídeos HTML5.
              </video>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}