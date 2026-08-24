import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudent } from '@/contexts/StudentContext';
import { BookOpen, TrendingUp, Award } from '../../lib/icons';
import { AlertCircle } from 'lucide-react';

export function GradesView() {
  const { pautaData, isLoading } = useStudent();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">A carregar boletim de notas...</div>;
  }

  if (!pautaData || !pautaData.subjects || pautaData.subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boletim de Notas</h1>
          <p className="text-gray-600">Acompanhe o seu desempenho académico</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Nenhum dado disponível</p>
            <p className="text-gray-500">Ainda não existem notas lançadas para a sua turma.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { classInfo, subjects } = pautaData;
  const isExamClass = classInfo?.isExamClass;

  // Calculate overall average based on MFD
  const subjectsWithMfd = subjects.filter((s: any) => s.final.mfd !== null);
  const averageGrade = subjectsWithMfd.length > 0
    ? subjectsWithMfd.reduce((acc: number, s: any) => acc + s.final.mfd, 0) / subjectsWithMfd.length
    : 0;

  const getGradeColorClass = (grade: number | null) => {
    if (grade === null) return 'text-gray-400';
    if (grade >= 10) return 'text-blue-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatGrade = (grade: number | null) => {
    if (grade === null) return '-';
    return grade.toFixed(1).replace('.', ',');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boletim de Notas</h1>
          <p className="text-gray-600">
            {classInfo?.name || 'Turma'} {isExamClass && <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">Classe de Exame</Badge>}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Média Geral (MFD)</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageGrade > 0 ? averageGrade.toFixed(1).replace('.', ',') : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Disciplinas com MFD</p>
              <p className="text-2xl font-bold text-gray-900">{subjectsWithMfd.length} / {subjects.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Disciplinas</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pauta Table */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs">
              <tr>
                <th rowSpan={2} className="px-4 py-3 font-medium text-gray-700 w-48 border-r">Disciplina</th>
                <th colSpan={3} className="px-4 py-2 text-center border-b border-r font-medium text-gray-700">1º Trimestre</th>
                <th colSpan={3} className="px-4 py-2 text-center border-b border-r font-medium text-gray-700">2º Trimestre</th>
                <th colSpan={3} className="px-4 py-2 text-center border-b border-r font-medium text-gray-700">3º Trimestre</th>
                {isExamClass && (
                  <th colSpan={3} className="px-4 py-2 text-center border-b border-r font-medium text-gray-700">Exames</th>
                )}
                <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-gray-900 bg-gray-100 border-l">MFD</th>
              </tr>
              <tr>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Avaliação Contínua">MAC</th>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Nota da Prova Trimestral">NPT</th>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-gray-50">MT1</th>

                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Avaliação Contínua">MAC</th>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Nota da Prova Trimestral">NPT</th>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-gray-50">MT2</th>

                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Avaliação Contínua">MAC</th>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Nota da Prova Trimestral">NPT</th>
                <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-gray-50">MT3</th>

                {isExamClass && (
                  <>
                    <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Nota de Exame Escrito">NEE</th>
                    <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-white" title="Nota de Exame Oral">NEO</th>
                    <th className="px-2 py-2 text-center border-r font-medium text-gray-600 bg-gray-50" title="Média de Exame Nacional Combinado">MENC</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {subjects.map((s: any) => (
                <tr key={s.subject.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 border-r">
                    {s.subject.name}
                  </td>
                  
                  {/* T1 */}
                  <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.terms.first.mac)}`}>{formatGrade(s.terms.first.mac)}</td>
                  <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.terms.first.npt)}`}>{formatGrade(s.terms.first.npt)}</td>
                  <td className={`px-2 py-3 text-center border-r font-semibold bg-gray-50 ${getGradeColorClass(s.terms.first.mt)}`}>{formatGrade(s.terms.first.mt)}</td>
                  
                  {/* T2 */}
                  <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.terms.second.mac)}`}>{formatGrade(s.terms.second.mac)}</td>
                  <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.terms.second.npt)}`}>{formatGrade(s.terms.second.npt)}</td>
                  <td className={`px-2 py-3 text-center border-r font-semibold bg-gray-50 ${getGradeColorClass(s.terms.second.mt)}`}>{formatGrade(s.terms.second.mt)}</td>
                  
                  {/* T3 */}
                  <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.terms.third.mac)}`}>{formatGrade(s.terms.third.mac)}</td>
                  <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.terms.third.npt)}`}>{formatGrade(s.terms.third.npt)}</td>
                  <td className={`px-2 py-3 text-center border-r font-semibold bg-gray-50 ${getGradeColorClass(s.terms.third.mt)}`}>{formatGrade(s.terms.third.mt)}</td>
                  
                  {isExamClass && (
                    <>
                      <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.final.nee)}`}>
                        {formatGrade(s.final.nee)}
                      </td>
                      <td className={`px-2 py-3 text-center border-r ${getGradeColorClass(s.final.neo)}`}>
                        {formatGrade(s.final.neo)}
                      </td>
                      <td className={`px-2 py-3 text-center border-r font-semibold bg-gray-50 ${getGradeColorClass(s.final.menc)}`}>
                        {formatGrade(s.final.menc)}
                      </td>
                    </>
                  )}
                  
                  <td className={`px-4 py-3 text-center border-l font-bold bg-gray-100 ${getGradeColorClass(s.final.mfd)}`}>
                    {formatGrade(s.final.mfd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}