import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileVideo, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { supabase, Playlist } from '@/lib/supabase';
import { toast } from 'sonner';
// [NOVO] Importar o TUS
import * as tus from 'tus-js-client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  // ... (seus estados permanecem iguais)
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');

  // ... (seus useEffects e loadPlaylists permanecem iguais)
  useEffect(() => { if (isOpen) loadPlaylists(); }, [isOpen]);
  useEffect(() => {
    if (thumbnailFile) {
      const url = URL.createObjectURL(thumbnailFile);
      setThumbnailPreview(url);
      return () => URL.revokeObjectURL(url);
    } else { setThumbnailPreview(null); }
  }, [thumbnailFile]);

  const loadPlaylists = async () => {
    const { data } = await supabase.from('playlists').select('*').order('title', { ascending: true });
    if (data) setPlaylists(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !videoFile) {
      toast.error('Preencha o título e selecione um vídeo');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const videoExt = videoFile.name.split('.').pop();
      const videoFileName = `${timestamp}.${videoExt}`;
      
      // 1. Pegar a sessão para autenticar o upload TUS
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      // 2. Configurar Upload Resumível (TUS) para o vídeo
      setUploadStep('Enviando vídeo (Otimizado)...');
      
      // Precisamos do Project ID para montar a URL do TUS
      // O supabaseUrl geralmente é algo como https://xyz.supabase.co
      const projectId = import.meta.env.VITE_SUPABASE_URL 
        ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
        : ''; // Fallback ou ajuste conforme suas env vars

      if (!projectId) throw new Error("Supabase URL não configurada");

      const upload = new tus.Upload(videoFile, {
        endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'false', // ou 'true' se quiser sobrescrever
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Limpa cache de uploads antigos
        metadata: {
          bucketName: 'videos',
          objectName: videoFileName,
          contentType: videoFile.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024, // Upload em pedaços de 6MB (Evita o erro 544)
        onError: function (error) {
          console.error('Failed because: ' + error);
          toast.error('Falha no upload do vídeo: ' + error);
          setUploading(false);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          const percentage = ((bytesUploaded / bytesTotal) * 100);
          // O vídeo é a parte mais pesada, então vamos usar 0-90% para ele
          setProgress(Math.round(percentage * 0.9));
        },
        onSuccess: async function () {
          try {
            // O upload do vídeo terminou, agora seguimos com o resto
            
            // Get video public URL
            const { data: videoUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(videoFileName);

            // Step 2: Upload thumbnail (Esse é pequeno, pode usar o método padrão)
            let thumbnailUrl: string | null = null;
            if (thumbnailFile) {
              setUploadStep('Enviando thumbnail...');
              const thumbExt = thumbnailFile.name.split('.').pop();
              const thumbFileName = `${timestamp}.${thumbExt}`;
              
              const { error: thumbUploadError } = await supabase.storage
                .from('thumbnails')
                .upload(thumbFileName, thumbnailFile);

              if (!thumbUploadError) {
                const { data: thumbUrlData } = supabase.storage
                  .from('thumbnails')
                  .getPublicUrl(thumbFileName);
                thumbnailUrl = thumbUrlData.publicUrl;
              }
            }

            setProgress(95);

            // Step 3: Insert video record
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

            if (insertError) throw insertError;

            // Step 4: Link to playlist
            if (selectedPlaylist && insertedVideo) {
              await supabase
                .from('playlist_items')
                .insert({
                  playlist_id: selectedPlaylist,
                  video_id: insertedVideo.id
                });
            }

            setProgress(100);
            toast.success('Vídeo publicado com sucesso!');
            resetForm();
            onSuccess();
            onClose();
          } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao salvar dados');
          } finally {
            setUploading(false);
          }
        },
      });

      // Iniciar o upload TUS
      upload.start();

    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message);
      setUploading(false);
    }
  };

  // ... (o resto do componente: resetForm, handleClose e o return JSX permanecem iguais)
  // Certifique-se apenas de que a renderização do formulário está igual
  
  // (Omitindo o JSX aqui pois ele não precisa mudar, apenas a lógica do handleSubmit)
  
  // ...
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
      // ... Seu JSX original aqui ...
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