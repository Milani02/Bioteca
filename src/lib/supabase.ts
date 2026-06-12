import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Profile {
  id: string;
  role: 'admin' | 'comum';
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface VideoInsert {
  title: string;
  description?: string | null;
  url: string;
  storage_path: string | null;
  thumbnail_url: string | null;
}

export interface Playlist {
  id: string;
  title: string;
  created_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
}
