import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, ListVideo, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Playlist } from '@/lib/supabase';
import logo from '@/assets/bioteca_logo.png';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  selectedPlaylist: string | null;
  onSelectPlaylist: (id: string | null, title: string) => void;
  onCreatePlaylist: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  playlists,
  selectedPlaylist,
  onSelectPlaylist,
  onCreatePlaylist,
}: MobileDrawerProps) {
  const { signOut, user, profile } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const select = (id: string | null, title: string) => {
    onSelectPlaylist(id, title);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed top-0 left-0 bottom-0 z-50 w-[300px] flex flex-col md:hidden overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            style={{
              background:
                'linear-gradient(160deg, rgba(4,8,4,0.97) 0%, rgba(10,16,8,0.98) 100%)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(48px) saturate(160%)',
              WebkitBackdropFilter: 'blur(48px) saturate(160%)',
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-8 pb-5">
              <motion.img
                src={logo}
                alt="Bioteca"
                className="h-7 object-contain"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.4 }}
              />
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1] transition-colors"
                whileTap={{ scale: 0.88, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-5 pb-4">

              {/* Principal */}
              <div>
                <p className="px-4 text-[10px] font-bold text-white/25 uppercase tracking-[0.22em] mb-2">
                  Principal
                </p>
                <motion.button
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  onClick={() => select(null, 'Todos os Vídeos')}
                  className="relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-150 overflow-hidden"
                >
                  {selectedPlaylist === null && (
                    <motion.div
                      layoutId="drawerActive"
                      className="absolute inset-0 bg-primary rounded-2xl"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    />
                  )}
                  <Home
                    className={`relative z-10 w-5 h-5 flex-shrink-0 transition-colors ${
                      selectedPlaylist === null ? 'text-white' : 'text-white/40'
                    }`}
                  />
                  <span
                    className={`relative z-10 text-sm font-semibold transition-colors ${
                      selectedPlaylist === null ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    Início
                  </span>
                </motion.button>
              </div>

              {/* Trilhas */}
              <div>
                <div className="flex items-center justify-between px-4 mb-2">
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.22em]">
                    Trilhas
                  </p>
                  {profile?.role === 'admin' && (
                    <motion.button
                      onClick={() => { onCreatePlaylist(); onClose(); }}
                      className="text-white/30 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      title="Nova Trilha"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>

                <nav className="space-y-0.5">
                  {playlists.map((playlist, i) => (
                    <motion.button
                      key={playlist.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.045, duration: 0.35 }}
                      onClick={() => select(playlist.id, playlist.title)}
                      className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-150 overflow-hidden"
                    >
                      {selectedPlaylist === playlist.id && (
                        <motion.div
                          layoutId="drawerActive"
                          className="absolute inset-0 bg-white/8 rounded-xl border border-white/[0.08]"
                          transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                        />
                      )}
                      <ListVideo
                        className={`relative z-10 w-4 h-4 flex-shrink-0 transition-colors ${
                          selectedPlaylist === playlist.id ? 'text-white' : 'text-white/35'
                        }`}
                      />
                      <span
                        className={`relative z-10 text-sm truncate transition-colors ${
                          selectedPlaylist === playlist.id
                            ? 'text-white font-semibold'
                            : 'text-white/40'
                        }`}
                      >
                        {playlist.title}
                      </span>
                    </motion.button>
                  ))}

                  {playlists.length === 0 && (
                    <p className="px-4 py-3 text-xs text-white/20 italic">
                      Nenhuma trilha criada ainda.
                    </p>
                  )}
                </nav>
              </div>
            </div>

            {/* User footer */}
            <motion.div
              className="p-3 border-t border-white/[0.06]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
            >
              <div className="flex items-center gap-3 px-3 py-3 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg">
                  {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider">
                    {profile?.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </p>
                </div>
                <motion.button
                  onClick={signOut}
                  className="text-white/30 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-xl transition-colors"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
