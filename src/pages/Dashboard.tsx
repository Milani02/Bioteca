import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // [CRÍTICO] Adicionado React Query
import { 
  Search, SortAsc, Upload as UploadIcon, Video as VideoIcon, 
  Loader2, Play, Info 
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { MobileHeader } from '@/components/MobileHeader';
import { VideoCard } from '@/components/VideoCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Video } from '@/lib/supabase';
import { toast } from 'sonner';

// [CRÍTICO] Componentes pesados agora são Lazy Loaded
const AnimatedBackground = lazy(() => import('@/components/AnimatedBackground'));
const VideoPlayerModal = lazy(() => import('@/components/VideoPlayerModal'));
const UploadModal = lazy(() => import('@/components/UploadModal').then(m => ({ default: m.UploadModal })));
const CreatePlaylistModal = lazy(() => import('@/components/CreatePlaylistModal').then(m => ({ default: m.CreatePlaylistModal })));

type SortOption = 'newest' | 'oldest' | 'title-asc';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // [CRÍTICO] Debounce
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('Todos os Vídeos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Controles de Modais
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { loading: authLoading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  // [CRÍTICO] Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // [CRÍTICO] React Query para Playlists (Cache Inteligente)
  const { data: playlists = [], refetch: refetchPlaylists } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const { data, error } = await supabase.from('playlists').select('*').order('title', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // [CRÍTICO] React Query para Vídeos (Evita queries sequenciais repetidas)
  const { data: videos = [], isLoading: videosLoading, refetch: refetchVideos } = useQuery({
    queryKey: ['videos', selectedPlaylist],
    queryFn: async () => {
      let query = supabase.from('videos').select('*');
      if (selectedPlaylist) {
        const { data: relations } = await supabase.from('playlist_items').select('video_id').eq('playlist_id', selectedPlaylist);
        if (relations && relations.length > 0) {
          query = query.in('id', relations.map(r => r.video_id));
        } else {
          return [];
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // [CRÍTICO] Memoização aplicada ao valor com Debounce (e não recalculando a cada tecla)
  const filteredVideos = useMemo(() => {
    return videos
      .filter(video => 
        video.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortOption) {
          case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'title-asc': return a.title.localeCompare(b.title);
          case 'newest': default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [videos, debouncedSearch, sortOption]);

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
      await supabase.from('videos').delete().eq('id', video.id);
      toast.success('Vídeo removido');
      refetchVideos();
    } catch (error) {
      toast.error('Erro ao excluir vídeo');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative bg-black">
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>
      
      <Sidebar
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        playlists={playlists}
        onRefreshPlaylists={refetchPlaylists}
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
          onSearchChange={setSearchQuery} // A UI continua responsiva, mas a filtragem é debounced
        />

        {/* Header Desktop */}
        <header className="sticky top-4 z-40 glass-card mx-4 mt-4 mb-0 rounded-full px-6 py-3 hidden md:flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-md bg-black/40">
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
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-transform hover:scale-105"
              >
                <UploadIcon className="w-4 h-4" />
                <span>Novo Vídeo</span>
              </button>
            )}
          </div>
        </header>

        {videosLoading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            {!debouncedSearch && featuredVideo && (
              <div className="relative w-full h-[45vh] md:h-[65vh] min-h-[380px] md:min-h-[500px] mb-8 md:mb-12 shadow-2xl">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-60"
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
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl z-10"
                >
                  <h1 className="text-3xl md:text-7xl font-black mb-3 md:mb-5 tracking-tight text-white drop-shadow-2xl">
                    {featuredVideo.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-8">
                    <button 
                      onClick={() => handlePlayVideo(featuredVideo)}
                      className="group flex items-center gap-3 px-6 md:px-10 py-3 md:py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-xl"
                    >
                      <Play className="w-5 h-5 fill-current" /> Assistir Agora
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Grelha de Vídeos */}
            <div className="px-4 md:px-12 pt-4">
              <div className="flex items-center justify-between mb-8 border-l-4 border-primary pl-4">
                <h2 className="text-xl md:text-4xl font-black text-white tracking-tight uppercase">
                  {debouncedSearch ? `Busca: ${debouncedSearch}` : currentTitle}
                </h2>
              </div>

              {filteredVideos.length > 0 ? (
                // [CRÍTICO] Retirado AnimatePresence e motion.div em listas, trocado por grid CSS padrão.
                // Se desejar virtualização total futuramente, a base da grid já está renderizando muito mais rápido.
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredVideos.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      index={index}
                      onPlay={handlePlayVideo}
                      onDelete={isAdmin ? handleDeleteVideo : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl mx-auto max-w-2xl border border-white/5">
                  <VideoIcon className="w-16 h-16 text-white/20 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Sem resultados</h3>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Lazy Loaded Modals isolados do ciclo de renderização do Dashboard */}
      <Suspense fallback={null}>
        {isPlayerOpen && (
          <VideoPlayerModal
            video={selectedVideo}
            isOpen={isPlayerOpen}
            onClose={() => {
              setIsPlayerOpen(false);
              setSelectedVideo(null);
            }}
          />
        )}
        
        {isUploadOpen && (
          <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={refetchVideos} />
        )}

        {isCreatePlaylistOpen && (
          <CreatePlaylistModal isOpen={isCreatePlaylistOpen} onClose={() => setIsCreatePlaylistOpen(false)} onSuccess={refetchPlaylists} />
        )}
      </Suspense>
    </div>
  );
}