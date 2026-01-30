import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileVideo, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { supabase, Playlist } from '@/lib/supabase';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  useEffect(() => {
    // Create preview URL for thumbnail
    if (thumbnailFile) {
      const url = URL.createObjectURL(thumbnailFile);
      setThumbnailPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);

  const loadPlaylists = async () => {
    const { data } = await supabase
      .from('playlists')
      .select('*')
      .order('title', { ascending: true });
    
    if (data) {
      setPlaylists(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !videoFile) {
      toast.error('Preencha o título e selecione um vídeo', {
        className: 'glass-card border border-white/10'
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const timestamp = Date.now();
      
      // Step 1: Upload video
      setUploadStep('Enviando vídeo...');
      const videoExt = videoFile.name.split('.').pop();
      const videoFileName = `${timestamp}.${videoExt}`;
      
      const { error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (videoUploadError) {
        throw new Error(`Erro ao enviar vídeo: ${videoUploadError.message}`);
      }

      setProgress(40);

      // Get video public URL
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);

      // Step 2: Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        setUploadStep('Enviando thumbnail...');
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbFileName = `${timestamp}.${thumbExt}`;
        
        const { error: thumbUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (thumbUploadError) {
          console.warn('Thumbnail upload failed:', thumbUploadError);
          // Continue without thumbnail
        } else {
          const { data: thumbUrlData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbFileName);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      setProgress(70);

      // Step 3: Insert video record with storage_path and thumbnail_url
      setUploadStep('Salvando registro...');
      const { data: insertedVideo, error: insertError } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          url: videoUrlData.publicUrl,
          storage_path: videoFileName,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erro ao salvar vídeo: ${insertError.message}`);
      }

      setProgress(85);

      // Step 4: Link to playlist if selected
      if (selectedPlaylist && insertedVideo) {
        setUploadStep('Vinculando à playlist...');
        const { error: linkError } = await supabase
          .from('playlist_items')
          .insert({
            playlist_id: selectedPlaylist,
            video_id: insertedVideo.id
          });

        if (linkError) {
          console.warn('Failed to link to playlist:', linkError);
        }
      }

      setProgress(100);
      toast.success('Vídeo publicado com sucesso!', {
        className: 'glass-card border border-white/10'
      });
      
      // Reset form
      resetForm();
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao fazer upload', {
        className: 'glass-card border border-white/10'
      });
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadStep('');
    }
  };

  const resetForm = () => {
    setTitle('');
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setSelectedPlaylist('');
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
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
            className="relative z-10 w-full max-w-lg glass-card rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-glass"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-glass-bg backdrop-blur-2xl">
              <h2 className="font-bold text-lg sm:text-xl text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                Publicar Vídeo
              </h2>
              <motion.button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                disabled={uploading}
              >
                <X className="w-5 h-5 text-foreground" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Título do Vídeo *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treinamento de Segurança"
                  className="glass-input"
                  disabled={uploading}
                />
              </div>

              {/* Playlist Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Playlist (opcional)
                </label>
                <div className="relative">
                  <select
                    value={selectedPlaylist}
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                    className="glass-input appearance-none pr-10 cursor-pointer"
                    disabled={uploading}
                  >
                    <option value="">Sem playlist</option>
                    {playlists.map((playlist) => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Video File Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Arquivo de Vídeo *
                </label>
                <label 
                  className={`
                    flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed 
                    rounded-2xl cursor-pointer transition-all duration-200
                    ${videoFile 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-white/5'
                    }
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={uploading}
                  />
                  {videoFile ? (
                    <>
                      <FileVideo className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3" />
                      <span className="text-foreground font-medium truncate max-w-full text-sm sm:text-base text-center px-2">
                        {videoFile.name}
                      </span>
                      <span className="text-muted-foreground text-xs sm:text-sm mt-1">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3" />
                      <span className="text-foreground font-medium text-sm sm:text-base">
                        Clique para selecionar
                      </span>
                      <span className="text-muted-foreground text-xs sm:text-sm mt-1">
                        MP4, MOV, AVI (máx. 500MB)
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Thumbnail / Capa (opcional)
                </label>
                <label 
                  className={`
                    flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed 
                    rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden
                    ${thumbnailFile 
                      ? 'border-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-white/5'
                    }
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={uploading}
                  />
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-video">
                      <img 
                        src={thumbnailPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                        <span className="text-white font-medium text-sm">Trocar imagem</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2" />
                      <span className="text-foreground font-medium text-sm">
                        Adicionar capa
                      </span>
                      <span className="text-muted-foreground text-xs mt-1">
                        JPG, PNG, WEBP
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{uploadStep}</span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={uploading || !title.trim() || !videoFile}
                className="glass-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.98 }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Publicar Vídeo</span>
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
