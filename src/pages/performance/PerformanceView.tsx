import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Unused import removed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/contexts/StudentContext';
import { TrendingUp, TrendingDown, BarChart3, Target, Award, BookOpen, Clock } from '../../lib/icons';
import { studentService } from '@/services/api/studentService';
import { Loader2 } from 'lucide-react';

export function PerformanceView() {
  const { student, subjects, grades, attendances } = useStudent();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    const fetchAiAnalysis = async () => {
      if (!student?.id) return;
      try {
        setIsLoadingAi(true);
        // Assumindo que temos o classId do student, se não tivermos a API usa vazio e tenta achar.
        const analysis = await studentService.getAiAnalysis(student.id, student.class || '');
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('Failed to fetch AI analysis:', error);
      } finally {
        setIsLoadingAi(false);
      }
    };

    fetchAiAnalysis();
  }, [student]);

  // Filter grades based on period
  const periodMap: Record<string, string[]> = {
    '1': ['1', 'first'],
    '2': ['2', 'second'],
    '3': ['3', 'third']
  };

  const filteredGrades = selectedPeriod === 'all'
    ? grades
    : grades.filter(g => periodMap[selectedPeriod]?.includes(String(g.period).toLowerCase()));

  // Calculate performance metrics
  const subjectPerformance = subjects.map(subject => {
    const subjectGrades = filteredGrades.filter(g => g.subject === subject.name);
    const average = subjectGrades.length > 0
      ? subjectGrades.reduce((acc, grade) => acc + grade.grade, 0) / subjectGrades.length
      : 0;

    // Calculate trend dynamically based on the last two grades
    let trend = 'up';
    let trendValue = 0;

    if (subjectGrades.length >= 2) {
      // Sort by date to get the most recent grades
      const sortedGrades = [...subjectGrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const lastGrade = sortedGrades[sortedGrades.length - 1].grade;
      const prevGrade = sortedGrades[sortedGrades.length - 2].grade;

      trend = lastGrade >= prevGrade ? 'up' : 'down';
      // trendValue as a percentage change or raw difference (e.g., if out of 20)
      trendValue = prevGrade > 0 ? (Math.abs(lastGrade - prevGrade) / prevGrade) * 100 : 0;
    }

    // Calculate attendance percentage for this subject
    let subjectAttendancePercentage = 100;
    if (attendances && attendances.length > 0) {
      // Filtrar as presenças para esta disciplina (pelo ID ou pelo nome se disponível)
      // Como a API atual de attendance não retorna sempre o nome da disciplina, podemos cruzar pelo classId/subjectId se necessário.
      // O attendance.subjectId pode vir na chamada da API.
      const subjectAttendances = attendances.filter(a => a.subjectId === subject.id);
      if (subjectAttendances.length > 0) {
        const presentCount = subjectAttendances.filter(a => a.status === 'present').length;
        subjectAttendancePercentage = Math.round((presentCount / subjectAttendances.length) * 100);
      }
    }

    return {
      ...subject,
      average,
      trend,
      trendValue,
      totalGrades: subjectGrades.length,
      lastGrade: subjectGrades.length > 0 ? subjectGrades[subjectGrades.length - 1].grade : 0,
      color: subject.color || '#3B82F6', // fallback color
      teacher: subject.teacher || 'Não atribuído', // fallback teacher
      attendance: subjectAttendancePercentage
    };
  }).sort((a, b) => b.average - a.average);

  const overallAverage = subjectPerformance.length > 0
    ? subjectPerformance.reduce((acc, subject) => acc + subject.average, 0) / subjectPerformance.length
    : 0;
  const bestSubject = subjectPerformance.length > 0 ? subjectPerformance[0] : null;
  const weakestSubject = subjectPerformance.length > 0 ? subjectPerformance[subjectPerformance.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise de Desempenho</h1>
          <p className="text-gray-600">Acompanhe o seu progresso acadêmico detalhado</p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="1">1º Período</SelectItem>
              <SelectItem value="2">2º Período</SelectItem>
              <SelectItem value="3">3º Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Média Geral</p>
              <p className="text-2xl font-bold text-gray-900">{overallAverage.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Melhor Disciplina</p>
              <p className="text-lg font-bold text-gray-900">{bestSubject?.name}</p>
              <p className="text-sm text-green-600">{bestSubject?.average.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">A Melhorar</p>
              <p className="text-lg font-bold text-gray-900">{weakestSubject?.name}</p>
              <p className="text-sm text-orange-600">{weakestSubject?.average.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Disciplinas</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectPerformance.map((subject, index) => (
              <div key={subject.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-600">{subject.teacher}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Média</p>
                    <p className="text-xl font-bold text-gray-900">{subject.average.toFixed(1)}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">Frequência</p>
                    <p className="text-lg font-semibold text-gray-900">{subject.attendance}%</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avaliações</p>
                    <p className="text-lg font-semibold text-gray-900">{subject.totalGrades}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {subject.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${subject.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {subject.trendValue.toFixed(1)}%
                    </span>
                  </div>

                  <Badge
                    variant={subject.average >= 14 ? 'default' : subject.average >= 10 ? 'secondary' : 'destructive'}
                    className={subject.average >= 14 ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                  >
                    {subject.average >= 14 ? 'Excelente' : subject.average >= 10 ? 'Bom' : 'Precisa Melhorar'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectPerformance
                .filter(subject => subject.average >= 14)
                .slice(0, 3)
                .map(subject => (
                  <div key={subject.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div>
                        <p className="font-medium text-green-900">{subject.name}</p>
                        <p className="text-sm text-green-700">Média: {subject.average.toFixed(1)}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Excelente</Badge>
                  </div>
                ))}
              {subjectPerformance.filter(subject => subject.average >= 14).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Continue trabalhando para alcançar a excelência!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Áreas de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectPerformance
                .filter(subject => subject.average < 14)
                .slice(0, 3)
                .map(subject => (
                  <div key={subject.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div>
                        <p className="font-medium text-orange-900">{subject.name}</p>
                        <p className="text-sm text-orange-700">Média: {subject.average.toFixed(1)}</p>
                      </div>
                    </div>
                    <Badge variant={subject.average >= 10 ? 'secondary' : 'destructive'}>
                      {subject.average >= 10 ? 'Pode Melhorar' : 'Precisa Atenção'}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recomendações Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAi ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-500">A gerar análise com Inteligência Artificial...</span>
            </div>
          ) : aiAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">Plano de Estudos Sugerido</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  {aiAnalysis.studyPlan?.length > 0 ? (
                    aiAnalysis.studyPlan.map((plan: string, index: number) => (
                      <li key={index}>• {plan}</li>
                    ))
                  ) : (
                    <li>• Continuar a seguir o plano regular de estudos.</li>
                  )}
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3">Metas para o Próximo Período</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  {aiAnalysis.goals?.length > 0 ? (
                    aiAnalysis.goals.map((goal: string, index: number) => (
                      <li key={index}>• {goal}</li>
                    ))
                  ) : (
                    <li>• Manter o desempenho e focar na assiduidade.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Não foi possível carregar as recomendações.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}