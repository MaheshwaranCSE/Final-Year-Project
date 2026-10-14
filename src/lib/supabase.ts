import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { apiAuth } from './apiAuth';
import { analyzeMedia } from './aiDetection';
import { AI_DETECTION_THRESHOLD } from '../config/policy';

// ─── Real Supabase Client Configuration ──────────────────────────────────────
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://esjztdqvadqjtlevcuab.supabase.co';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XiLFFM5tbIgBYjvB9WOoOA_GOFs1BaK';

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = 'user' | 'police' | 'doctor' | 'court' | 'admin' | 'investigator';

// ─── Mock Users ───────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  // Admins
  { id: 'ADM-00001', email: 'ADM-00001', password: 'BlockVault@Adm01!', role: 'admin' as Role, name: 'Admin 01', status: 'active', createdAt: new Date().toISOString() },
  { id: 'ADM-00002', email: 'ADM-00002', password: 'BlockVault@Adm02!', role: 'admin' as Role, name: 'Admin 02', status: 'active', createdAt: new Date().toISOString() },
  
  // Court
  { id: 'CRT-00001', email: 'CRT-00001', password: 'BlockVault@Crt01!', role: 'court' as Role, name: 'Court 01', status: 'active', createdAt: new Date().toISOString() },
  { id: 'CRT-00002', email: 'CRT-00002', password: 'BlockVault@Crt02!', role: 'court' as Role, name: 'Court 02', status: 'active', createdAt: new Date().toISOString() },
  { id: 'CRT-00003', email: 'CRT-00003', password: 'BlockVault@Crt03!', role: 'court' as Role, name: 'Court 03', status: 'active', createdAt: new Date().toISOString() },
  { id: 'CRT-00004', email: 'CRT-00004', password: 'BlockVault@Crt04!', role: 'court' as Role, name: 'Court 04', status: 'active', createdAt: new Date().toISOString() },
  { id: 'CRT-00005', email: 'CRT-00005', password: 'BlockVault@Crt05!', role: 'court' as Role, name: 'Court 05', status: 'active', createdAt: new Date().toISOString() },

  // Police
  { id: 'POL-00001', email: 'POL-00001', password: 'BlockVault@Pol01!', role: 'police' as Role, name: 'Police 01', status: 'active', createdAt: new Date().toISOString() },
  { id: 'POL-00002', email: 'POL-00002', password: 'BlockVault@Pol02!', role: 'police' as Role, name: 'Police 02', status: 'active', createdAt: new Date().toISOString() },
  { id: 'POL-00003', email: 'POL-00003', password: 'BlockVault@Pol03!', role: 'police' as Role, name: 'Police 03', status: 'active', createdAt: new Date().toISOString() },
  { id: 'POL-00004', email: 'POL-00004', password: 'BlockVault@Pol04!', role: 'police' as Role, name: 'Police 04', status: 'active', createdAt: new Date().toISOString() },
  { id: 'POL-00005', email: 'POL-00005', password: 'BlockVault@Pol05!', role: 'police' as Role, name: 'Police 05', status: 'active', createdAt: new Date().toISOString() },

  // Doctors
  { id: 'DOC-00001', email: 'DOC-00001', password: 'BlockVault@Doc01!', role: 'doctor' as Role, name: 'Doctor 01', status: 'active', createdAt: new Date().toISOString() },
  { id: 'DOC-00002', email: 'DOC-00002', password: 'BlockVault@Doc02!', role: 'doctor' as Role, name: 'Doctor 02', status: 'active', createdAt: new Date().toISOString() },
  
  // Normal Users
  { id: 'USR-00001', email: 'USR-00001', password: 'BlockVault@Usr01!', role: 'user' as Role, name: 'User 01', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00002', email: 'USR-00002', password: 'BlockVault@Usr02!', role: 'user' as Role, name: 'User 02', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00003', email: 'USR-00003', password: 'BlockVault@Usr03!', role: 'user' as Role, name: 'User 03', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00004', email: 'USR-00004', password: 'BlockVault@Usr04!', role: 'user' as Role, name: 'User 04', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00005', email: 'USR-00005', password: 'BlockVault@Usr05!', role: 'user' as Role, name: 'User 05', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00006', email: 'USR-00006', password: 'BlockVault@Usr06!', role: 'user' as Role, name: 'User 06', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00007', email: 'USR-00007', password: 'BlockVault@Usr07!', role: 'user' as Role, name: 'User 07', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00008', email: 'USR-00008', password: 'BlockVault@Usr08!', role: 'user' as Role, name: 'User 08', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00009', email: 'USR-00009', password: 'BlockVault@Usr09!', role: 'user' as Role, name: 'User 09', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00010', email: 'USR-00010', password: 'BlockVault@Usr10!', role: 'user' as Role, name: 'User 10', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00011', email: 'USR-00011', password: 'BlockVault@Usr11!', role: 'user' as Role, name: 'User 11', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00012', email: 'USR-00012', password: 'BlockVault@Usr12!', role: 'user' as Role, name: 'User 12', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00013', email: 'USR-00013', password: 'BlockVault@Usr13!', role: 'user' as Role, name: 'User 13', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00014', email: 'USR-00014', password: 'BlockVault@Usr14!', role: 'user' as Role, name: 'User 14', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00015', email: 'USR-00015', password: 'BlockVault@Usr15!', role: 'user' as Role, name: 'User 15', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00016', email: 'USR-00016', password: 'BlockVault@Usr16!', role: 'user' as Role, name: 'User 16', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00017', email: 'USR-00017', password: 'BlockVault@Usr17!', role: 'user' as Role, name: 'User 17', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00018', email: 'USR-00018', password: 'BlockVault@Usr18!', role: 'user' as Role, name: 'User 18', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00019', email: 'USR-00019', password: 'BlockVault@Usr19!', role: 'user' as Role, name: 'User 19', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00020', email: 'USR-00020', password: 'BlockVault@Usr20!', role: 'user' as Role, name: 'User 20', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00021', email: 'USR-00021', password: 'BlockVault@Usr21!', role: 'user' as Role, name: 'User 21', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00022', email: 'USR-00022', password: 'BlockVault@Usr22!', role: 'user' as Role, name: 'User 22', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00023', email: 'USR-00023', password: 'BlockVault@Usr23!', role: 'user' as Role, name: 'User 23', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00024', email: 'USR-00024', password: 'BlockVault@Usr24!', role: 'user' as Role, name: 'User 24', status: 'active', createdAt: new Date().toISOString() },
  { id: 'USR-00025', email: 'USR-00025', password: 'BlockVault@Usr25!', role: 'user' as Role, name: 'User 25', status: 'active', createdAt: new Date().toISOString() }
];

let currentUser: { id: string; email: string; name?: string } | null = null;
const authListeners: Array<(event: string, session: any) => void> = [];

// ─── Local Storage Helpers ───────────────────────────────────────────────────
export const getLS = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setLS = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ─── Allowed File Types ───────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES];
const MAX_FILE_SIZE_MB = 100;

export interface MockQueryBuilder<T = any> extends PromiseLike<{ data: T[]; error: any }> {
  eq: (field: string, value: any) => MockQueryBuilder<T>;
  order: (field: string, opts?: { ascending?: boolean }) => MockQueryBuilder<T>;
  single: () => Promise<{ data: T | null; error: any }>;
}

// ─── Supabase Mock Client ─────────────────────────────────────────────────────
export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const data = await apiAuth.login(email, password);
        const { token, user } = data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        authListeners.forEach(l => l('SIGNED_IN', { user }));
        return { data: { user }, error: null };
      } catch (err: any) {
        const localUser = MOCK_USERS.find(
          u => (u.email.toLowerCase() === email.toLowerCase() || u.id.toLowerCase() === email.toLowerCase()) &&
               u.password === password
        );
        if (localUser) {
          const userObj = { id: localUser.id, email: localUser.email, name: localUser.name, role: localUser.role };
          localStorage.setItem('auth_token', 'mock_jwt_' + localUser.id);
          localStorage.setItem('auth_user', JSON.stringify(userObj));
          authListeners.forEach(l => l('SIGNED_IN', { user: userObj }));
          return { data: { user: userObj }, error: null };
        }
        return { data: null, error: { message: err.message || 'Invalid credentials' } };
      }
    },

    getSession: async () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { session: { user } }, error: null };
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      return { data: { session: null }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      authListeners.forEach(l => l('SIGNED_OUT', null));
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      authListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authListeners.indexOf(callback);
              if (index > -1) authListeners.splice(index, 1);
            },
          },
        },
      };
    },
  },

  from: (table: string) => {
    const getData = () => {
      if (table === 'profiles') return MOCK_USERS;
      return getLS(`mock_${table}`, []);
    };

    return {
      select: (_columns = '*'): MockQueryBuilder => {
        let currentData = [...getData()];
        const builder = {
          _data: currentData,
          eq(field: string, value: any) {
            this._data = this._data.filter((item: any) => item[field] === value);
            return this;
          },
          order(field: string, opts?: { ascending?: boolean }) {
            const asc = opts?.ascending ?? true;
            this._data = [...this._data].sort((a: any, b: any) => {
              if (a[field] < b[field]) return asc ? -1 : 1;
              if (a[field] > b[field]) return asc ? 1 : -1;
              return 0;
            });
            return this;
          },
          async single() {
            await new Promise(r => setTimeout(r, 50));
            return this._data.length
              ? { data: this._data[0], error: null }
              : { data: null, error: { message: 'Not found' } };
          },
          then<TResult1 = { data: any[]; error: any }, TResult2 = never>(
            onfulfilled?: ((value: { data: any[]; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
          ): Promise<TResult1 | TResult2> {
            return Promise.resolve({ data: this._data, error: null }).then(onfulfilled, onrejected);
          },
        };
        return builder as unknown as MockQueryBuilder;
      },

      insert: async (items: any[]) => {
        await new Promise(r => setTimeout(r, 200));
        const existing = getLS(`mock_${table}`, []);
        const newItems = items.map(item => ({
          ...item,
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
        }));
        setLS(`mock_${table}`, [...existing, ...newItems]);
        return { error: null };
      },

      update: (updates: any) => ({
        eq: async (field: string, value: any) => {
          await new Promise(r => setTimeout(r, 100));
          const existing = getLS(`mock_${table}`, []);
          const updated = existing.map((item: any) =>
            item[field] === value ? { ...item, ...updates } : item
          );
          setLS(`mock_${table}`, updated);
          return { error: null };
        },
      }),

      delete: () => ({
        eq: async (field: string, value: any) => {
          await new Promise(r => setTimeout(r, 100));
          const existing = getLS(`mock_${table}`, []);
          const updated = existing.filter((item: any) => item[field] !== value);
          setLS(`mock_${table}`, updated);
          return { error: null };
        },
      }),
    };
  },

  storage: {
    from: (_bucket: string) => ({
      /**
       * BACKEND ENFORCEMENT of AI detection threshold.
       * This simulates server-side enforcement — the upload is rejected here
       * if AI probability >= AI_DETECTION_THRESHOLD, regardless of frontend state.
       */
      upload: async (path: string, file: File, options?: { aiProbability?: number }) => {
        await new Promise(r => setTimeout(r, 300));

        // 1. Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          return { error: { message: `Unsupported file type: ${file.type}` } };
        }

        // 2. Validate file size
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          return { error: { message: `File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB` } };
        }

        // 3. BACKEND: independently run AI detection & enforce threshold
        let detection;
        try {
          detection = await analyzeMedia(file);
        } catch {
          return { error: { message: 'DETECTION_FAILED: AI service unavailable.' } };
        }

        if (detection.status === 'FAILED') {
          return { error: { message: 'DETECTION_FAILED: Could not verify this file.' } };
        }

        if (detection.status === 'INCONCLUSIVE' || detection.probability === null) {
          return { error: { message: 'DETECTION_FAILED: Inconclusive result or unreliable score.' } };
        }

        if (detection.probability >= AI_DETECTION_THRESHOLD) {
          return {
            error: {
              message: `UPLOAD_BLOCKED: AI probability ${detection.probability}% >= threshold ${AI_DETECTION_THRESHOLD}%`,
              code: 'AI_BLOCKED',
              aiProbability: detection.probability,
              threshold: AI_DETECTION_THRESHOLD,
            },
          };
        }

        // 4. All checks passed — upload to real Supabase storage
        try {
          const cleanPath = path.replace(/^\/+/, '');
          const { data, error: sbErr } = await supabaseClient.storage
            .from(_bucket || 'evidence')
            .upload(cleanPath, file, { upsert: true });

          if (!sbErr && data) {
            const { data: pubData } = supabaseClient.storage.from(_bucket || 'evidence').getPublicUrl(cleanPath);
            setLS(`mock_file_${path}`, pubData.publicUrl);
            return { error: null, data: { path: pubData.publicUrl } };
          }
        } catch (uploadEx) {
          console.warn('Real Supabase storage upload warning (falling back to local):', uploadEx);
        }

        const url = URL.createObjectURL(file);
        setLS(`mock_file_${path}`, url);
        return { error: null, data: { path } };
      },

      getPublicUrl: (path: string) => {
        try {
          const cleanPath = path.replace(/^\/+/, '');
          const { data } = supabaseClient.storage.from(_bucket || 'evidence').getPublicUrl(cleanPath);
          if (data?.publicUrl) return { data };
        } catch {}
        const url = getLS(`mock_file_${path}`, 'https://via.placeholder.com/300');
        return { data: { publicUrl: url } };
      },
    }),
  },
};
