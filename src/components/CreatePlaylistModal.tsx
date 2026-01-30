import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePlaylistModal({ isOpen, onClose, onSuccess }: CreatePlaylistModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Digite um nome para a playlist', {
        className: 'glass-card border border-white/10'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('playlists')
        .insert({ title: title.trim() });

      if (error) throw error;

      toast.success('Playlist criada com sucesso!', {
        className: 'glass-card border border-white/10'
      });
      
      setTitle('');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Playlist creation error:', error);
      toast.error('Erro ao criar playlist: ' + error.message, {
        className: 'glass-card border border-white/10'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md glass-card rounded-3xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-bold text-xl text-foreground flex items-center gap-2">
                <FolderPlus className="w-6 h-6 text-primary" />
                Nova Playlist
              </h2>
              <motion.button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
              >
                <X className="w-5 h-5 text-foreground" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Nome da Playlist
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treinamento de Segurança"
                  className="glass-input"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !title.trim()}
                className="glass-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5" />
                    <span>Criar Playlist</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
