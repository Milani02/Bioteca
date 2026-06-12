import { motion } from 'framer-motion';
import { Home, ListVideo, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Playlist } from '@/lib/supabase';
import logo from '@/assets/bioteca_logo.png';

interface SidebarProps {
  selectedPlaylist: string | null;
  onSelectPlaylist: (id: string | null, title: string) => void;
  onCreatePlaylist: () => void;
  playlists: Playlist[];
  onRefreshPlaylists?: () => void;
}

export function Sidebar({
  selectedPlaylist,
  onSelectPlaylist,
  onCreatePlaylist,
  playlists,
}: SidebarProps) {
  const { signOut, user, profile } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-black/50 backdrop-blur-2xl border-r border-white/[0.06] z-50">
      {/* Logo */}
      <div className="px-8 pt-8 pb-6">
        <motion.img
          src={logo}
          alt="Bioteca"
          className="h-8 object-contain"
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 400 }}
        />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-6">

        {/* Principal */}
        <div>
          <p className="px-4 text-[10px] font-bold text-white/25 uppercase tracking-[0.22em] mb-2">
            Principal
          </p>
          <button
            onClick={() => onSelectPlaylist(null, 'Todos os Vídeos')}
            className="relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-150 overflow-hidden"
          >
            {selectedPlaylist === null && (
              <motion.div
                layoutId="sidebarActive"
                className="absolute inset-0 bg-primary rounded-2xl"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Home
              className={`relative z-10 w-5 h-5 transition-colors ${
                selectedPlaylist === null ? 'text-white' : 'text-white/40'
              }`}
            />
            <span
              className={`relative z-10 text-sm font-semibold transition-colors ${
                selectedPlaylist === null ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Início
            </span>
          </button>
        </div>

        {/* Trilhas */}
        <div>
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.22em]">
              Trilhas
            </p>
            {profile?.role === 'admin' && (
              <motion.button
                onClick={onCreatePlaylist}
                className="text-white/30 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Nova Trilha"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>

          <nav className="space-y-0.5">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id, playlist.title)}
                className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-150 overflow-hidden"
              >
                {selectedPlaylist === playlist.id && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="absolute inset-0 bg-white/8 rounded-xl border border-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
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
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {playlist.title}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* User footer */}
      <div className="p-3 mt-auto">
        <div className="flex items-center gap-3 px-3 py-3 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg">
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
