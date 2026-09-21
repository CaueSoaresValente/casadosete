export const PAYMENT_STATUSES = [
  { value: 'a_combinar', label: 'Pagamento a combinar' },
  { value: 'pendente', label: 'Pagamento pendente' },
  { value: 'aprovado', label: 'Pagamento aprovado' },
  { value: 'recusado', label: 'Pagamento recusado' },
  { value: 'cancelado', label: 'Pagamento cancelado' },
  { value: 'reembolsado', label: 'Pagamento reembolsado' },
];

export function getPaymentStatusLabel(statusValue: string): string {
  const status = PAYMENT_STATUSES.find(s => s.value === statusValue);
  return status ? status.label : "Status não identificado";
}
