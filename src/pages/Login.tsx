import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logo from '@/assets/bioteca_logo.png';
import bgVideo from '@/assets/312848_small.mp4';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      let msg = 'E-mail ou senha incorretos.';
      if (error.message.includes('Invalid login credentials'))
        msg = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      else if (error.message.includes('Email not confirmed'))
        msg = 'E-mail não confirmado. Verifique sua caixa de entrada.';
      else if (error.message.includes('Too many requests'))
        msg = 'Muitas tentativas. Aguarde alguns minutos.';
      else if (error.message.includes('Network'))
        msg = 'Erro de conexão. Verifique sua internet.';

      setError(msg);
      toast.error(msg);
      setLoading(false);
    } else {
      navigate('/welcome');
    }
  };

  return (
    <motion.div
      className="min-h-screen flex bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Left: Branding (desktop only) ── */}
      <div className="hidden lg:flex flex-col relative w-[55%] overflow-hidden">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Brand text */}
        <motion.div
          className="absolute bottom-16 left-14 z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-white/40 text-sm font-semibold uppercase tracking-[0.3em] mb-4">
            Biodinâmica
          </p>
          <h2 className="text-6xl font-black text-white tracking-tight leading-none">
            Hub de
          </h2>
          <h2 className="text-6xl font-black tracking-tight leading-none text-gradient">
            Treinamentos
          </h2>
          <p className="text-white/40 mt-5 text-base max-w-xs leading-relaxed">
            Acesse conteúdos exclusivos e desenvolva suas competências.
          </p>
        </motion.div>

        {/* Corner logo */}
        <div className="absolute top-10 left-14 z-10">
          <img src={logo} alt="Bioteca" className="h-8 opacity-80" />
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-6 py-10">
        {/* Mobile video bg */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30 lg:hidden"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40 lg:hidden" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

        <motion.div
          className="w-full max-w-sm relative z-10"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo — mobile only */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={logo} alt="Bioteca" className="h-10 drop-shadow-lg" />
          </div>

          <div className="glass-card rounded-3xl p-8 border border-white/[0.08]">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-white/40 text-sm">
                Entre com suas credenciais para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-bold mb-2 text-white/60 uppercase tracking-widest">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="glass-input pl-11 text-sm"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-xs font-bold mb-2 text-white/60 uppercase tracking-widest">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="glass-input pl-11 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/25"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white overflow-hidden disabled:opacity-50 transition-all"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                  boxShadow: '0 4px 24px hsl(var(--primary) / 0.5)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 32px hsl(var(--primary) / 0.6)' }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Acessar Plataforma</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <motion.p
            className="text-center text-white/20 text-[10px] mt-6 font-mono uppercase tracking-[0.4em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            © 2026 Biodinâmica
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
