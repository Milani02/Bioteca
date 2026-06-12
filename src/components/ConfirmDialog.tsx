import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Excluir',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/75"
            style={{ backdropFilter: 'blur(6px)' }}
            onClick={onCancel}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{
              background: 'linear-gradient(160deg, rgba(14,6,6,0.98) 0%, rgba(18,8,8,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(239,68,68,0.1)',
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

            <div className="p-7">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl" />
                </div>
              </div>

              {/* Text */}
              <div className="text-center mb-7">
                <h2 className="text-lg font-black text-white mb-2">{title}</h2>
                <p className="text-sm text-white/45 leading-relaxed">{description}</p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <motion.button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-50 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(220,38,38,0.55)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isLoading ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {confirmLabel}
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white/50 border border-white/[0.08] hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all disabled:opacity-40"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
