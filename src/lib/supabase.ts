import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Project, SclerometryTest, UserProfile } from '../types';

const STORAGE_CUSTOM_URL_KEY = 'esclerometria_supabase_url';
const STORAGE_CUSTOM_KEY_KEY = 'esclerometria_supabase_key';

export function getSupabaseCredentials(): { url: string; key: string; isCustom: boolean } {
  const customUrl = localStorage.getItem(STORAGE_CUSTOM_URL_KEY);
  const customKey = localStorage.getItem(STORAGE_CUSTOM_KEY_KEY);
  
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

  if (customUrl && customKey) {
    return { url: customUrl, key: customKey, isCustom: true };
  }

  return { url: envUrl, key: envKey, isCustom: false };
}

export function saveCustomSupabaseCredentials(url: string, key: string): void {
  if (!url || !key) {
    localStorage.removeItem(STORAGE_CUSTOM_URL_KEY);
    localStorage.removeItem(STORAGE_CUSTOM_KEY_KEY);
  } else {
    localStorage.setItem(STORAGE_CUSTOM_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_CUSTOM_KEY_KEY, key.trim());
  }
  reinitSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseCredentials();
  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function reinitSupabaseClient(): SupabaseClient | null {
  supabaseInstance = null;
  return getSupabase();
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project'));
}

export function mapSupabaseUserToProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Ingeniero Evaluador',
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    provider: user.app_metadata?.provider || 'supabase',
  };
}

/**
 * Iniciar sesión con OAuth2 (Google, GitHub, Azure, Apple)
 */
export async function signInWithOAuthProvider(provider: 'google' | 'github' | 'azure' | 'apple'): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase no está configurado. Ingrese la URL y Anon Key.') };
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Iniciar sesión con Email y Contraseña
 */
export async function signInWithEmailPassword(email: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase no está configurado.') };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error as Error };
    return { user: data.user ? mapSupabaseUserToProfile(data.user) : null, error: null };
  } catch (err: any) {
    return { user: null, error: err };
  }
}

/**
 * Registro con Email y Contraseña
 */
export async function signUpWithEmailPassword(email: string, password: string, fullName?: string): Promise<{ user: UserProfile | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase no está configurado.') };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Ingeniero Evaluador',
        },
      },
    });
    if (error) return { user: null, error: error as Error };
    return { user: data.user ? mapSupabaseUserToProfile(data.user) : null, error: null };
  } catch (err: any) {
    return { user: null, error: err };
  }
}

/**
 * Iniciar sesión con Magic Link (OTP Email)
 */
export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase no está configurado.') };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Cerrar Sesión
 */
export async function signOutSupabase(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error: error as Error | null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Obtener usuario autenticado actual
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      return mapSupabaseUserToProfile(session.user);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Probar conexión con Supabase
 */
export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || getSupabaseCredentials().url;
  const targetKey = key || getSupabaseCredentials().key;

  if (!targetUrl || !targetKey || !targetUrl.startsWith('http')) {
    return { success: false, message: 'URL o Anon Key no son válidas.' };
  }

  try {
    const testClient = createClient(targetUrl, targetKey);
    const { error } = await testClient.auth.getSession();
    if (error) {
      return { success: false, message: `Error en autenticación Supabase: ${error.message}` };
    }
    return { success: true, message: '¡Conexión exitosa con tu instancia de Supabase!' };
  } catch (e: any) {
    return { success: false, message: `No se pudo conectar: ${e.message || e}` };
  }
}

// ----------------------------------------------------
// SINCRONIZACIÓN DE PROYECTOS Y ENSAYOS EN SUPABASE
// ----------------------------------------------------

export async function syncProjectsToCloud(projects: Project[], userId: string): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, count: 0, error: 'Supabase no configurado' };

  try {
    const records = projects.map(p => ({
      id: p.id,
      user_id: userId,
      code: p.code,
      name: p.name,
      client: p.client,
      location: p.location,
      municipality: p.municipality,
      department: p.department,
      contractor: p.contractor,
      supervision: p.supervision,
      engineer_in_charge: p.engineerInCharge,
      license_number: p.licenseNumber,
      default_hammer_model: p.defaultHammerModel,
      default_hammer_serial: p.defaultHammerSerial,
      default_curve: p.defaultCurve,
      notes: p.notes,
      created_at: new Date(p.createdAt).toISOString(),
      updated_at: new Date(p.updatedAt).toISOString(),
    }));

    const { error } = await client
      .from('projects')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing projects to Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: records.length };
  } catch (err: any) {
    console.error('Supabase projects sync error:', err);
    return { success: false, count: 0, error: err.message };
  }
}

export async function syncTestsToCloud(tests: SclerometryTest[], userId: string): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, count: 0, error: 'Supabase no configurado' };

  try {
    const records = tests.map(t => ({
      id: t.id,
      project_id: t.projectId,
      user_id: userId,
      element_tag: t.elementTag,
      element_type: t.elementType,
      level_axis: t.levelAxis,
      fc_design_mpa: t.fcDesignMpa,
      fc_design_psi: t.fcDesignPsi,
      concrete_age_days: t.concreteAgeDays,
      hammer_model: t.hammerModel,
      hammer_serial: t.hammerSerial,
      impact_angle: t.impactAngle,
      surface_condition: t.surfaceCondition,
      carbonation_depth_mm: t.carbonationDepthMm,
      curve_model: t.curveModel,
      custom_curve_params: t.customCurveParams,
      readings: t.readings,
      excluded_indices: t.excludedIndices,
      mean_raw: t.meanRaw,
      correction_angle: t.correctionAngle,
      mean_corrected: t.meanCorrected,
      std_dev: t.stdDev,
      cov: t.cov,
      estimated_fc_mpa: t.estimatedFcMpa,
      estimated_fc_kgcm2: t.estimatedFcKgcm2,
      estimated_fc_psi: t.estimatedFcPsi,
      compliance_ratio: t.complianceRatio,
      status: t.status,
      status_notes: t.statusNotes,
      photos: t.photos,
      notes: t.notes,
      operator_name: t.operatorName,
      created_at: new Date(t.createdAt).toISOString(),
      updated_at: new Date(t.updatedAt).toISOString(),
    }));

    const { error } = await client
      .from('sclerometry_tests')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing tests to Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: records.length };
  } catch (err: any) {
    console.error('Supabase tests sync error:', err);
    return { success: false, count: 0, error: err.message };
  }
}

export async function fetchProjectsFromCloud(userId: string): Promise<{ projects: Project[]; error?: string }> {
  const client = getSupabase();
  if (!client) return { projects: [], error: 'Supabase no configurado' };

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { projects: [], error: error.message };
    }

    const projects: Project[] = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      code: row.code,
      name: row.name,
      client: row.client,
      location: row.location,
      municipality: row.municipality,
      department: row.department,
      contractor: row.contractor,
      supervision: row.supervision,
      engineerInCharge: row.engineer_in_charge,
      licenseNumber: row.license_number,
      defaultHammerModel: row.default_hammer_model,
      defaultHammerSerial: row.default_hammer_serial,
      defaultCurve: row.default_curve,
      notes: row.notes,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }));

    return { projects };
  } catch (err: any) {
    return { projects: [], error: err.message };
  }
}

export async function fetchTestsFromCloud(userId: string): Promise<{ tests: SclerometryTest[]; error?: string }> {
  const client = getSupabase();
  if (!client) return { tests: [], error: 'Supabase no configurado' };

  try {
    const { data, error } = await client
      .from('sclerometry_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { tests: [], error: error.message };
    }

    const tests: SclerometryTest[] = (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      elementTag: row.element_tag,
      elementType: row.element_type,
      levelAxis: row.level_axis,
      fcDesignMpa: row.fc_design_mpa,
      fcDesignPsi: row.fc_design_psi,
      concreteAgeDays: row.concrete_age_days,
      hammerModel: row.hammer_model,
      hammerSerial: row.hammer_serial,
      impactAngle: row.impact_angle,
      surfaceCondition: row.surface_condition,
      carbonationDepthMm: row.carbonation_depth_mm,
      curveModel: row.curve_model,
      customCurveParams: row.custom_curve_params,
      readings: row.readings || [],
      excludedIndices: row.excluded_indices || [],
      meanRaw: row.mean_raw,
      correctionAngle: row.correction_angle,
      meanCorrected: row.mean_corrected,
      stdDev: row.std_dev,
      cov: row.cov,
      estimatedFcMpa: row.estimated_fc_mpa,
      estimatedFcKgcm2: row.estimated_fc_kgcm2,
      estimatedFcPsi: row.estimated_fc_psi,
      complianceRatio: row.compliance_ratio,
      status: row.status,
      statusNotes: row.status_notes,
      photos: row.photos || [],
      notes: row.notes,
      operatorName: row.operator_name,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }));

    return { tests };
  } catch (err: any) {
    return { tests: [], error: err.message };
  }
}

/**
 * Script SQL para crear las tablas en Supabase con Row Level Security (RLS)
 */
export const SUPABASE_SQL_SCHEMA = `-- ESCLEROMETRÍA PRO COLOMBIA - TABLAS SUPABASE (NSR-10 / NTC 3692)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com/dashboard)

-- 1. Tabla de Proyectos
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    client TEXT,
    location TEXT,
    municipality TEXT,
    department TEXT,
    contractor TEXT,
    supervision TEXT,
    engineer_in_charge TEXT,
    license_number TEXT,
    default_hammer_model TEXT,
    default_hammer_serial TEXT,
    default_curve TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Ensayos Esclerométricos
CREATE TABLE IF NOT EXISTS public.sclerometry_tests (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    element_tag TEXT NOT NULL,
    element_type TEXT NOT NULL,
    level_axis TEXT,
    fc_design_mpa NUMERIC DEFAULT 0,
    fc_design_psi NUMERIC DEFAULT 0,
    concrete_age_days INT DEFAULT 28,
    hammer_model TEXT,
    hammer_serial TEXT,
    impact_angle INT DEFAULT 0,
    surface_condition TEXT,
    carbonation_depth_mm NUMERIC DEFAULT 0,
    curve_model TEXT NOT NULL,
    custom_curve_params JSONB,
    readings INT[] NOT NULL,
    excluded_indices INT[],
    mean_raw NUMERIC NOT NULL,
    correction_angle NUMERIC DEFAULT 0,
    mean_corrected NUMERIC NOT NULL,
    std_dev NUMERIC NOT NULL,
    cov NUMERIC NOT NULL,
    estimated_fc_mpa NUMERIC NOT NULL,
    estimated_fc_kgcm2 NUMERIC NOT NULL,
    estimated_fc_psi NUMERIC NOT NULL,
    compliance_ratio NUMERIC,
    status TEXT NOT NULL,
    status_notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    operator_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sclerometry_tests ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acceso para Proyectos (Cada usuario solo ve y edita sus proyectos)
CREATE POLICY "Users can select their own projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Políticas de Acceso para Ensayos
CREATE POLICY "Users can select their own tests" 
ON public.sclerometry_tests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests" 
ON public.sclerometry_tests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests" 
ON public.sclerometry_tests FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tests" 
ON public.sclerometry_tests FOR DELETE 
USING (auth.uid() = user_id);
`;
