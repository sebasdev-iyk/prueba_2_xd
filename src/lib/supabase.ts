import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  lives: number;
  level: number;
  xp: number;
  current_language: string;
  frog_stage: number;
  last_frog_visit: string | null;
  created_at: string;
  updated_at: string;
  origin_city?: string;
  residence_city?: string;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  language: string;
  order_index: number;
  xp_reward: number;
  icon: string;
  color: string;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  stars: number;
  completed_at: string | null;
  created_at: string;
};
