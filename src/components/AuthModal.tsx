import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Lock, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Copy, 
  Check, 
  LogOut, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Settings
} from 'lucide-react';
import { 
  signInWithOAuthProvider, 
  signInWithEmailPassword, 
  signUpWithEmailPassword, 
  signInWithMagicLink, 
  signOutSupabase, 
  getSupabaseCredentials, 
  saveCustomSupabaseCredentials, 
  testSupabaseConnection, 
  isSupabaseConfigured,
  SUPABASE_SQL_SCHEMA
} from '../lib/supabase';
import { UserProfile, CloudSyncStatus } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  syncStatus: CloudSyncStatus;
  onSyncToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
  onUserChange: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncStatus,
  onSyncToCloud,
  onPullFromCloud,
  onUserChange
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'cloud' | 'config'>(currentUser ? 'cloud' : 'auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  
  // Credentials & Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Custom Supabase credentials
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  
  // Loading & State flags
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setCustomUrl(creds.url);
      setCustomKey(creds.key);
      setIsConfigured(isSupabaseConfigured());
      setErrorMessage(null);
      setSuccessMessage(null);
      setConnectionTestResult(null);
      if (currentUser) {
        setActiveTab('cloud');
      } else {
        setActiveTab('auth');
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle OAuth2 login
  const handleOAuthLogin = async (provider: 'google' | 'github' | 'azure') => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await signInWithOAuthProvider(provider);
    if (error) {
      setErrorMessage(`Error OAuth (${provider}): ${error.message}`);
      setLoading(false);
    } else {
      setSuccessMessage(`Redirigiendo a ${provider} OAuth2...`);
    }
  };

  // Handle Email Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { user, error } = await signInWithEmailPassword(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (user) {
      setSuccessMessage('¡Sesión iniciada correctamente!');
      onUserChange(user);
      setActiveTab('cloud');
    }
  };

  // Handle Email Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { user, error } = await signUpWithEmailPassword(email, password, fullName);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('¡Registro exitoso! Revisa tu correo si requiere confirmación.');
      if (user) {
        onUserChange(user);
        setActiveTab('cloud');
      }
    }
  };

  // Handle Magic Link
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Ingresa tu correo para recibir el Magic Link.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await signInWithMagicLink(email);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('¡Enlace de acceso enviado! Revisa tu bandeja de entrada.');
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    setLoading(true);
    await signOutSupabase();
    onUserChange(null);
    setLoading(false);
    setActiveTab('auth');
    setSuccessMessage('Sesión cerrada.');
  };

  // Test Supabase Connection
  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionTestResult(null);
    const res = await testSupabaseConnection(customUrl, customKey);
    setLoading(false);
    setConnectionTestResult(res);
    if (res.success) {
      setIsConfigured(true);
    }
  };

  // Save Credentials
  const handleSaveCredentials = () => {
    saveCustomSupabaseCredentials(customUrl, customKey);
    setIsConfigured(isSupabaseConfigured());
    setSuccessMessage('Credenciales de Supabase guardadas localmente.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Copy SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Sincronización Supabase Cloud
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Autenticación OAuth2 y Respaldo Persistente en Base de Datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'auth'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            {currentUser ? 'Perfil de Usuario' : 'Acceso OAuth2 / Login'}
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            Nube & Sincronización
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Conexión Supabase
          </button>
        </div>

        {/* Messages */}
        <div className="px-6 pt-3">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div>
              {currentUser ? (
                /* Profile view when logged in */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Avatar" 
                          className="h-12 w-12 rounded-full border border-emerald-400 object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-lg flex items-center justify-center">
                          {currentUser.fullName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {currentUser.fullName}
                          </h3>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold font-mono">
                            OAuth ({currentUser.provider})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>ID Usuario Supabase:</span>
                      <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {currentUser.id.substring(0, 16)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Seguridad en Base de Datos:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> RLS Aislado por Usuario
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                /* Login / Signup form */
                <div className="space-y-4">
                  
                  {/* OAuth2 Providers */}
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Iniciar con Proveedor OAuth2:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      
                      {/* Google OAuth */}
                      <button
                        onClick={() => handleOAuthLogin('google')}
                        disabled={loading}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2.5 transition shadow-sm hover:shadow"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Google OAuth2
                      </button>

                      {/* GitHub OAuth */}
                      <button
                        onClick={() => handleOAuthLogin('github')}
                        disabled={loading}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2.5 transition shadow-sm hover:shadow"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        GitHub OAuth2
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase">
                      o con Correo Electrónico
                    </span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  {/* Auth mode switcher */}
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => setAuthMode('signin')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        authMode === 'signin'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Ingresar
                    </button>
                    <button
                      onClick={() => setAuthMode('signup')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        authMode === 'signup'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Registrarse
                    </button>
                    <button
                      onClick={() => setAuthMode('magic')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        authMode === 'magic'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Magic Link
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={authMode === 'signup' ? handleEmailSignUp : authMode === 'magic' ? handleMagicLink : handleEmailSignIn} className="space-y-3">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre Completo / Cargo
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ing. Jhon Fredy Piraquive"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu.correo@ingenieria.com"
                          className="w-full pl-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {authMode !== 'magic' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full pl-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {authMode === 'signup' ? 'Crear Cuenta en Supabase' : authMode === 'magic' ? 'Enviar Enlace Mágico' : 'Iniciar Sesión'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Estado de Sincronización en la Nube
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    syncStatus === 'synced' 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                      : syncStatus === 'syncing' 
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {syncStatus === 'synced' ? '✓ Nube Sincronizada' : syncStatus === 'syncing' ? '⏳ Sincronizando...' : 'Local / Listo'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tus proyectos, registros de impacto, fotos y ensayos calibrados se guardan localmente para operar sin internet y se sincronizan con Supabase Postgres cuando hay conexión.
                </p>
              </div>

              {currentUser ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={onSyncToCloud}
                    disabled={loading}
                    className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl text-left transition group shadow-sm hover:shadow"
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 transition">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Subir a la Nube (Push)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Guarda todos los proyectos y ensayos locales en Supabase.
                    </p>
                  </button>

                  <button
                    onClick={onPullFromCloud}
                    disabled={loading}
                    className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 rounded-2xl text-left transition group shadow-sm hover:shadow"
                  >
                    <div className="h-9 w-9 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2 transition">
                      <DownloadCloud className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Descargar de la Nube (Pull)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Recupera tus ensayos desde Supabase en cualquier dispositivo.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-2">
                  <Lock className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Inicia sesión para sincronizar automáticamente
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Conéctate mediante OAuth2 (Google / GitHub) en la pestaña de Acceso.
                  </p>
                  <button
                    onClick={() => setActiveTab('auth')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-block mt-1"
                  >
                    Ir a Iniciar Sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUPABASE CONFIG & SQL SCHEMA */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://abcdefghijklm.supabase.co"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Probar Conexión
                  </button>
                  <button
                    onClick={handleSaveCredentials}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Guardar Credenciales
                  </button>
                </div>

                {connectionTestResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    connectionTestResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {connectionTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                    <span>{connectionTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* SQL Tables Script */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Script SQL para Supabase (Tablas + RLS)
                    </span>
                  </div>
                  <button
                    onClick={handleCopySql}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                  >
                    {copiedSql ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copiedSql ? 'Copiado' : 'Copiar SQL'}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-36 border border-slate-800">
                  <pre>{SUPABASE_SQL_SCHEMA}</pre>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Pega este script en el <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-500 underline inline-flex items-center gap-0.5">SQL Editor de Supabase <ExternalLink className="h-2.5 w-2.5" /></a> para aprovisionar las tablas con protección por usuario (RLS).
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isConfigured ? 'Supabase Conectado' : 'Modo Local / Sin Configurar'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
