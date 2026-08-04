import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStudent } from '@/contexts/StudentContext';
import { CreditCard, Download, Search, AlertTriangle, CheckCircle, Clock, Calendar, Receipt, Coins } from '../../lib/icons';
import { studentService } from '@/services/api/studentService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PaymentsView() {
  const { payments: contextPayments, student } = useStudent();
  const [payments, setPayments] = useState(contextPayments);
  const iban = (student as any)?.institution?.iban || "Não configurado pela instituição";
  
  // Sync with context
  useEffect(() => {
    setPayments(contextPayments);
  }, [contextPayments]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const searchMatch = payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || payment.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const overduePayments = payments.filter(p => 
    p.status === 'pending' && new Date(p.dueDate) < new Date()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'paid') return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Pago</Badge>;
    if (status === 'processing') return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Em Validação</Badge>;
    if (status === 'pending' && new Date(dueDate) < new Date()) {
      return <Badge variant="destructive">Em Atraso</Badge>;
    }
    if (status === 'pending') return <Badge variant="secondary">Pendente</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'tuition':
        return 'Propina';
      case 'fee':
        return 'Taxa';
      case 'material':
        return 'Material';
      case 'transport':
        return 'Transporte';
      default:
        return type;
    }
  };

  const handlePaymentSubmit = async (paymentId: string) => {
    if (!metodoPagamento) {
      toast.error('Selecione um método de pagamento');
      return;
    }
    if (!proofFile && (metodoPagamento === 'transferencia' || metodoPagamento === 'multicaixa')) {
      toast.error('Anexe o comprovativo de pagamento');
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (proofFile) {
        const uploadRes = await studentService.uploadFile(proofFile);
        fileUrl = uploadRes.path || uploadRes.url || '';
      }
      
      // Chamar a API verdadeira para enviar comprovativo
      await studentService.submitPaymentProof(paymentId, fileUrl, metodoPagamento);
      
      toast.success('Comprovativo enviado! Aguarde a confirmação da secretaria.');
      setSelectedPayment(null);
      setProofFile(null);
      
      // Atualizar o state local para refletir que está em processamento
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, status: 'processing', proofUrl: fileUrl, paymentMethod: metodoPagamento } : p
      ));

    } catch (error) {
      toast.error('Erro ao enviar o pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  payments.find(p => p.id === selectedPayment);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-600">Gerir propinas e outros pagamentos escolares</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-red-100 rounded-lg mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pendente</p>
              <p className="text-2xl font-bold text-gray-900">KZ{totalPending.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pago Este Ano</p>
              <p className="text-2xl font-bold text-gray-900">KZ{totalPaid.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Em Atraso</p>
              <p className="text-2xl font-bold text-gray-900">{overduePayments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pagamentos</p>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  Atenção: {overduePayments.length} pagamento(s) em atraso
                </h3>
                <div className="space-y-2">
                  {overduePayments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">{payment.description}</p>
                        <p className="text-sm text-red-700">
                          Venceu em {format(new Date(payment.dueDate), 'dd MMM, yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-900">KZ{payment.amount.toFixed(2)}</p>
                        <Button size="sm" className="mt-1 bg-green-500 hover:bg-green-600">
                          Pagar Agora
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Em Atraso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map(payment => {
              const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
              
              return (
                <div key={payment.id} className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        payment.status === 'paid' ? 'bg-green-100' :
                        isOverdue ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {getStatusIcon(payment.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{payment.description}</h3>
                          {getStatusBadge(payment.status, payment.dueDate)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            <span>KZ{payment.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Vence: {format(new Date(payment.dueDate), 'dd MMM, yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span>{getPaymentTypeLabel(payment.type)}</span>
                          </div>
                        </div>
                        {payment.paidDate && (
                          <p className="text-sm text-green-600 mt-2">
                            Pago em {format(new Date(payment.paidDate), 'dd MMM, yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {payment.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedPayment(payment.id)} className='bg-green-500 hover:bg-green-600'>
                              Pagar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Efetuar Pagamento</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">{payment.description}</h4>
                                <p className="text-2xl font-bold text-blue-600">{payment.amount.toFixed(2)}KZ</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Vencimento: {format(new Date(payment.dueDate), 'dd MMM, yyyy', { locale: ptBR })}
                                </p>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Método de Pagamento</label>
                                  <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                                      <SelectItem value="transfer">Transferência Bancária</SelectItem>
                                      <SelectItem value="mbway">Multicaixa express</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {metodoPagamento === 'multicaixa' && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <h4 className="font-medium text-blue-800 mb-2">Pagamento via Multicaixa</h4>
                                  <p className="text-sm text-blue-700 mb-3">
                                      Transfira o valor para o IBAN da Instituição:
                                  </p>
                                  <div className="bg-white p-3 rounded border text-center">
                                    <span className="font-mono text-lg font-bold">{iban}</span>
                                  </div>
                                  </div>
                                )}

                                {metodoPagamento === 'transferencia' && (
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-medium text-green-800 mb-2">Dados para Transferência</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>IBAN da Instituição:</strong> {iban}</div>
                                      <div className="text-gray-600 italic">Por favor, faça a transferência para este IBAN e anexe o comprovativo abaixo.</div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Comprovativo (PDF/Imagem)</label>
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      type="file" 
                                      accept=".pdf,image/*" 
                                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <Button 
                                    className="flex-1 bg-green-500 hover:bg-green-600" 
                                    disabled={!metodoPagamento || isSubmitting}
                                    onClick={() => handlePaymentSubmit(payment.id)}
                                  >
                                    {isSubmitting ? 'A Enviar...' : 'Confirmar Pagamento'}
                                  </Button>
                                  <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {payment.status === 'paid' && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Recibo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}