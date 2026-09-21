import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X, Maximize2, Minimize2, Calendar, Play, Pause, Volume2, VolumeX,
} from 'lucide-react';
import { Video, VideoChapter } from '@/lib/supabase';
import { chapterService } from '@/services/chapterService';
import { VideoSeekBar } from '@/components/VideoSeekBar';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/utils';

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal = ({ video, isOpen, onClose }: VideoPlayerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrubbing = useRef(false);

  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', video?.id],
    queryFn: () => chapterService.fetchByVideoId(video!.id),
    enabled: !!video?.id && isOpen,
  });
  const hasChapters = chapters.length > 0;

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

  /* ── Auto-hide controls (header + bottom bar) after 3.5 s of inactivity ── */
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isScrubbing.current) setShowControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    if (isOpen) revealControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isOpen, revealControls]);

  /* ── Reset transient playback state whenever a video is opened ── */
  useEffect(() => {
    if (isOpen) {
      setIsBuffering(true);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
    }
  }, [isOpen, video?.id]);

  /* ── Track real fullscreen state (icon + Esc-driven exit) ── */
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ── Fullscreen: target the whole panel (video + controls + chapter list),
     not the bare <video>, so custom UI stays visible/usable in fullscreen ── */
  const goFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    const el = playerContainerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as HTMLDivElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen)
      (el as HTMLDivElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play(); else el.pause();
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const handleSeek = (time: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = time;
    setCurrentTime(time);
  };

  const seekToChapter = (time: number) => {
    handleSeek(time);
    videoRef.current?.play();
  };

  const activeChapter = chapters.reduce<VideoChapter | undefined>(
    (acc, c) => (c.start_time_seconds <= currentTime ? c : acc),
    undefined
  );

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
          onMouseMove={revealControls}
          onTouchStart={revealControls}
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
            ref={playerContainerRef}
            className={cn(
              'relative z-10 overflow-hidden bg-black shadow-[0_32px_96px_rgba(0,0,0,0.9)] w-full h-[100dvh] flex flex-col',
              hasChapters
                ? 'sm:h-[80vh] sm:max-h-[850px] sm:max-w-6xl sm:rounded-2xl sm:flex-row'
                : 'sm:h-auto sm:max-w-5xl sm:rounded-2xl'
            )}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            {/* Stage: ambient backdrop + video + header + bottom bar */}
            <div
              className={cn(
                'relative w-full z-10',
                hasChapters
                  ? 'aspect-video flex-shrink-0 sm:aspect-auto sm:h-full sm:flex-1 sm:min-w-0'
                  : 'h-full sm:aspect-video'
              )}
            >
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

              <video
                ref={videoRef}
                src={video.url}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                playsInline
                preload="metadata"
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onLoadedData={() => setIsBuffering(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
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
                      <div className="absolute inset-0 rounded-full bg-white/5 blur-md" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating header (auto-hides) */}
              <motion.div
                className="absolute top-0 inset-x-0 z-20 px-4 sm:px-6 pt-4 sm:pt-5 pb-16 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                }}
                animate={{ opacity: showControls ? 1 : 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 pointer-events-auto">
                    <h2 className="font-black text-base sm:text-xl text-white leading-tight truncate drop-shadow">
                      {video.title}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Calendar className="w-3 h-3 text-white/35 flex-shrink-0" />
                      <span className="text-[11px] text-white/35">{formatDate(video.created_at)}</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors pointer-events-auto flex-shrink-0"
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    title="Fechar  (Esc)"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Bottom control bar (auto-hides) */}
              <motion.div
                className="absolute bottom-0 inset-x-0 z-20 px-3 sm:px-5 pt-10 pb-3 sm:pb-4 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                }}
                animate={{ opacity: showControls ? 1 : 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <div className="pointer-events-auto">
                  <VideoSeekBar
                    currentTime={currentTime}
                    duration={duration}
                    chapters={chapters}
                    onSeek={handleSeek}
                    onScrubStart={() => { isScrubbing.current = true; revealControls(); }}
                    onScrubEnd={() => { isScrubbing.current = false; revealControls(); }}
                  />

                  <div className="flex items-center justify-between gap-3 mt-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <motion.button
                        onClick={togglePlay}
                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        whileTap={{ scale: 0.9 }}
                        title={isPlaying ? 'Pausar' : 'Reproduzir'}
                      >
                        {isPlaying
                          ? <Pause className="w-5 h-5 fill-current" />
                          : <Play className="w-5 h-5 fill-current" />}
                      </motion.button>

                      <motion.button
                        onClick={toggleMute}
                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        whileTap={{ scale: 0.9 }}
                        title={isMuted ? 'Ativar som' : 'Silenciar'}
                      >
                        {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                      </motion.button>

                      <span className="text-[11px] sm:text-xs text-white/60 font-mono tabular-nums ml-1">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <motion.button
                      onClick={goFullscreen}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      whileTap={{ scale: 0.9 }}
                      title="Tela cheia"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Chapter list */}
            {hasChapters && (
              <div className="flex-1 min-h-0 overflow-y-auto sm:flex-none sm:w-[300px] sm:flex-shrink-0 bg-black/60 border-t sm:border-t-0 sm:border-l border-white/[0.06]">
                <div className="px-4 py-3 sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.06]">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.18em]">
                    Capítulos
                  </span>
                </div>
                <ul className="p-2 space-y-0.5">
                  {chapters.map((c) => {
                    const isActive = c.id === activeChapter?.id;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => seekToChapter(c.start_time_seconds)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            isActive ? 'bg-white/10' : 'hover:bg-white/[0.05]'
                          )}
                        >
                          <span
                            className="text-[11px] font-mono flex-shrink-0 rounded-md px-1.5 py-0.5"
                            style={{
                              color: isActive ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.4)',
                              background: isActive ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                            }}
                          >
                            {formatTime(c.start_time_seconds)}
                          </span>
                          <span className={cn('text-sm truncate', isActive ? 'text-white font-semibold' : 'text-white/70')}>
                            {c.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(VideoPlayerModal);
