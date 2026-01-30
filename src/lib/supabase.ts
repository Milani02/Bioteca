import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yeqinwgmiiphrljfjqpf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcWlud2dtaWlwaHJsamZqcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MjUyOTQsImV4cCI6MjA4MDQwMTI5NH0.As2qwWMkTEzags8C8A1wIWErz_5ISl5JOyv8NIhGasw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Profile {
  id: string;
  role: 'admin' | 'comum';
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  created_at: string;
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
