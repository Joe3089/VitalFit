import { fetchAPI } from "@/lib/api";
import { PaymentMethod } from "@/models/paymentMethod";

interface ApiPaymentMethod {
  method_id: string;
  name: string;
  type: string;
  description: string;
  global_status: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: ApiPaymentMethod[];
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const res: ApiResponse = await fetchAPI("/branches/payment-methods");

  if (!res.data) {
    console.error("Respuesta de API inválida, falta 'data'");
    return [];
  }

  const mappedData: PaymentMethod[] = res.data.map((method) => ({
    id: method.method_id,
    name: method.name,
    type: method.type,
    description: method.description,
  }));

  return mappedData;
}
