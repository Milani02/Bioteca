import { supabase, Playlist } from '@/lib/supabase';
import { AppError } from '@/lib/errors';

export const playlistService = {
  async fetchAll(): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw new AppError('Erro ao buscar playlists', error.code, error);
    return (data ?? []) as Playlist[];
  },

  async create(title: string): Promise<Playlist> {
    const { data, error } = await supabase
      .from('playlists')
      .insert({ title: title.trim() })
      .select()
      .single();

    if (error) throw new AppError('Erro ao criar playlist', error.code, error);
    return data as Playlist;
  },

  async addVideo(playlistId: string, videoId: string): Promise<void> {
    const { error } = await supabase
      .from('playlist_items')
      .insert({ playlist_id: playlistId, video_id: videoId });

    if (error) throw new AppError('Erro ao adicionar vídeo à playlist', error.code, error);
  },

  async fetchAllItems(): Promise<{ playlist_id: string; video_id: string }[]> {
    const { data, error } = await supabase
      .from('playlist_items')
      .select('playlist_id, video_id');

    if (error) throw new AppError('Erro ao buscar itens das playlists', error.code, error);
    return data ?? [];
  },
};
