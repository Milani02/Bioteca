import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderOpen, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Playlist } from '@/lib/supabase';
import logo from '@/assets/bioteca_logo.png';

interface SidebarProps {
  selectedPlaylist: string | null;
  onSelectPlaylist: (id: string | null, title: string) => void;
  onCreatePlaylist?: () => void;
}

export function Sidebar({ selectedPlaylist, onSelectPlaylist, onCreatePlaylist }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { profile, signOut, isAdmin } = useAuth();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    const { data } = await supabase
      .from('playlists')
      .select('*')
      .order('title', { ascending: true });
    
    if (data) {
      setPlaylists(data);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <motion.aside
      className={cn(
        'glass-sidebar h-screen flex flex-col transition-all duration-300 relative',
        collapsed ? 'w-20' : 'w-64'
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-foreground" />
        )}
      </button>

      {/* Logo */}
      <div className={cn(
        'p-6 border-b border-white/10',
        collapsed && 'p-4'
      )}>
        <motion.img
          src={logo}
          alt="Bioteca"
          className={cn(
            'transition-all duration-300',
            collapsed ? 'h-8' : 'h-10'
          )}
          whileHover={{ scale: 1.05 }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-glass">
        {/* All Videos */}
        <motion.button
          onClick={() => onSelectPlaylist(null, 'Todos os Vídeos')}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
            selectedPlaylist === null 
              ? 'bg-primary/20 text-primary' 
              : 'hover:bg-white/10 text-foreground'
          )}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Video className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold truncate"
              >
                Todos os Vídeos
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Playlists Section */}
        <div className="mt-6">
          <div className={cn(
            'flex items-center justify-between mb-3',
            collapsed && 'justify-center'
          )}>
            {!collapsed && (
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Playlists
              </span>
            )}
            {isAdmin && !collapsed && onCreatePlaylist && (
              <motion.button
                onClick={onCreatePlaylist}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            )}
          </div>

          <div className="space-y-1">
            {playlists.map((playlist) => (
              <motion.button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id, playlist.title)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                  selectedPlaylist === playlist.id 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-white/10 text-foreground'
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedPlaylist === playlist.id ? (
                  <FolderOpen className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <Folder className="w-5 h-5 flex-shrink-0" />
                )}
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium truncate"
                    >
                      {playlist.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={cn(
        'p-4 border-t border-white/10',
        collapsed && 'p-3'
      )}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-bold text-primary mb-3"
          >
            PERFIL: {profile?.role === 'admin' ? 'ADMIN' : 'COMUM'}
          </motion.div>
        )}
        
        <motion.button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors',
            collapsed && 'w-full justify-center'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-semibold">Sair</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
