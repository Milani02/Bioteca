import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { Video } from '@/lib/supabase';

interface VideoRowProps {
  id?: string;
  title: string;
  videos: Video[];
  onDelete?: (video: Video) => void;
}

export function VideoRow({ id, title, videos, onDelete }: VideoRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    if (el) ro.observe(el);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [videos.length, checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.78 : -el.clientWidth * 0.78, behavior: 'smooth' });
  };

  if (videos.length === 0) return null;

  return (
    <div id={id} className="relative mb-10 group/row">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 md:px-10 xl:px-16 mb-3">
        <span className="w-1 h-5 rounded-full bg-primary flex-shrink-0" />
        <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-[11px] text-white/20 font-semibold ml-0.5">{videos.length}</span>
      </div>

      {/* Slider */}
      <div className="relative">
        {/* Left fade + arrow */}
        <AnimatePresence>
          {canLeft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-6 w-20 z-10 flex items-center justify-start pl-1 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
            >
              <motion.button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-white hover:bg-white/15 hover:border-white/30 transition-colors pointer-events-auto ml-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable track */}
        <div
          ref={trackRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide py-4 px-4 md:px-10 xl:px-16"
          style={{ scrollPaddingInlineStart: '2.5rem' }}
        >
          {videos.map((video, i) => (
            <div
              key={video.id}
              className="flex-none w-36 sm:w-44 md:w-48 lg:w-52 xl:w-56 2xl:w-60"
            >
              <VideoCard
                video={video}
                index={i}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>

        {/* Right fade + arrow */}
        <AnimatePresence>
          {canRight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-6 w-20 z-10 flex items-center justify-end pr-1 pointer-events-none"
              style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
            >
              <motion.button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-white hover:bg-white/15 hover:border-white/30 transition-colors pointer-events-auto mr-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
