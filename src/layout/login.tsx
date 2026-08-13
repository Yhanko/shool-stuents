import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Lock, Eye, EyeOff, GraduationCap, Loader2, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/services/api/axios";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token } = response.data;
      if (access_token) {
        const userProfile = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const userData = userProfile.data;
        if (userData.role !== "STUDENT") {
          throw new Error("Conta sem permissão de acesso ao portal do aluno.");
        }
        setAuth(userData, access_token);
        toast.success("Bem-vindo de volta! Login efetuado com sucesso.");
        navigate("/dashboard");
      } else {
        throw new Error("Token não recebido");
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        toast.error("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else if (error instanceof Error && error.message.includes("permissão")) {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao tentar entrar. Tente novamente mais tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Por favor, insira o seu email."); return; }
    try {
      setIsLoading(true);
      await api.post("/auth/verify-email", { email, role: "STUDENT" });
      setRecoveryStep(2);
      toast.success("Conta verificada. Insira a nova senha.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao verificar conta.");
    } finally { setIsLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { toast.error("Por favor, preencha todos os campos."); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }
    try {
      setIsLoading(true);
      await api.post("/auth/reset-password", { email, role: "STUDENT", newPassword });
      toast.success("Senha alterada com sucesso! Faça login.");
      setIsRecovering(false); setRecoveryStep(1);
      setPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao redefinir senha.");
    } finally { setIsLoading(false); }
  };

  const goBack = () => { setIsRecovering(false); setRecoveryStep(1); };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden px-4 py-10">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 -right-48 w-[36rem] h-[36rem] rounded-full bg-blue-500/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-48 -left-48 w-[40rem] h-[40rem] rounded-full bg-indigo-500/20 blur-3xl"
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-[95%] sm:w-full max-w-lg md:max-w-xl lg:max-w-2xl"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="px-6 sm:px-10 md:px-12 py-10 sm:py-12">
            {/* Logo + title */}
            <div className="flex flex-col items-center text-center mb-10">
              <motion.div
                initial={{ scale: 0.75 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.45, delay: 0.15 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5"
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>

              <AnimatePresence mode="wait">
                {!isRecovering ? (
                  <motion.div key="title-login"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                  >
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Portal do Aluno
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                      Entre para aceder às suas aulas e notas
                    </p>
                  </motion.div>
                ) : recoveryStep === 1 ? (
                  <motion.div key="title-recover1"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                  >
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Recuperar conta
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                      Insira o e-mail associado à sua conta
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="title-recover2"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                  >
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Nova senha
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                      Escolha uma senha segura para a sua conta
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-800 mb-10" />

            <AnimatePresence mode="wait">

              {/* ── LOGIN ── */}
              {!isRecovering && (
                <motion.form key="form-login"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
                  className="space-y-6"
                  onSubmit={handleLogin}
                >
                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      E-mail Escolar
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="aluno@escola.pt"
                        className="pl-11 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRecovering(true)}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-12 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-0 outline-none p-0"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3.5 h-auto rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />A entrar...</span>
                      : "Entrar"
                    }
                  </Button>
                </motion.form>
              )}

              {/* ── RECOVERY STEP 1 ── */}
              {isRecovering && recoveryStep === 1 && (
                <motion.form key="form-recover1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
                  className="space-y-6"
                  onSubmit={handleVerifyEmail}
                >
                  <div className="space-y-2">
                    <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      E-mail da Conta
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="aluno@escola.pt"
                        className="pl-11 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3.5 h-auto rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />A verificar...</span>
                      : "Verificar Conta"
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center justify-center gap-1.5 w-full text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-transparent border-0 outline-none pt-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar ao Login
                  </button>
                </motion.form>
              )}

              {/* ── RECOVERY STEP 2 ── */}
              {isRecovering && recoveryStep === 2 && (
                <motion.form key="form-recover2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
                  className="space-y-6"
                  onSubmit={handleResetPassword}
                >
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nova Senha
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-12 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-0 outline-none p-0"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3.5 h-auto rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />A redefinir...</span>
                      : "Redefinir Senha"
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center justify-center gap-1.5 w-full text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-transparent border-0 outline-none pt-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar ao Login
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
