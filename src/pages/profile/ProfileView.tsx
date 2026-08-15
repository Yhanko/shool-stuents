import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStudent } from '@/contexts/StudentContext';
import { User, Mail, Calendar, GraduationCap, Hash, Camera, Lock, Edit, Save, X, Eye, EyeOff } from '../../lib/icons';
import { studentService } from '@/services/api/studentService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProfileView() {
  const { student, updateStudentData } = useStudent();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: student.name,
    email: student.email
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Se houver backend, fazer requisição aqui para upload. 
        // Por agora, atualizamos o state global.
        updateStudentData({ avatar: base64String });
        toast.success('Foto atualizada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await studentService.updateProfile({ name: editedData.name, email: editedData.email });
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      updateStudentData({ name: editedData.name, email: editedData.email }); 
    } catch (error) {
      toast.error('Erro ao atualizar o perfil.');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As palavras-passe não coincidem');
      return;
    }
    try {
      await studentService.changePassword({ 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      toast.success('Palavra-passe alterada com sucesso!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Erro ao alterar a palavra-passe. Verifique a sua palavra-passe atual.');
    }
  };

  // Calculate age only if birthDate is present
  const birthDate = (student as any).birthDate ? new Date((student as any).birthDate) : null;
  const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil do Aluno</h1>
          <p className="text-gray-600">Gerir informações pessoais e configurações da conta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo and Basic Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto overflow-hidden">
                  {student.avatar ? (
                    <img src={student.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    student.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{student.name}</h2>
              <p className="text-gray-600 mb-2">{student.class}</p>
              <p className="text-sm text-gray-500">Nº {student.enrollmentNumber}</p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ano Letivo</span>
                <span className="font-medium">{student.year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Turma</span>
                <span className="font-medium">{student.class}</span>
              </div>
              {age !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Idade</span>
                  <span className="font-medium">{age} anos</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Matrícula</span>
                <span className="font-medium">{student.enrollmentNumber}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informações Pessoais
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={editedData.name}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{student.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedData.email}
                      onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{student.email}</span>
                    </div>
                  )}
                </div>

                {birthDate && (
                  <>
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{format(birthDate, 'dd MMMM, yyyy', { locale: ptBR })}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Idade</Label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{age} anos</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                Informações Acadêmicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Número de Estudante</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span>{student.enrollmentNumber}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Turma</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span>{student.class}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ano Letivo</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{student.year}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Palavra-passe</h4>
                    <p className="text-sm text-gray-600">Altere a sua palavra-passe de acesso</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Palavra-passe
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alterar Palavra-passe</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Palavra-passe Atual</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 m-0 bg-transparent border-none appearance-none flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nova Palavra-passe</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 m-0 bg-transparent border-none appearance-none flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Nova Palavra-passe</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 m-0 bg-transparent border-none appearance-none flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleChangePassword} className="flex-1">
                            Alterar Palavra-passe
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>


              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}