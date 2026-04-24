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
  onRefreshPlaylists?: () => void; // Opcional, caso não seja usado diretamente aqui
}

export function Sidebar({
  selectedPlaylist,
  onSelectPlaylist,
  onCreatePlaylist,
  playlists
}: SidebarProps) {
  const { signOut, user, profile } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-black/40 backdrop-blur-xl border-r border-white/5 z-50">
      {/* Seção da Logo */}
      <div className="p-8 pb-4">
        <motion.img 
          src={logo} 
          alt="Bioteca" 
          className="h-8 object-contain"
          whileHover={{ scale: 1.05 }}
        />
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 mt-6 space-y-8">
        
        {/* Menu Principal */}
        <div>
          <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">
            Principal
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectPlaylist(null, 'Todos os Vídeos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                selectedPlaylist === null
                  ? 'bg-primary text-white font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]'
                  : 'text-white/50 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <Home className={`w-5 h-5 ${selectedPlaylist === null ? 'fill-current/20' : ''}`} />
              Início
            </button>
          </nav>
        </div>

        {/* Trilhas / Categorias */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              Trilhas
            </p>
            {profile?.role === 'admin' && (
              <button 
                onClick={onCreatePlaylist}
                className="text-white/30 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all"
                title="Nova Trilha"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <nav className="space-y-1">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id, playlist.title)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                  selectedPlaylist === playlist.id
                    ? 'bg-white/10 text-white font-semibold border border-white/5'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ListVideo className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{playlist.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Seção do Usuário (Rodapé da Sidebar) */}
      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider truncate">
              {profile?.role === 'admin' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>
          <button 
            onClick={signOut}
            className="text-white/40 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-full transition-all"
            title="Sair da plataforma"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}