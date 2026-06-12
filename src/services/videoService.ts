import { supabase, Video, VideoInsert } from '@/lib/supabase';
import { AppError } from '@/lib/errors';

export type SortOption = 'newest' | 'oldest' | 'title-asc';

export interface VideoFilters {
  search?: string;
  playlistId?: string | null;
  sortBy?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedVideos {
  data: Video[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const videoService = {
  async fetchPaginated(filters: VideoFilters = {}): Promise<PaginatedVideos> {
    const { search, playlistId, sortBy = 'newest', page = 1, pageSize = 50 } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let videoIds: string[] | null = null;
    if (playlistId) {
      const { data: relations, error: relError } = await supabase
        .from('playlist_items')
        .select('video_id')
        .eq('playlist_id', playlistId);

      if (relError) throw new AppError('Erro ao buscar itens da playlist', relError.code, relError);
      if (!relations || relations.length === 0) {
        return { data: [], count: 0, page, pageSize, totalPages: 0 };
      }
      videoIds = relations.map((r) => r.video_id as string);
    }

    let query = supabase.from('videos').select('*', { count: 'exact' });

    if (search?.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    if (videoIds) {
      query = query.in('id', videoIds);
    }

    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title-asc':
        query = query.order('title', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new AppError('Erro ao buscar vídeos', error.code, error);

    const total = count ?? 0;
    return {
      data: (data ?? []) as Video[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async fetchById(id: string): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new AppError('Vídeo não encontrado', error.code, error);
    return data as Video;
  },

  async insert(video: VideoInsert): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .insert(video)
      .select()
      .single();

    if (error) throw new AppError('Erro ao salvar vídeo', error.code, error);
    return data as Video;
  },

  async update(id: string, fields: Partial<Pick<Video, 'title' | 'description'>>): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Erro ao atualizar vídeo', error.code, error);
    return data as Video;
  },

  async remove(video: Video): Promise<void> {
    if (video.storage_path) {
      await supabase.storage.from('videos').remove([video.storage_path]);
    }

    const { error } = await supabase.from('videos').delete().eq('id', video.id);
    if (error) throw new AppError('Erro ao excluir vídeo', error.code, error);
  },
};
