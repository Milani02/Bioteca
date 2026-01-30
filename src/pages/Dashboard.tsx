import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  SortAsc, 
  Upload as UploadIcon,
  Video as VideoIcon,
  Loader2
} from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Sidebar } from '@/components/Sidebar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { MobileHeader } from '@/components/MobileHeader';
import { VideoCard } from '@/components/VideoCard';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { UploadModal } from '@/components/UploadModal';
import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Video, Playlist } from '@/lib/supabase';
import { toast } from 'sonner';

type SortOption = 'newest' | 'oldest' | 'title-asc';

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('Todos os Vídeos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { loading: authLoading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Load videos when playlist changes
  useEffect(() => {
    loadVideos();
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      console.error('Error loading playlists:', error);
    }
  };

  const loadVideos = async () => {
    setLoading(true);

    try {
      let query = supabase.from('videos').select('*');

      if (selectedPlaylist) {
        // Get video IDs from playlist
        const { data: relations, error: relError } = await supabase
          .from('playlist_items')
          .select('video_id')
          .eq('playlist_id', selectedPlaylist);

        if (relError) throw relError;

        if (relations && relations.length > 0) {
          const ids = relations.map(r => r.video_id);
          query = query.in('id', ids);
        } else {
          setVideos([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar vídeos', {
        className: 'glass-card border border-white/10'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort videos
  const filteredVideos = videos
    .filter(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handlePlaylistSelect = (id: string | null, title: string) => {
    setSelectedPlaylist(id);
    setCurrentTitle(title);
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleDeleteVideo = async (video: Video) => {
    if (!confirm(`Tem certeza que deseja excluir "${video.title}"?`)) return;

    try {
      // Delete from storage if storage_path exists
      if (video.storage_path) {
        await supabase.storage.from('videos').remove([video.storage_path]);
      }

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;

      toast.success('Vídeo excluído com sucesso', {
        className: 'glass-card border border-white/10'
      });
      loadVideos();
    } catch (error: any) {
      toast.error('Erro ao excluir vídeo', {
        className: 'glass-card border border-white/10'
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <AnimatedBackground />
      
      {/* Desktop Sidebar */}
      <Sidebar
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        playlists={playlists}
        onRefreshPlaylists={loadPlaylists}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        playlists={playlists}
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-glass min-h-screen">
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={() => setIsMobileDrawerOpen(true)}
          onUploadClick={() => setIsUploadOpen(true)}
          isAdmin={isAdmin}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Desktop Header */}
        <motion.header
          className="sticky top-0 z-10 glass-card m-4 mb-0 rounded-2xl p-4 hidden md:block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Pesquisar vídeos por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-12 w-full"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="glass-input pl-10 pr-4 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="title-asc">Título A→Z</option>
              </select>
            </div>

            {/* Upload Button (Admin only) */}
            {isAdmin && (
              <motion.button
                onClick={() => setIsUploadOpen(true)}
                className="glass-button flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UploadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Novo vídeo</span>
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="p-3 sm:p-4 pt-4 sm:pt-6">
          {/* Title */}
          <motion.h1
            key={currentTitle}
            className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentTitle}
          </motion.h1>

          {/* Video Grid - Responsive */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredVideos.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredVideos.map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    index={index}
                    onPlay={handlePlayVideo}
                    onDelete={isAdmin ? handleDeleteVideo : undefined}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <VideoIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                Nenhum vídeo encontrado
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                {searchQuery 
                  ? 'Tente uma busca diferente' 
                  : 'Esta seção ainda não possui vídeos'
                }
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false);
          setSelectedVideo(null);
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadVideos}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onSuccess={loadPlaylists}
      />
    </div>
  );
}
