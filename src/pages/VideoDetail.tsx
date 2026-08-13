import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play, ArrowLeft, Trash2, Calendar, ListVideo,
  Video as VideoIcon, Pencil, Check, X, Plus,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { videoService } from '@/services/videoService';
import { playlistService } from '@/services/playlistService';
import { supabase, Playlist, Video } from '@/lib/supabase';
import { toAppError } from '@/lib/errors';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { VideoRow } from '@/components/VideoRow';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileDrawer } from '@/components/MobileDrawer';

const VideoPlayerModal = lazy(() => import('@/components/VideoPlayerModal'));

/* ── Loading skeleton ── */
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-20 md:pt-24">
      <div className="px-4 md:px-10 xl:px-16 pb-8">
        <div className="h-4 skeleton rounded-full w-20" />
      </div>
      <div className="px-4 md:px-10 xl:px-16 flex flex-col md:flex-row gap-8 lg:gap-16">
        <div className="w-full md:w-[420px] lg:w-[520px] flex-shrink-0">
          <div className="aspect-video skeleton rounded-2xl" />
        </div>
        <div className="flex-1 pt-4 space-y-5">
          <div className="h-3 skeleton rounded-full w-28" />
          <div className="h-14 skeleton rounded-xl w-4/5" />
          <div className="h-4 skeleton rounded-full w-36" />
          <div className="h-[2px] skeleton rounded-full w-16" />
          <div className="h-12 skeleton rounded-full w-44" />
          <div className="h-px skeleton w-full mt-6" />
          <div className="h-3 skeleton rounded-full w-24" />
          <div className="h-20 skeleton rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

type EditField = 'title' | 'description' | null;

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loading: authLoading, user, isAdmin, profile, signOut } = useAuth();

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── Inline editing ── */
  const [editingField, setEditingField] = useState<EditField>(null);
  const [draftValue, setDraftValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (editingField === 'description') textareaRef.current?.focus();
    if (editingField === 'title') titleInputRef.current?.focus();
  }, [editingField]);

  /* ── Queries ── */
  const { data: allPlaylists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistService.fetchAll(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: video, isLoading, isError, refetch: refetchVideo } = useQuery({
    queryKey: ['video', id],
    queryFn: () => videoService.fetchById(id!),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      toast.error('Vídeo não encontrado');
      navigate('/dashboard');
    }
  }, [isError, navigate]);

  const { data: videoPlaylists = [] } = useQuery({
    queryKey: ['video-playlists', id],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('playlist_items')
        .select('playlist_id')
        .eq('video_id', id);

      if (!items?.length) return [] as Playlist[];

      const { data: pls } = await supabase
        .from('playlists')
        .select('*')
        .in('id', items.map(i => i.playlist_id));

      return (pls ?? []) as Playlist[];
    },
    enabled: !!id,
  });

  const { data: relatedVideos = [], refetch: refetchRelated } = useQuery({
    queryKey: ['related', id, videoPlaylists.map(p => p.id).join(',')],
    queryFn: async () => {
      if (videoPlaylists.length > 0) {
        const result = await videoService.fetchPaginated({ playlistId: videoPlaylists[0].id });
        return result.data.filter(v => v.id !== id).slice(0, 16);
      }
      const result = await videoService.fetchPaginated({ sortBy: 'newest' });
      return result.data.filter(v => v.id !== id).slice(0, 16);
    },
    enabled: !!id && videoPlaylists !== undefined,
  });

  /* ── Handlers ── */
  const startEdit = (field: EditField, current: string) => {
    setDraftValue(current);
    setEditingField(field);
  };

  const cancelEdit = () => setEditingField(null);

  const saveField = async (field: 'title' | 'description') => {
    if (!video) return;
    const trimmed = draftValue.trim();
    if (field === 'title' && !trimmed) return;

    setIsSaving(true);
    try {
      await videoService.update(video.id, {
        [field]: trimmed || null,
      });
      await refetchVideo();
      /* Invalidate list cache so Dashboard rows reflect the new title */
      if (field === 'title') {
        queryClient.invalidateQueries({ queryKey: ['videos'] });
      }
      setEditingField(null);
      toast.success(field === 'title' ? 'Título atualizado' : 'Descrição atualizada');
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    setIsDeleting(true);
    try {
      await videoService.remove(video);
      toast.success('Vídeo removido');
      navigate('/dashboard');
    } catch (err) {
      toast.error(toAppError(err).message);
      setIsDeleting(false);
    }
  };

  const handleDeleteRelated = async (v: Video) => {
    setVideoToDelete(v);
  };

  const confirmDeleteRelated = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);
    try {
      await videoService.remove(videoToDelete);
      toast.success('Vídeo removido');
      refetchRelated();
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setIsDeleting(false);
      setVideoToDelete(null);
    }
  };

  const handlePlaylistSelect = (pid: string | null, _title: string) => {
    setSelectedPlaylist(pid);
    setIsMobileDrawerOpen(false);
    setTimeout(() => navigate(pid ? `/dashboard?playlist=${pid}` : '/dashboard'), 380);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  if (authLoading || isLoading) return <DetailSkeleton />;
  if (!video) return null;

  return (
    <motion.div
      className="min-h-screen bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Navbar
        playlists={allPlaylists}
        isAdmin={isAdmin}
        onUploadClick={() => {}}
        onCreatePlaylist={() => {}}
        searchQuery=""
        onSearchChange={(q) => { if (q) navigate(`/dashboard?search=${encodeURIComponent(q)}`); }}
        userEmail={user?.email ?? null}
        userRole={profile?.role ?? null}
        onSignOut={signOut}
      />
      <MobileHeader
        onMenuClick={() => setIsMobileDrawerOpen(true)}
        onUploadClick={() => {}}
        isAdmin={isAdmin}
        searchQuery=""
        onSearchChange={(q) => { if (q) navigate(`/dashboard?search=${encodeURIComponent(q)}`); }}
      />
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        playlists={allPlaylists}
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => {}}
      />

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {video.thumbnail_url && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${video.thumbnail_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.15) saturate(130%)',
              transform: 'scale(1.15)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/25" />
      </div>

      <main className="relative z-10 pb-24">
        {/* Back */}
        <div className="px-4 md:px-10 xl:px-16 pt-20 md:pt-24 pb-8">
          <motion.button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-semibold"
            whileHover={{ x: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </motion.button>
        </div>

        {/* ── Showcase ── */}
        <section className="px-4 md:px-10 xl:px-16 flex flex-col md:flex-row gap-8 lg:gap-16 items-start max-w-7xl">

          {/* Thumbnail */}
          <motion.div
            className="w-full md:w-[400px] lg:w-[460px] xl:w-[520px] flex-shrink-0"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="aspect-video rounded-2xl overflow-hidden relative cursor-pointer group/thumb shadow-[0_40px_100px_rgba(0,0,0,0.75)]"
              onClick={() => setIsPlayerOpen(true)}
            >
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <VideoIcon className="w-16 h-16 text-white/15" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center shadow-2xl"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </motion.div>
              </div>
              <div className="absolute bottom-3 inset-x-0 flex justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 pointer-events-none">
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                  Clique para assistir
                </span>
              </div>
            </div>
          </motion.div>

          {/* Info panel */}
          <motion.div
            className="flex-1 min-w-0 pt-0 md:pt-2"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Playlist tags */}
            {videoPlaylists.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {videoPlaylists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/dashboard?playlist=${p.id}`)}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all hover:opacity-80"
                    style={{
                      background: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                      border: '1px solid hsl(var(--primary) / 0.25)',
                    }}
                  >
                    <ListVideo className="w-3 h-3 flex-shrink-0" />
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* ── Title (inline edit) ── */}
            <AnimatePresence mode="wait">
              {editingField === 'title' ? (
                <motion.div
                  key="title-edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4"
                >
                  <input
                    ref={titleInputRef}
                    value={draftValue}
                    onChange={e => setDraftValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveField('title');
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="w-full text-3xl md:text-4xl lg:text-5xl font-black text-white bg-transparent border-b-2 border-primary/50 focus:outline-none focus:border-primary pb-1 leading-tight tracking-tight"
                    maxLength={200}
                  />
                  <div className="flex gap-2 mt-3">
                    <motion.button
                      onClick={() => saveField('title')}
                      disabled={isSaving || !draftValue.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isSaving ? 'Salvando…' : 'Salvar'}
                    </motion.button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white/40 border border-white/10 hover:text-white hover:border-white/20 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="title-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group/title flex items-start gap-3 mb-4"
                >
                  <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                    {video.title}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => startEdit('title', video.title)}
                      className="mt-2 p-1.5 rounded-lg text-white/0 group-hover/title:text-white/25 hover:!text-white/70 hover:bg-white/[0.06] transition-all flex-shrink-0"
                      title="Editar título"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date */}
            <div className="flex items-center gap-2 mb-8 text-white/35">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{formatDate(video.created_at)}</span>
            </div>

            {/* Gradient divider */}
            <div
              className="w-16 h-[2px] rounded-full mb-8"
              style={{ background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))' }}
            />

            {/* Action buttons */}
            <div className="flex items-center flex-wrap gap-3 mb-10">
              <motion.button
                onClick={() => setIsPlayerOpen(true)}
                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-extrabold text-sm hover:bg-white/90 transition-colors"
                style={{ boxShadow: '0 8px 32px rgba(255,255,255,0.15)' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Play className="w-5 h-5 fill-current flex-shrink-0" />
                Assistir
              </motion.button>

              {isAdmin && (
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-sm text-white/40 border border-white/10 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/[0.06] transition-all"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </motion.button>
              )}
            </div>

            {/* ── Descrição ── */}
            <AnimatePresence>
              {(video.description || isAdmin) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.5 }}
                  className="pt-8 border-t border-white/[0.07]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[11px] font-bold text-white/35 uppercase tracking-[0.22em]">
                      Sobre este vídeo
                    </h2>
                    {isAdmin && editingField !== 'description' && (
                      <button
                        onClick={() => startEdit('description', video.description ?? '')}
                        className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                        title={video.description ? 'Editar descrição' : 'Adicionar descrição'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {editingField === 'description' ? (
                      <motion.div
                        key="desc-edit"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <textarea
                          ref={textareaRef}
                          value={draftValue}
                          onChange={e => setDraftValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                          rows={6}
                          placeholder="Descreva o conteúdo e os objetivos deste treinamento…"
                          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl p-4 text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all placeholder:text-white/20"
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => saveField('description')}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-40"
                              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                              whileTap={{ scale: 0.96 }}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {isSaving ? 'Salvando…' : 'Salvar'}
                            </motion.button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white/35 border border-white/[0.08] hover:text-white hover:border-white/20 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          </div>
                          <span className="text-[11px] text-white/20">
                            {draftValue.length}/2000
                          </span>
                        </div>
                      </motion.div>
                    ) : video.description ? (
                      <motion.p
                        key="desc-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap"
                      >
                        {video.description}
                      </motion.p>
                    ) : (
                      <motion.button
                        key="desc-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => startEdit('description', '')}
                        className="flex items-center gap-2 text-sm text-white/20 hover:text-primary/60 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar descrição
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ── Relacionados ── */}
        {relatedVideos.length > 0 && (
          <motion.div
            className="mt-16 md:mt-20"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <VideoRow
              title={
                videoPlaylists.length > 0
                  ? `Mais em "${videoPlaylists[0].title}"`
                  : 'Outros Treinamentos'
              }
              videos={relatedVideos}
              onDelete={isAdmin ? handleDeleteRelated : undefined}
            />
          </motion.div>
        )}
      </main>

      <Suspense fallback={null}>
        <VideoPlayerModal
          video={video}
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
        />
      </Suspense>

      {/* Confirm delete — vídeo principal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Excluir vídeo"
        description={`"${video.title}" será removido permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir vídeo"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Confirm delete — vídeo relacionado */}
      <ConfirmDialog
        isOpen={!!videoToDelete}
        title="Excluir vídeo"
        description={`"${videoToDelete?.title ?? ''}" será removido permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir vídeo"
        isLoading={isDeleting}
        onConfirm={confirmDeleteRelated}
        onCancel={() => setVideoToDelete(null)}
      />
    </motion.div>
  );
}
