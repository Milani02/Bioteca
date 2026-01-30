import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Video } from '@/lib/supabase';

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  // Close on escape key
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

  return (
    <AnimatePresence>
      {isOpen && video && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content - Full screen on mobile */}
          <motion.div
            className="relative z-10 w-full h-full sm:h-auto sm:max-w-5xl glass-card sm:rounded-3xl overflow-hidden flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-black/20">
              <h2 className="font-bold text-sm sm:text-lg text-foreground truncate pr-4 flex-1">
                {video.title}
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </motion.button>
            </div>

            {/* Video Player - Full height on mobile */}
            <div className="flex-1 sm:aspect-video bg-black flex items-center justify-center">
              <video
                src={video.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
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
}
