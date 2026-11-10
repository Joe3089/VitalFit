export interface Membership {
  membership_id: string;
  client: string;
  membership_type: string;
  membership_name: string;
  expiration_date: string;
  days_remaining: number;
  amount: string;
  reminders: "sent" | "not_sent" | "scheduled";
  status: "completed" | "pending" | "renewed" | "expired";
  email?: string; 
  start_date?: string; 
  next_payment?: string; 
}

export const mockMemberships: Membership[] = [
  {
    membership_id: "1",
    client: "Juan Pérez",
    membership_type: "Premium",
    membership_name: "Plan Anual Gold",
    expiration_date: "2024-02-15",
    days_remaining: 1,
    amount: "$150.00 USD",
    reminders: "sent",
    status: "completed"
  },
  {
    membership_id: "2",
    client: "María García",
    membership_type: "Básico",
    membership_name: "Plan Mensual",
    expiration_date: "2024-12-01",
    days_remaining: 300,
    amount: "$20.00 USD",
    reminders: "not_sent",
    status: "pending"
  },
  {
    membership_id: "3",
    client: "Carlos López",
    membership_type: "Premium",
    membership_name: "Plan Trimestral",
    expiration_date: "2024-02-16",
    days_remaining: 2,
    amount: "$20.00 USD",
    reminders: "scheduled",
    status: "renewed"
  },
  {
    membership_id: "4",
    client: "Ana Martínez",
    membership_type: "VIP",
    membership_name: "Plan Semestral",
    expiration_date: "2024-01-30",
    days_remaining: -5,
    amount: "$20.00 USD",
    reminders: "sent",
    status: "expired"
  }
];