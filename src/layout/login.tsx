import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/services/api/axios";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const recoverEmailSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [savedEmail, setSavedEmail] = useState("");

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const recoverEmailForm = useForm<z.infer<typeof recoverEmailSchema>>({
    resolver: zodResolver(recoverEmailSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email: values.email, password: values.password });
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

  const handleVerifyEmail = async (values: z.infer<typeof recoverEmailSchema>) => {
    try {
      setIsLoading(true);
      await api.post("/auth/verify-email", { email: values.email, role: "STUDENT" });
      setSavedEmail(values.email);
      setRecoveryStep(2);
      toast.success("Conta verificada. Insira a nova senha.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao verificar conta.");
    } finally { setIsLoading(false); }
  };

  const handleResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsLoading(true);
      await api.post("/auth/reset-password", { email: savedEmail, role: "STUDENT", newPassword: values.newPassword });
      toast.success("Senha alterada com sucesso! Faça login.");
      setIsRecovering(false); 
      setRecoveryStep(1);
      loginForm.reset();
      recoverEmailForm.reset();
      resetPasswordForm.reset();
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
        className="relative z-10 w-[95%] sm:w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden">


          <div className="px-6 sm:px-10 md:px-12 py-10 sm:py-12">
            {/* Logo + title */}
            <div className="flex flex-col items-center text-center mb-10">
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
                <motion.div key="form-login"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
                >
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                      
                      {/* Email */}
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              E-mail Escolar
                            </label>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                  {...field}
                                  id="email"
                                  type="email"
                                  placeholder="aluno@escola.pt"
                                  className="pl-11 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Password */}
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
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
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                  {...field}
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pl-11 pr-12 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-0 outline-none p-0"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full py-3.5 h-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />A entrar...</span>
                          : "Entrar"
                        }
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {/* ── RECOVERY STEP 1 ── */}
              {isRecovering && recoveryStep === 1 && (
                <motion.div key="form-recover1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
                >
                  <Form {...recoverEmailForm}>
                    <form onSubmit={recoverEmailForm.handleSubmit(handleVerifyEmail)} className="space-y-6">
                      <FormField
                        control={recoverEmailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              E-mail da Conta
                            </label>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                  {...field}
                                  id="recovery-email"
                                  type="email"
                                  placeholder="aluno@escola.pt"
                                  className="pl-11 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full py-3.5 h-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200"
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
                    </form>
                  </Form>
                </motion.div>
              )}

              {/* ── RECOVERY STEP 2 ── */}
              {isRecovering && recoveryStep === 2 && (
                <motion.div key="form-recover2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
                >
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-6">
                      
                      <FormField
                        control={resetPasswordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Nova Senha
                            </label>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                  {...field}
                                  id="new-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pl-11 pr-12 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-0 outline-none p-0"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resetPasswordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Confirmar Nova Senha
                            </label>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                  {...field}
                                  id="confirm-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pl-11 h-13 py-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full py-3.5 h-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200"
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
                    </form>
                  </Form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
