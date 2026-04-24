import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Home, ListVideo, Plus, LogOut } from 'lucide-react';
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
  onCreatePlaylist
}: MobileDrawerProps) {
  const { signOut, user, profile } = useAuth();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] bg-zinc-950 border-r border-white/5 p-0 text-white">
        <div className="flex flex-col h-full bg-black/60 backdrop-blur-2xl">
          <SheetHeader className="p-6 pb-2 text-left">
            <img src={logo} alt="Bioteca" className="h-6 w-fit mb-4" />
            <SheetTitle className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
              Navegação
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-6 mt-4">
            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectPlaylist(null, 'Todos os Vídeos');
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  selectedPlaylist === null
                    ? 'bg-primary text-white font-bold'
                    : 'text-white/50'
                }`}
              >
                <Home className="w-5 h-5" />
                Início
              </button>
            </nav>

            <div>
              <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">
                Trilhas
              </p>
              <nav className="space-y-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      onSelectPlaylist(playlist.id, playlist.title);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                      selectedPlaylist === playlist.id
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-white/50'
                    }`}
                  >
                    <ListVideo className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{playlist.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="p-4 mt-auto border-t border-white/5">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user?.email?.split('@')[0]}</p>
              </div>
              <button onClick={signOut} className="text-white/40 hover:text-red-400">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}