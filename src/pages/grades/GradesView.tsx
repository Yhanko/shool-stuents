import  { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/contexts/StudentContext';
import { BookOpen, TrendingUp, Award, Calendar } from '../../lib/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function GradesView() {
  const { subjects, grades } = useStudent();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const periodMap: Record<string, string[]> = {
    '1º Período': ['1', 'first'],
    '2º Período': ['2', 'second'],
    '3º Período': ['3', 'third']
  };

  const filteredGrades = grades.filter(grade => {
    const subjectMatch = selectedSubject === 'all' || grade.subject === selectedSubject;
    const periodMatch = selectedPeriod === 'all' || periodMap[selectedPeriod]?.includes(String(grade.period).toLowerCase());
    return subjectMatch && periodMatch;
  });

  const getGradeColor = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeBadgeVariant = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 70) return 'default' as const;
    if (percentage >= 50) return 'secondary' as const;
    return 'destructive' as const;
  };

  const getGradeBadgeClassName = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 70) return 'bg-green-500 hover:bg-green-600 text-white';
    return '';
  };

  const averageGrade = filteredGrades.length > 0 
    ? filteredGrades.reduce((acc, grade) => acc + grade.grade, 0) / filteredGrades.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas e Avaliações</h1>
          <p className="text-gray-600">Acompanhe o seu desempenho acadêmico</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as disciplinas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as disciplinas</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos os períodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="1º Período">1º Período</SelectItem>
              <SelectItem value="2º Período">2º Período</SelectItem>
              <SelectItem value="3º Período">3º Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Média Atual</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageGrade.toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avaliações</p>
              <p className="text-2xl font-bold text-gray-900">{filteredGrades.length}</p>
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

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Este Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredGrades.filter(g => 
                  new Date(g.date).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map(subject => {
          const subjectGrades = filteredGrades.filter(g => g.subject === subject.name);
          const subjectAverage = subjectGrades.length > 0 
            ? subjectGrades.reduce((acc, grade) => acc + grade.grade, 0) / subjectGrades.length 
            : 0;

          return (
            <Card key={subject.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.color || '#3B82F6' }}
                    />
                    <span>{subject.name}</span>
                  </div>
                  <Badge 
                    variant={subjectAverage >= 14 ? 'default' : subjectAverage >= 10 ? 'secondary' : 'destructive'}
                    className={subjectAverage >= 14 ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                  >
                    Média: {subjectAverage.toFixed(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectGrades.length > 0 ? (
                  subjectGrades.map(grade => (
                    <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-8 rounded ${getGradeColor(grade.grade, grade.maxGrade)}`} />
                        <div>
                          <p className="font-medium capitalize">{grade.type}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(grade.date), 'dd MMM, yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-400">{grade.teacher}</p>
                        </div>
                      </div>
                      <div className="text-right">
                      <Badge 
                        variant={getGradeBadgeVariant(grade.grade, grade.maxGrade)}
                        className={getGradeBadgeClassName(grade.grade, grade.maxGrade)}
                      >
                        {grade.grade}/{grade.maxGrade}
                      </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {((grade.grade / grade.maxGrade) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Ainda não há avaliações para esta disciplina</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Grades Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredGrades
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((grade, index) => (
                <div key={grade.id} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getGradeColor(grade.grade, grade.maxGrade)}`} />
                    {index < 4 && <div className="w-px h-8 bg-gray-200 mt-2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{grade.subject} - {grade.type}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(grade.date), 'dd MMM, yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge 
                        variant={getGradeBadgeVariant(grade.grade, grade.maxGrade)}
                        className={getGradeBadgeClassName(grade.grade, grade.maxGrade)}
                      >
                        {grade.grade}/{grade.maxGrade}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}