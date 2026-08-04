import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, GraduationCap, Loader2 } from "../lib/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/services/api/axios";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); 
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token } = response.data;
      
      if (access_token) {
        // Obter os dados do aluno com o novo token
        const userProfile = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const userData = userProfile.data;

        // Opcional: Validar se é realmente um aluno
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-3xl" 
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl relative z-10"
      >
        <Card className="shadow-2xl border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-slate-900/80 rounded-3xl overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <CardHeader className="text-center space-y-8 pt-12 pb-6">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Portal do Aluno
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                Introduza as suas credenciais para aceder
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-12 px-10">
            <form className="space-y-8" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">E-mail Escolar</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="aluno@escola.pt"
                      className="pl-11 h-14 text-base rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 transition-all shadow-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Senha</Label>
                    <a href="#" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Esqueceu a senha?</a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-14 text-base rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 transition-all shadow-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-0 outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 text-white font-medium text-lg transition-all duration-200 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span key="loading" className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    A entrar...
                  </span>
                ) : (
                  <span key="idle">Entrar</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}