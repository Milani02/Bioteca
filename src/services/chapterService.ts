import { supabase, VideoChapter, VideoChapterInsert } from '@/lib/supabase';
import { AppError } from '@/lib/errors';

export const chapterService = {
  async fetchByVideoId(videoId: string): Promise<VideoChapter[]> {
    const { data, error } = await supabase
      .from('video_chapters')
      .select('*')
      .eq('video_id', videoId)
      .order('start_time_seconds', { ascending: true });

    if (error) throw new AppError('Erro ao buscar capítulos', error.code, error);
    return (data ?? []) as VideoChapter[];
  },

  async insert(chapter: VideoChapterInsert): Promise<VideoChapter> {
    const { data, error } = await supabase
      .from('video_chapters')
      .insert(chapter)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Já existe um capítulo nesse instante do vídeo', error.code, error);
      }
      throw new AppError('Erro ao salvar capítulo', error.code, error);
    }
    return data as VideoChapter;
  },

  async update(
    id: string,
    fields: Partial<Pick<VideoChapter, 'title' | 'start_time_seconds'>>
  ): Promise<VideoChapter> {
    const { data, error } = await supabase
      .from('video_chapters')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Já existe um capítulo nesse instante do vídeo', error.code, error);
      }
      throw new AppError('Erro ao atualizar capítulo', error.code, error);
    }
    return data as VideoChapter;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('video_chapters').delete().eq('id', id);
    if (error) throw new AppError('Erro ao excluir capítulo', error.code, error);
  },
};
