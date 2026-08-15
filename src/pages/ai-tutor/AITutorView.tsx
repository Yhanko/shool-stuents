import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/contexts/StudentContext';
import { Bot, Send, Lightbulb, BookOpen, TrendingDown, Star } from '../../lib/icons';
import { studentService } from '@/services/api/studentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  subject?: string;
}

const aiChatSchema = z.object({
  message: z.string().min(1, "A mensagem não pode estar vazia"),
});

export function AITutorView() {
  const { student, subjects } = useStudent();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Olá! Sou a sua IA tutora personalizada. Estou aqui para ajudar com os seus estudos. Analisei o seu desempenho e vejo que pode precisar de ajuda em Física. Como posso ajudar hoje?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quickQuestions, setQuickQuestions] = useState<{ texto: string, categoria: string }[]>([]);

  const aiChatForm = useForm<z.infer<typeof aiChatSchema>>({
    resolver: zodResolver(aiChatSchema),
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getAiAnalysis(student.id);
        setAiAnalysis(data);

        // Atualizar primeira mensagem baseada na análise
        setMessages([
          {
            id: '1',
            type: 'ai',
            content: data.summary,
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error('Erro ao buscar análise:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSuggestions = async () => {
      try {
        const suggestions = await studentService.getAiSuggestions();
        setQuickQuestions(suggestions);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      }
    };

    fetchAnalysis();
    fetchSuggestions();
  }, [student.id]);

  // Identificar disciplinas com desempenho mais baixo
  const weakSubjects = aiAnalysis?.weaknesses || [];
  const strongSubjects = aiAnalysis?.strengths || [];

  const handleSendMessage = async (values: z.infer<typeof aiChatSchema>) => {
    const currentMessage = values.message.trim();
    if (!currentMessage) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
      subject: selectedSubject || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    aiChatForm.reset();
    setIsTyping(true);

    // Enviar mensagem real para o backend
    try {
      // O backend espera { question, studentId }
      // Passamos o selectedSubject na string da pergunta caso haja algum
      const questionToSend = selectedSubject
        ? `[Sobre ${selectedSubject}] ${currentMessage}`
        : currentMessage;

      const response = await studentService.chatWithAi(questionToSend, student.id);

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.resposta || 'Não consegui obter uma resposta neste momento.',
        timestamp: new Date().toISOString(),
        subject: selectedSubject || undefined
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro ao comunicar com a IA', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Desculpe, ocorreu um erro ao contactar o servidor. Tente novamente mais tarde.',
        timestamp: new Date().toISOString(),
        subject: selectedSubject || undefined
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            IA Tutora Personalizada
          </h1>
          <p className="text-gray-600">Assistente inteligente para melhorar o seu desempenho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Analysis Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                Áreas de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">Analisando desempenho...</p>
              ) : weakSubjects.length > 0 ? (
                weakSubjects.map((subject: string, idx: number) => (
                  <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-orange-900">{subject}</span>
                      <Badge variant="secondary">Atenção</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Star className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700">Bom desempenho geral!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Sugestões Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickQuestions.length > 0 ? quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-2 text-xs whitespace-normal"
                    onClick={() => aiChatForm.setValue('message', question.texto)}
                  >
                    {question.texto}
                  </Button>
                )) : (
                  <p className="text-xs text-gray-500">Nenhuma sugestão disponível.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[550px] shadow-sm border-slate-200">
            <CardHeader className="border-b py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Chat com IA Tutora
                </CardTitle>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Escolher disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-gray-900'
                      }`}>
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="w-4 h-4" />
                          <span className="text-xs font-medium">IA Tutora</span>
                        </div>
                      )}
                      {message.type === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div
                          className="text-sm space-y-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n\n/g, '<br/><br/>')
                              .replace(/\n\* /g, '<br/>• ')
                              .replace(/\n- /g, '<br/>• ')
                          }}
                        />
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs font-medium">IA Tutora</span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>

            <div className="border-t p-3 bg-white mt-auto rounded-b-xl">
              <Form {...aiChatForm}>
                <form onSubmit={aiChatForm.handleSubmit(handleSendMessage)} className="flex gap-2">
                  <FormField
                    control={aiChatForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Faça uma pergunta${selectedSubject ? ` sobre ${selectedSubject}` : ''}...`}
                            disabled={isTyping}
                            className="flex-1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </Card>

          {/* Study Recommendations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Recomendações Personalizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">A gerar recomendações...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Recomendações da IA</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Sugestões baseadas no seu desempenho real:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                      {aiAnalysis?.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      )) || <li>Continue assim!</li>}
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Pontos Fortes</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Disciplinas onde está a destacar-se:
                    </p>
                    <ul className="text-sm text-green-800 space-y-1">
                      {strongSubjects.length > 0 ? strongSubjects.map((s: string, idx: number) => (
                        <li key={idx}>• {s}</li>
                      )) : <li>• Todas as disciplinas na média</li>}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}