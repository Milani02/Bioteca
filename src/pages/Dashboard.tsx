import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  SortAsc, 
  Upload as UploadIcon,
  Video as VideoIcon,
  Loader2,
  Play,
  Info
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

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  // Carregar playlists ao montar o componente
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Recarregar vídeos quando a playlist selecionada mudar
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
      console.error('Erro ao carregar trilhas:', error);
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('videos').select('*');

      if (selectedPlaylist) {
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
    } finally {
      setLoading(false);
    }
  };

  // Memoização da filtragem e ordenação (só recalcula se vídeos, busca ou ordenação mudarem)
  const filteredVideos = useMemo(() => {
    return videos
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
  }, [videos, searchQuery, sortOption]);

  // Memoização do vídeo de destaque
  const featuredVideo = useMemo(() => {
    return filteredVideos.length > 0 
      ? [...filteredVideos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
      : null;
  }, [filteredVideos]);

  const handlePlaylistSelect = useCallback((id: string | null, title: string) => {
    setSelectedPlaylist(id);
    setCurrentTitle(title);
  }, []);

  const handlePlayVideo = useCallback((video: Video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  }, []);

  const handleDeleteVideo = async (video: Video) => {
    if (!confirm(`Tem certeza que deseja excluir "${video.title}"?`)) return;
    try {
      if (video.storage_path) {
        await supabase.storage.from('videos').remove([video.storage_path]);
      }
      const { error } = await supabase.from('videos').delete().eq('id', video.id);
      if (error) throw error;
      toast.success('Vídeo removido');
      loadVideos();
    } catch (error: any) {
      toast.error('Erro ao excluir vídeo');
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
    <div className="min-h-screen flex relative bg-black">
      <AnimatedBackground />
      
      <Sidebar
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        playlists={playlists}
        onRefreshPlaylists={loadPlaylists}
      />

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        playlists={playlists}
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
      />

      <main className="flex-1 overflow-y-auto scrollbar-glass min-h-screen pb-20">
        <MobileHeader
          onMenuClick={() => setIsMobileDrawerOpen(true)}
          onUploadClick={() => setIsUploadOpen(true)}
          isAdmin={isAdmin}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Cabeçalho Flutuante para Desktop */}
        <motion.header
          className="sticky top-4 z-50 glass-card mx-4 mt-4 mb-0 rounded-full px-6 py-3 hidden md:flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="search"
              placeholder="Pesquisar treinamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:outline-none pl-12 py-2 placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-white/5 border border-white/10 text-white text-sm rounded-full pl-10 pr-4 py-2 appearance-none cursor-pointer hover:bg-white/10"
              >
                <option value="newest" className="bg-zinc-900">Mais recentes</option>
                <option value="oldest" className="bg-zinc-900">Mais antigos</option>
                <option value="title-asc" className="bg-zinc-900">Título A→Z</option>
              </select>
            </div>

            {isAdmin && (
              <motion.button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90"
                whileHover={{ scale: 1.05 }}
              >
                <UploadIcon className="w-4 h-4" />
                <span>Novo Vídeo</span>
              </motion.button>
            )}
          </div>
        </motion.header>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Secção Hero (Destaque Cinematográfico) */}
            {!searchQuery && featuredVideo && (
              <div className="relative w-full h-[45vh] md:h-[65vh] min-h-[380px] md:min-h-[500px] mb-8 md:mb-12 shadow-2xl">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity duration-700"
                  style={{ 
                    backgroundImage: featuredVideo.thumbnail_url 
                      ? `url(${featuredVideo.thumbnail_url})` 
                      : 'url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070")' 
                  }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent md:w-3/4" />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl z-10"
                >
                  <h1 className="text-3xl md:text-7xl font-black mb-3 md:mb-5 tracking-tight text-white drop-shadow-2xl">
                    {featuredVideo.title}
                  </h1>
                  
                  <p className="text-gray-300 text-sm md:text-xl mb-8 max-w-2xl drop-shadow-md line-clamp-2 md:line-clamp-3 font-light">
                    {featuredVideo.description || "Assista agora a este conteúdo exclusivo."}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handlePlayVideo(featuredVideo)}
                      className="group flex items-center gap-3 px-6 md:px-10 py-3 md:py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-xl"
                    >
                      <Play className="w-5 h-5 fill-current" /> 
                      Assistir Agora
                    </button>
                    
                    <button className="flex items-center gap-2 px-6 md:px-10 py-3 md:py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-semibold border border-white/10 hover:bg-white/20 transition-all">
                      <Info className="w-5 h-5" /> 
                      Detalhes
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Grelha de Vídeos sem o layout pesado */}
            <div className="px-4 md:px-12 pt-4">
              <div className="flex items-center justify-between mb-8 border-l-4 border-primary pl-4">
                <h2 className="text-xl md:text-4xl font-black text-white tracking-tight uppercase">
                  {searchQuery ? `Busca: ${searchQuery}` : currentTitle}
                </h2>
              </div>

              {filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  <AnimatePresence>
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
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl mx-auto max-w-2xl border border-white/5">
                  <VideoIcon className="w-16 h-16 text-white/20 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Sem resultados</h3>
                  <p className="text-white/40">Não encontramos nenhum vídeo para esta seleção.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false);
          setSelectedVideo(null);
        }}
      />

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={loadVideos} />
      <CreatePlaylistModal isOpen={isCreatePlaylistOpen} onClose={() => setIsCreatePlaylistOpen(false)} onSuccess={loadPlaylists} />
    </div>
  );
}