import { Menu, Search, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
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
  onSearchChange
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 md:hidden bg-black/40 backdrop-blur-xl border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="p-2 text-white/70 hover:text-white bg-white/5 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img src={logo} alt="Bioteca" className="h-6 object-contain" />
        </div>

        {isAdmin && (
          <button 
            onClick={onUploadClick}
            className="p-2 text-primary bg-primary/10 rounded-xl border border-primary/20"
          >
            <Upload className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Busca simplificada para mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="search"
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
    </header>
  );
}