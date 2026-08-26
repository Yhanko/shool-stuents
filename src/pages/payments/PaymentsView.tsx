import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const multicaixaExpress = (student as any)?.institution?.multicaixaExpress || "Não configurado pela instituição";
  const paymentReference = (student as any)?.institution?.paymentReference || "Não configurado pela instituição";
  
  // Sync with context
  useEffect(() => {
    setPayments(contextPayments);
  }, [contextPayments]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isNewPayment, setIsNewPayment] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    type: 'tuition',
    amount: '',
    description: '',
  });
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const searchMatch = payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const pStatus = payment.status?.toLowerCase() || '';
    
    let statusMatch = true;
    if (statusFilter === 'pending') {
      statusMatch = pStatus === 'pending' && new Date(payment.dueDate) >= new Date();
    } else if (statusFilter === 'paid') {
      statusMatch = pStatus === 'paid' || pStatus === 'confirmed';
    } else if (statusFilter === 'overdue') {
      statusMatch = pStatus === 'pending' && new Date(payment.dueDate) < new Date();
    } else if (statusFilter !== 'all') {
      statusMatch = pStatus === statusFilter;
    }
    
    return searchMatch && statusMatch;
  });

  const totalPending = payments
    .filter(p => p.status?.toLowerCase() === 'pending' && new Date(p.dueDate) >= new Date())
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const totalPaid = payments
    .filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'confirmed')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const overduePayments = payments.filter(p => 
    p.status?.toLowerCase() === 'pending' && new Date(p.dueDate) < new Date()
  );

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'confirmed':
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
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'confirmed') return (
      <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-green-200 border-0 px-3 py-1 font-semibold tracking-wide">
        ✓ Pago
      </Badge>
    );
    if (s === 'processing') return (
      <Badge className="bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm shadow-blue-200 border-0 px-3 py-1 font-semibold tracking-wide animate-pulse">
        ⏳ Em Validação
      </Badge>
    );
    if (s === 'pending' && new Date(dueDate) < new Date()) {
      return (
        <Badge
          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}
          className="px-3 py-1 font-semibold"
        >
          Em Atraso
        </Badge>
      );
    }
    if (s === 'pending') return (
      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-orange-200 border-0 px-3 py-1 font-semibold tracking-wide">
        ◷ Pendente
      </Badge>
    );
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

  const handlePaymentSubmit = async (paymentId?: string) => {
    if (!metodoPagamento) {
      toast.error('Selecione um método de pagamento');
      return;
    }
    if (!proofFile && (metodoPagamento === 'transferencia' || metodoPagamento === 'multicaixa' || metodoPagamento === 'reference')) {
      toast.error('Anexe o comprovativo de pagamento');
      return;
    }
    if (isNewPayment && (!newPaymentData.amount || !newPaymentData.description)) {
      toast.error('Preencha o valor e a descrição do pagamento');
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (proofFile) {
        const uploadRes = await studentService.uploadFile(proofFile);
        fileUrl = uploadRes.path || uploadRes.url || '';
      }
      
      let pId = paymentId;
      if (isNewPayment) {
        const newPayment = await studentService.createPayment({
          studentId: student.id,
          type: newPaymentData.type,
          amount: Number(newPaymentData.amount),
          description: newPaymentData.description,
          dueDate: new Date().toISOString()
        });
        pId = newPayment.id;
      }
      
      if (!pId) throw new Error("ID de pagamento não encontrado");

      // Chamar a API verdadeira para enviar comprovativo
      await studentService.submitPaymentProof(pId, fileUrl, metodoPagamento);
      
      toast.success(isNewPayment ? 'Novo pagamento submetido com sucesso!' : 'Comprovativo enviado! Aguarde a confirmação da secretaria.');
      
      if (isNewPayment) {
        const addedPayment = {
          id: pId,
          type: newPaymentData.type,
          amount: Number(newPaymentData.amount),
          description: newPaymentData.description,
          status: 'processing',
          proofUrl: fileUrl,
          paymentMethod: metodoPagamento,
          dueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        setPayments(prev => [addedPayment as any, ...prev]);
      } else {
        setPayments(prev => prev.map(p => 
          p.id === pId ? { ...p, status: 'processing', proofUrl: fileUrl, paymentMethod: metodoPagamento } : p
        ));
      }

      setSelectedPayment(null);
      setIsNewPayment(false);
      setProofFile(null);
      setMetodoPagamento('');
      setNewPaymentData({ type: 'tuition', amount: '', description: '' });

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
        <Button onClick={() => setIsNewPayment(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          Fazer Pagamento
        </Button>
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
                        <Button 
                          size="sm" 
                          className="mt-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-md shadow-green-200 border-0 transition-all duration-200 hover:shadow-lg hover:scale-105"
                          onClick={() => setSelectedPayment(payment.id)}
                        >
                          💳 Pagar Agora
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
              const pStatus = payment.status?.toLowerCase();
              const isOverdue = pStatus === 'pending' && new Date(payment.dueDate) < new Date();
              
              return (
                <div key={payment.id} className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        pStatus === 'paid' || pStatus === 'confirmed' ? 'bg-green-100' :
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
                      {pStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedPayment(payment.id)}
                          className={`font-semibold shadow-md border-0 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                            isOverdue
                              ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-red-200'
                              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-green-200'
                          }`}
                        >
                          💳 Pagar
                        </Button>
                      )}
                      {(pStatus === 'paid' || pStatus === 'confirmed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-medium transition-all duration-200"
                        >
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

      {/* Global Payment Modal */}
      {(selectedPayment || isNewPayment) && (
        <Dialog 
          open={!!selectedPayment || isNewPayment} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPayment(null);
              setIsNewPayment(false);
            }
          }}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isNewPayment ? 'Fazer Novo Pagamento' : 'Efetuar Pagamento'}</DialogTitle>
            </DialogHeader>
            {(() => {
              const paymentToPay = isNewPayment ? null : payments.find(p => p.id === selectedPayment);
              if (!isNewPayment && !paymentToPay) return null;
              
              return (
                <div className="space-y-4">
                  {!isNewPayment ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">{paymentToPay?.description}</h4>
                      <p className="text-2xl font-bold text-blue-600">{paymentToPay?.amount.toFixed(2)}KZ</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Vencimento: {paymentToPay?.dueDate && format(new Date(paymentToPay.dueDate), 'dd MMM, yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tipo de Pagamento</label>
                        <Select value={newPaymentData.type} onValueChange={(v) => setNewPaymentData({...newPaymentData, type: v})}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tuition">Propina</SelectItem>
                            <SelectItem value="fee">Taxa Administrativa</SelectItem>
                            <SelectItem value="material">Material Escolar</SelectItem>
                            <SelectItem value="transport">Transporte</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Descrição (Mês a pagar, Exame, etc.)</label>
                        <Input 
                          placeholder="Ex: Propina de Maio" 
                          value={newPaymentData.description}
                          onChange={e => setNewPaymentData({...newPaymentData, description: e.target.value})}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Valor (KZ)</label>
                        <Input 
                          type="number"
                          placeholder="Ex: 5000" 
                          value={newPaymentData.amount}
                          onChange={e => setNewPaymentData({...newPaymentData, amount: e.target.value})}
                          className="bg-white"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Método de Pagamento</label>
                      <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">Cartão de Débito</SelectItem>
                          <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                          <SelectItem value="multicaixa">Multicaixa express</SelectItem>
                          <SelectItem value="reference">Pagamento por Referência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {metodoPagamento === 'multicaixa' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Pagamento via Multicaixa Express</h4>
                      <p className="text-sm text-blue-700 mb-3">
                          Transfira o valor para o Número da Instituição:
                      </p>
                      <div className="bg-white p-3 rounded border text-center">
                        <span className="font-mono text-lg font-bold">{multicaixaExpress}</span>
                      </div>
                      </div>
                    )}

                    {metodoPagamento === 'reference' && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">Pagamento por Referência</h4>
                        <div className="space-y-2 text-sm text-purple-900">
                          <div className="font-medium whitespace-pre-wrap">{paymentReference}</div>
                          <div className="text-purple-700 italic">Por favor, efetue o pagamento usando a referência e anexe o comprovativo abaixo.</div>
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
                        style={{ backgroundColor: '#ffffff', color: '#16a34a', border: '1.5px solid #16a34a' }}
                        className="flex-1 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!metodoPagamento || isSubmitting}
                        onClick={() => handlePaymentSubmit(paymentToPay?.id)}
                      >
                        {isSubmitting ? 'A Enviar...' : (isNewPayment ? 'Confirmar Pagamento' : 'Confirmar Pagamento')}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200"
                        onClick={() => {
                          setSelectedPayment(null);
                          setIsNewPayment(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}