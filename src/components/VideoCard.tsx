import { memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Video } from '@/lib/supabase';

interface VideoCardProps {
  video: Video;
  onDelete?: (video: Video) => void;
  index: number;
}

export const VideoCard = memo(({ video, onDelete, index }: VideoCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative cursor-pointer rounded-xl overflow-hidden bg-zinc-900 group/card w-full"
      onClick={() => navigate(`/video/${video.id}`)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.04, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      style={{ zIndex: 0 }}
    >
      {/* Thumbnail */}
      <div className="aspect-video overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-white/25 ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="w-11 h-11 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-xl">
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* Title — slides up on hover */}
      <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 translate-y-1 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none">
        <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight drop-shadow-lg">
          {video.title}
        </p>
      </div>

      {/* Delete — admin only */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(video); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/20 transition-all opacity-0 group-hover/card:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
});

VideoCard.displayName = 'VideoCard';
