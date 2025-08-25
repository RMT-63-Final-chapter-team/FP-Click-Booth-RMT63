import { ObjectId as MongoObjectId } from "mongodb";

export type ObjectId = MongoObjectId;

export type NewPhotoInput = {
  userId?: ObjectId | null;
  url: string;
  publicId?: string;
  frame?: string;
  stickers?: string[];
  watermark?: string;
  enhancedUrl?: string;
  aiEnhanced?: boolean;
  filter?: string;
  shots?: number;
  layout?: string | null;
};

export type UploadBody = {
  imageData: string;
  frame?: string;
  stickers?: string[];
  watermark?: string;
  downloadOnly?: boolean;
  sendToWhatsapp?: boolean;
  phoneNumber?: string | null;
  filter?: string | null;
  shots?: number | null;
  layout?: string | null;
};

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
  // userId: string;
  userId: ObjectId;
  amount: number;
  type: "token";
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  rawNotification?: MidtransNotification;
}

export interface Photo {
  _id?: ObjectId;
  userId: ObjectId | null;
  url: string;
  publicId?: string;
  imageUrl?: string;
  frame?: string;
  stickers?: string[];
  watermark?: string;
  enhancedUrl?: string;
  aiEnhanced?: boolean;
  filter?: string | null;
  shots?: number | null;
  layout?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PhotoDoc {
  _id?: MongoObjectId;
  userId?: MongoObjectId | null;
  url: string;
  publicId?: string;
  imageUrl?: string;
  frame?: string;
  stickers?: string[];
  watermark?: string;
  enhancedUrl?: string;
  aiEnhanced?: boolean;
  filter?: string | null;
  shots?: number | null;
  layout?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}
