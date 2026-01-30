import { motion } from 'framer-motion';
import { Menu, Upload as UploadIcon, Search, X } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/bioteca_logo.png';

interface MobileHeaderProps {
  onMenuClick: () => void;
  onUploadClick?: () => void;
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
  const [showSearch, setShowSearch] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-30 glass-card m-2 rounded-2xl p-3 md:hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3">
        {/* Menu Button */}
        <motion.button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="w-5 h-5 text-foreground" />
        </motion.button>

        {/* Logo or Search */}
        {showSearch ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="search"
              placeholder="Buscar vídeos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="glass-input flex-1 py-2 text-sm"
              autoFocus
            />
            <motion.button
              onClick={() => {
                setShowSearch(false);
                onSearchChange('');
              }}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>
        ) : (
          <>
            <img src={logo} alt="Bioteca" className="h-6 flex-1" />
            
            {/* Search Button */}
            <motion.button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <Search className="w-5 h-5 text-foreground" />
            </motion.button>

            {/* Upload Button (Admin only) */}
            {isAdmin && onUploadClick && (
              <motion.button
                onClick={onUploadClick}
                className="glass-button p-2 rounded-xl"
                whileTap={{ scale: 0.9 }}
              >
                <UploadIcon className="w-5 h-5" />
              </motion.button>
            )}
          </>
        )}
      </div>
    </motion.header>
  );
}
