export interface UserType {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  tokens: number;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = "pending" | "success" | "failed";

export interface MidtransNotification {
  transaction_status: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  fraud_status?: string;
  status_code: string;
  signature_key: string;
  // [key: string]: any; // jaga-jaga kalau ada field lain
}

export interface PaymentType {
  orderId: string;
  userId: string;
  amount: number;
  type: "token";
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  rawNotification?: MidtransNotification;
}
