import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Upload, ChevronDown, LogOut, ListVideo, Plus } from 'lucide-react';
import logo from '@/assets/bioteca_logo.png';
import { Playlist } from '@/lib/supabase';

interface NavbarProps {
  playlists: Playlist[];
  isAdmin: boolean;
  onUploadClick: () => void;
  onCreatePlaylist: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userEmail: string | null;
  userRole: 'admin' | 'comum' | null;
  onSignOut: () => void;
}

export function Navbar({
  playlists,
  isAdmin,
  onUploadClick,
  onCreatePlaylist,
  searchQuery,
  onSearchChange,
  userEmail,
  userRole,
  onSignOut,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [trilhasOpen, setTrilhasOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    onSearchChange('');
  };

  const scrollToRow = (id: string) => {
    const el = document.getElementById(`row-${id}`);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
    setTrilhasOpen(false);
  };

  const initial = userEmail?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="fixed top-0 inset-x-0 z-40 hidden md:block">
      {/* Gradient bg — fades when scrolled */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)' }}
      />
      {/* Solid bg — appears when scrolled */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: 'rgba(5,5,5,0.96)', backdropFilter: 'blur(20px) saturate(160%)' }}
      />

      <div className="relative z-10 flex items-center justify-between h-16 px-10 xl:px-16">
        {/* ── Left: logo + nav ── */}
        <div className="flex items-center gap-8">
          <button onClick={closeSearch} className="flex-shrink-0">
            <img src={logo} alt="Bioteca" className="h-7 object-contain" />
          </button>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => { closeSearch(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-white/75 hover:text-white text-sm font-semibold transition-colors"
            >
              Início
            </button>

            {/* Trilhas dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setTrilhasOpen(true)}
              onMouseLeave={() => setTrilhasOpen(false)}
            >
              <button className="flex items-center gap-1 text-white/75 hover:text-white text-sm font-semibold transition-colors">
                Trilhas
                <motion.span
                  animate={{ rotate: trilhasOpen ? 180 : 0 }}
                  transition={{ duration: 0.22 }}
                  className="inline-flex"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.span>
              </button>

              <AnimatePresence>
                {trilhasOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-56 rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.85)]"
                    style={{
                      background: 'rgba(8,12,8,0.97)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(24px)',
                    }}
                  >
                    {/* Arrow */}
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                      style={{ background: 'rgba(8,12,8,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
                    />

                    <div className="pt-1.5 pb-1.5">
                      {playlists.map(playlist => (
                        <button
                          key={playlist.id}
                          onClick={() => scrollToRow(playlist.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          <ListVideo className="w-4 h-4 text-primary/60 flex-shrink-0" />
                          <span className="truncate">{playlist.title}</span>
                        </button>
                      ))}

                      {playlists.length === 0 && (
                        <p className="px-4 py-3 text-xs text-white/25 italic">Nenhuma trilha criada.</p>
                      )}

                      {isAdmin && (
                        <>
                          <div className="mx-4 my-1.5 border-t border-white/[0.06]" />
                          <button
                            onClick={() => { onCreatePlaylist(); setTrilhasOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary/70 hover:text-primary hover:bg-primary/[0.06] transition-colors"
                          >
                            <Plus className="w-4 h-4 flex-shrink-0" />
                            Nova Trilha
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* ── Right: search + upload + avatar ── */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div
                key="open"
                initial={{ width: 36 }}
                animate={{ width: 270 }}
                exit={{ width: 36 }}
                transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                className="flex items-center border border-white/15 rounded-full px-3.5 py-1.5 gap-2 overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              >
                <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="Buscar treinamentos..."
                  className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder:text-white/25 min-w-0"
                />
                <button onClick={closeSearch} className="flex-shrink-0 text-white/35 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="closed"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-white/60 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Search className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Upload */}
          {isAdmin && (
            <motion.button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                boxShadow: '0 4px 16px hsl(var(--primary) / 0.35)',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Upload className="w-3.5 h-3.5" />
              Enviar
            </motion.button>
          )}

          {/* Avatar + dropdown */}
          <div className="relative group/avatar">
            <button className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              >
                {initial}
              </div>
              <motion.span
                animate={{ rotate: 0 }}
                className="text-white/40 group-hover/avatar:text-white transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>

            <div
              className="absolute top-full right-0 mt-2 w-52 rounded-2xl py-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.8)]
                opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible
                transition-all duration-200 translate-y-1 group-hover/avatar:translate-y-0"
              style={{ background: 'rgba(8,12,8,0.97)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}
            >
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-bold text-white truncate">{userEmail?.split('@')[0]}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                  {userRole === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/45 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors mt-0.5 rounded-b-2xl"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
