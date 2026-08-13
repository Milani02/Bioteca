import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Calendar } from 'lucide-react';
import { Video } from '@/lib/supabase';

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal = ({ video, isOpen, onClose }: VideoPlayerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showHeader, setShowHeader] = useState(true);

  /* ── Escape + scroll lock ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  /* ── Auto-hide header after 3.5 s of inactivity ── */
  const revealHeader = useCallback(() => {
    setShowHeader(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowHeader(false), 3500);
  }, []);

  useEffect(() => {
    if (isOpen) revealHeader();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isOpen, revealHeader]);

  /* ── Fullscreen ── */
  const goFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as HTMLVideoElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen)
      (el as HTMLVideoElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && video && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseMove={revealHeader}
          onTouchStart={revealHeader}
        >
          {/* Backdrop — sem blur para poupar GPU durante reprodução */}
          <motion.div
            className="absolute inset-0 bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Player panel */}
          <motion.div
            className="relative z-10 overflow-hidden bg-black shadow-[0_32px_96px_rgba(0,0,0,0.9)]
              w-full h-[100dvh]
              sm:h-auto sm:max-w-5xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            {/* Ambient thumbnail backdrop */}
            {video.thumbnail_url && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage: `url(${video.thumbnail_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(60px) brightness(0.22) saturate(130%)',
                  transform: 'scale(1.12)',
                }}
              />
            )}

            {/* Video area */}
            <div className="relative w-full h-full sm:aspect-video z-10">
              <video
                ref={videoRef}
                src={video.url}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onLoadedData={() => setIsBuffering(false)}
              >
                Seu navegador não suporta vídeos HTML5.
              </video>

              {/* Buffering spinner */}
              <AnimatePresence>
                {isBuffering && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="relative">
                      <motion.div
                        className="w-14 h-14 rounded-full border-2 border-white/10 border-t-white/60"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      />
                      {/* Inner glow */}
                      <div className="absolute inset-0 rounded-full bg-white/5 blur-md" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating header (auto-hides) */}
            <motion.div
              className="absolute top-0 inset-x-0 z-20 px-4 sm:px-6 pt-4 sm:pt-5 pb-16 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
              }}
              animate={{ opacity: showHeader ? 1 : 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Title + date */}
                <div className="flex-1 min-w-0 pointer-events-auto">
                  <h2 className="font-black text-base sm:text-xl text-white leading-tight truncate drop-shadow">
                    {video.title}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Calendar className="w-3 h-3 text-white/35 flex-shrink-0" />
                    <span className="text-[11px] text-white/35">{formatDate(video.created_at)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 pointer-events-auto">
                  <motion.button
                    onClick={goFullscreen}
                    className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    title="Tela cheia"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    title="Fechar  (Esc)"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(VideoPlayerModal);
