import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudent } from '@/contexts/StudentContext';
import { BookOpen, Download, Search, FileText, Video, Link, Gamepad2, Calendar, Eye } from '../../lib/icons';
import { studentService } from '@/services/api/studentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ResourcesView() {
  const { subjects } = useStudent();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [resources, setResources] = useState<any[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getResources();
        setResources(data);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadResources();
  }, []);

  const filteredResources = resources.filter(resource => {
    const searchMatch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const subjectMatch = subjectFilter === 'all' || resource.subject === subjectFilter;
    const typeMatch = typeFilter === 'all' || resource.type === typeFilter;
    return searchMatch && subjectMatch && typeMatch;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'link':
        return <Link className="w-5 h-5 text-green-600" />;
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getResourceBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return <Badge variant="destructive">PDF</Badge>;
      case 'video':
        return <Badge variant="default">Vídeo</Badge>;
      case 'link':
        return <Badge variant="outline" className="text-green-600 border-green-600">Link</Badge>;
      case 'game':
        return <Badge variant="secondary">Jogo</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSubjectColor = (subject: string) => {
    const subjectData = subjects.find(s => s.name === subject);
    return subjectData?.color || '#6B7280';
  };

  const totalResources = resources.length;
  const recentResources = resources.filter(resource =>
    resource.createdAt ? new Date(resource.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recursos Educativos</h1>
          <p className="text-gray-600">Materiais de estudo, livros e recursos interativos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recursos</p>
              <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tipos de Ficheiro</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(resources.map(r => r.type)).size}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Novos (7 dias)</p>
              <p className="text-2xl font-bold text-gray-900">{recentResources}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">PDFs</p>
              <p className="text-2xl font-bold text-gray-900">
                {resources.filter(r => r.type === 'pdf').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por disciplina" />
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="video">Vídeos</SelectItem>
            <SelectItem value="link">Links</SelectItem>
            <SelectItem value="game">Jogos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getResourceIcon(resource.type)}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getSubjectColor(resource.subject) }}
                  />
                </div>
                {getResourceBadge(resource.type)}
              </div>
              <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{resource.subject}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{resource.createdAt ? format(new Date(resource.createdAt), 'dd MMM, yyyy', { locale: ptBR }) : '-'}</span>
              </div>

              <div className="flex gap-2 pt-2">
                {resource.type === 'video' || resource.type === '' || resource.type === 'pdf' ? (
                  <div className='flex gap-2 pt-2 w-full'>
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resource.url;
                        link.download = resource.title || 'download';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>

                ) : (
                  <Button
                    variant="outline"
                    className='w-full'
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Acessar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum recurso encontrado</h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de pesquisa para encontrar os recursos desejados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Section */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              <span className="text-sm">Manuais Escolares</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Video className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Videoaulas</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Jogos Educativos</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link className="w-6 h-6 text-green-600" />
              <span className="text-sm">Plataformas Externas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}