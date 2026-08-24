import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStudent } from '@/contexts/StudentContext';
import { studentService } from '@/services/api/studentService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageCircle,
  Send,
  Search,
  GraduationCap,
  Phone,
  Video,
  MoreVertical,
  Loader2
} from '../../lib/icons';

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

interface Conversa {
  id: string;
  nome: string;
  tipo: string;
  avatar?: string;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
  online: boolean;
}

interface Mensagem {
  id: string;
  remetente: string;
  conteudo: string;
  hora: string;
  minha: boolean;
}

const messageSchema = z.object({
  content: z.string().min(1, "A mensagem não pode estar vazia"),
});

export function MessagesView () {
  const { student } = useStudent();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionadaId, setConversaSelecionadaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  
  const [busca, setBusca] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (conversaSelecionadaId) {
      fetchConversation(conversaSelecionadaId);
    }
  }, [conversaSelecionadaId]);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const data = await studentService.getContacts();
      const formatadas: Conversa[] = data.map((c: any) => ({
        id: c.id,
        nome: c.nome || c.name || 'Sem Nome',
        tipo: c.tipo || c.role || 'user',
        ultimaMensagem: c.ultimaMensagem || '',
        hora: c.hora ? format(new Date(c.hora), "HH:mm", { locale: ptBR }) : '',
        naoLidas: c.naoLidas || 0,
        online: true,
      }));
      setConversas(formatadas);
      if (formatadas.length > 0 && !conversaSelecionadaId) {
        setConversaSelecionadaId(formatadas[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchConversation = async (userId: string) => {
    setIsLoadingMessages(true);
    try {
      const data = await studentService.getConversation(userId);
      const hist: Mensagem[] = data.map((m: any) => ({
        id: m.id,
        remetente: m.senderId === student.id ? 'Você' : '',
        conteudo: m.content,
        hora: format(new Date(m.createdAt), "HH:mm", { locale: ptBR }),
        minha: m.senderId === student.id
      }));
      setMensagens(hist);

      // Marca como lida localmente
      setConversas(prev => prev.map(c => 
        c.id === userId ? { ...c, naoLidas: 0 } : c
      ));

      // Chama a API para marcar como lida
      await studentService.markConversationAsRead(userId);

    } catch (error) {
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const conversaSelecionada = conversas.find(c => c.id === conversaSelecionadaId);

  const getTipoLabel = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'teacher': return 'Professor';
      case 'admin':
      case 'super_admin': return 'Direção';
      case 'secretary': return 'Secretaria';
      case 'parent': return 'Encarregado';
      default: return 'Escola';
    }
  };

  const enviarMensagem = async (values: z.infer<typeof messageSchema>) => {
    if (!conversaSelecionada) return;

    const textoMensagem = values.content.trim();
    if (!textoMensagem) return;

    const mensagemTemp: Mensagem = {
      id: Date.now().toString(),
      remetente: 'Você',
      conteudo: textoMensagem,
      hora: format(new Date(), "HH:mm", { locale: ptBR }),
      minha: true
    };

    setMensagens(prev => [...prev, mensagemTemp]);
    
    // Atualiza a ultima mensagem na barra lateral otimisticamente
    setConversas(prev => prev.map(c => 
      c.id === conversaSelecionada.id 
      ? { ...c, ultimaMensagem: textoMensagem, hora: mensagemTemp.hora } 
      : c
    ));
    
    messageForm.reset();

    try {
      await studentService.sendMessage({
        receiverId: conversaSelecionada.id, 
        content: textoMensagem,
      });
      // Optionally fetch conversation again to get real IDs, but local state is fine for now
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      // Reverter em caso de erro? (opcional)
    }
  };

  const conversasFiltradas = conversas.filter(conversa =>
    conversa.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <MessageCircle className="mr-3 h-8 w-8" />
            Mensagens
          </h1>
          <p className="text-muted-foreground">Comunicação direta com professores e direção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Contatos
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoadingContacts ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : conversasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum contato encontrado.
                </div>
              ) : (
                conversasFiltradas.map((conversa) => (
                  <div
                    key={conversa.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      conversaSelecionadaId === conversa.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setConversaSelecionadaId(conversa.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversa.avatar} alt={conversa.nome} />
                          <AvatarFallback>
                            {conversa.tipo === 'teacher' ? (
                              <GraduationCap className="h-5 w-5" />
                            ) : (
                              conversa.nome.substring(0, 2).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversa.online && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conversa.nome}</p>
                          <div className="flex items-center space-x-2">
                            {conversa.naoLidas > 0 && (
                              <Badge variant="destructive" className="rounded-full">
                                {conversa.naoLidas}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{conversa.hora}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversa.ultimaMensagem || 'Iniciar conversa...'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getTipoLabel(conversa.tipo)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Conversa */}
        <Card className="lg:col-span-2 flex flex-col">
          {conversaSelecionada ? (
            <>
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversaSelecionada.avatar} alt={conversaSelecionada.nome} />
                        <AvatarFallback>
                          {conversaSelecionada.tipo === 'teacher' ? (
                            <GraduationCap className="h-5 w-5" />
                          ) : (
                            conversaSelecionada.nome.substring(0, 2).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversaSelecionada.online && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{conversaSelecionada.nome}</CardTitle>
                      <CardDescription className="flex items-center">
                        <Badge variant="outline" className="text-xs mr-2">
                          {getTipoLabel(conversaSelecionada.tipo)}
                        </Badge>
                        {conversaSelecionada.online ? (
                          <span className="text-green-600 text-sm">Online</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Offline</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 mt-20">
                      <MessageCircle className="w-12 h-12" />
                      <p>Envie a primeira mensagem para {conversaSelecionada.nome}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mensagens.map((mensagem) => (
                        <div
                          key={mensagem.id}
                          className={`flex ${mensagem.minha ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              mensagem.minha
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{mensagem.conteudo}</p>
                            <p className={`text-xs mt-1 ${
                              mensagem.minha ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}>
                              {mensagem.hora}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t">
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit(enviarMensagem)} className="flex space-x-2">
                      <FormField
                        control={messageForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Digite sua mensagem..."
                                {...field}
                                className="flex-1"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className='bg-primary hover:bg-primary/90 text-primary-foreground'>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p>Selecione um contato para conversar</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}