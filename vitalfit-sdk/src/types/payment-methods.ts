export type PaymentMethod = {
  method_id: string;
  name: string;
  type: string;
  description: string;
  processing_type: string;
  configuration: PaymentConfiguration;
  visibility: BranchPaymentVisibility;
  surcharge_fixed: number;
  surcharge_percentage: number;
  global_status: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodTypes = {};

export type CreatePaymentMethod = {
  description: string;
  name: string;
  processing_type: 'Gateway' | 'Offline';
  type: 'Cash' | 'Card' | 'Transfer' | 'Other';
  configuration: PaymentConfiguration;
  display_name: string;
  method_id: string;
  surcharge_fixed: number;
  surcharge_percentage: number;
  visibility: BranchPaymentVisibility;
};

export type ZelleConfig = {
  email: string;
};

export type BankTransferConfig = {
  bank_name: string;
  account_number: string;
  tax_id: string;
};

export type PagoMovilConfig = {
  phone: string;
  bank_id: string;
  tax_id: string;
};

export type BranchPaymentVisibility = 'Client' | 'Staff' | 'All';

export type PaymentConfiguration =
  | ZelleConfig
  | BankTransferConfig
  | PagoMovilConfig
  | Record<string, any>;

export type BranchPaymentMethod = {
  branch_id: string;
  configuration: PaymentConfiguration;
  created_at: string;
  display_name: string;
  is_active: boolean;
  method_id: string;
  surcharge_fixed: number;
  surcharge_percentage: number;
  updated_at: string;
  visibility: BranchPaymentVisibility;
};

export type UpdateBranchPaymentMethod = {
  is_active?: boolean;
};

export type BranchPaymentMethodInfo = {
  branch_id: string;
  method_id: string;
  is_active: boolean;
  name: string;
  type: string;
};
