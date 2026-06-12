import { motion } from 'framer-motion';
import { Menu, Search, Upload } from 'lucide-react';
import logo from '@/assets/bioteca_logo.png';

interface MobileHeaderProps {
  onMenuClick: () => void;
  onUploadClick: () => void;
  isAdmin: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MobileHeader({
  onMenuClick,
  onUploadClick,
  isAdmin,
  searchQuery,
  onSearchChange,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 md:hidden bg-black/60 backdrop-blur-2xl border-b border-white/[0.06] px-4 py-3">
      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        {/* Menu + logo */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onMenuClick}
            className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors"
            whileTap={{ scale: 0.88 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <img src={logo} alt="Bioteca" className="h-6 object-contain" />
        </div>

        {/* Upload (admin) */}
        {isAdmin && (
          <motion.button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
              boxShadow: '0 4px 14px hsl(var(--primary) / 0.4)',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </motion.button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
        <input
          type="search"
          placeholder="Pesquisar treinamentos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white/[0.05] border border-white/[0.08] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all placeholder:text-white/25"
        />
      </div>
    </header>
  );
}
