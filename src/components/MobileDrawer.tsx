import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Folder, 
  FolderOpen, 
  LogOut, 
  Video,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Playlist } from '@/lib/supabase';
import logo from '@/assets/bioteca_logo.png';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  selectedPlaylist: string | null;
  onSelectPlaylist: (id: string | null, title: string) => void;
  onCreatePlaylist?: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  playlists,
  selectedPlaylist,
  onSelectPlaylist,
  onCreatePlaylist
}: MobileDrawerProps) {
  const { profile, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleSelectPlaylist = (id: string | null, title: string) => {
    onSelectPlaylist(id, title);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-72 glass-sidebar flex flex-col md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <img src={logo} alt="Bioteca" className="h-8" />
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-foreground" />
              </motion.button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto scrollbar-glass">
              {/* All Videos */}
              <motion.button
                onClick={() => handleSelectPlaylist(null, 'Todos os Vídeos')}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                  selectedPlaylist === null 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-white/10 text-foreground'
                )}
                whileTap={{ scale: 0.98 }}
              >
                <Video className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold truncate">Todos os Vídeos</span>
              </motion.button>

              {/* Playlists Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Playlists
                  </span>
                  {isAdmin && onCreatePlaylist && (
                    <motion.button
                      onClick={() => {
                        onCreatePlaylist();
                        onClose();
                      }}
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
                      onClick={() => handleSelectPlaylist(playlist.id, playlist.title)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                        selectedPlaylist === playlist.id 
                          ? 'bg-primary/20 text-primary' 
                          : 'hover:bg-white/10 text-foreground'
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      {selectedPlaylist === playlist.id ? (
                        <FolderOpen className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <Folder className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{playlist.title}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="text-xs font-bold text-primary mb-3">
                PERFIL: {profile?.role === 'admin' ? 'ADMIN' : 'COMUM'}
              </div>
              
              <motion.button
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors w-full"
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Sair</span>
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
