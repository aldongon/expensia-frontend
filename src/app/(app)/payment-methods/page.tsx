'use client';

import { CreditCard } from 'lucide-react';

import { SimpleReferenceManager } from '@/components/reference/simple-reference-manager';
import { useCreatePaymentMethod, usePaymentMethods } from '@/lib/use-expenses';

export default function PaymentMethodsPage() {
  const paymentMethodsQuery = usePaymentMethods();
  const createMutation = useCreatePaymentMethod();

  return (
    <SimpleReferenceManager
      title="Métodos de pago"
      formHeading="Nuevo método de pago"
      fieldLabel="Nombre"
      placeholder="Ej. Visa"
      addLabel="Agregar método"
      emptyLabel="Aún no tenés métodos de pago."
      successMessage="Método de pago creado"
      errorMessage="No se pudo crear el método de pago."
      icon={<CreditCard className="size-6" />}
      items={paymentMethodsQuery.data ?? []}
      isPending={createMutation.isPending}
      onCreate={(name) => createMutation.mutateAsync({ name })}
    />
  );
}
