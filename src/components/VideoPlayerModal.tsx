import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { Video } from '@/lib/supabase';

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal = ({ video, isOpen, onClose }: VideoPlayerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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
          transition={{ duration: 0.2 }} // Reduzido para mais rapidez
        >
          {/* Fundo escuro SEM backdrop-blur para poupar FPS da GPU durante o vídeo */}
          <motion.div
            className="absolute inset-0 bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full h-[100dvh] sm:h-[80vh] sm:max-w-5xl rounded-none sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl bg-black"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex-none flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/90 z-20">
              <h2 className="font-bold text-sm sm:text-lg text-white truncate pr-4 flex-1">
                {video.title}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullScreen}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors sm:hidden text-white"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Vídeo */}
            <div className="flex-1 relative bg-black w-full overflow-hidden group">
              <video
                ref={videoRef}
                src={video.url}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                preload="metadata" // [CRÍTICO] Não carregar o buffer inteiro de cara
                controlsList="nodownload"
              >
                Seu navegador não suporta vídeos HTML5.
              </video>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// [CRÍTICO] Isolamento de render
export default memo(VideoPlayerModal);