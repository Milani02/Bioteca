import { motion } from 'framer-motion';
import { Play, Trash2, Calendar, Film } from 'lucide-react';
import { Video } from '@/lib/supabase';
import { GlassCard } from './GlassCard';
import { useAuth } from '@/contexts/AuthContext';

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onDelete?: (video: Video) => void;
  index: number;
}

export function VideoCard({ video, onPlay, onDelete, index }: VideoCardProps) {
  const { isAdmin } = useAuth();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Use custom thumbnail or a placeholder
  const hasThumbnail = video.thumbnail_url && video.thumbnail_url.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1]
      }}
      layout
    >
      <GlassCard 
        className="overflow-hidden group cursor-pointer video-card-glow"
        hover
        onClick={() => onPlay(video)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/10 overflow-hidden">
          {hasThumbnail ? (
            <motion.img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-12 h-12 sm:w-16 sm:h-16 text-primary/40" />
            </div>
          )}
          
          {/* Play overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <motion.div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg"
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground ml-1" fill="currentColor" />
            </motion.div>
          </motion.div>

          {/* Delete button for admins */}
          {isAdmin && onDelete && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(video);
              }}
              className="absolute top-2 right-2 p-2 rounded-lg bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-bold text-foreground truncate mb-2 group-hover:text-primary transition-colors text-sm sm:text-base">
            {video.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(video.created_at)}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
