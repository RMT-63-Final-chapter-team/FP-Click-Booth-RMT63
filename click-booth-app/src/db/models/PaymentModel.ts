import { PaymentType } from "@/type";
import { database } from "../config/mongodb";

export class PaymentModel {
  static async collection() {
    return database.collection<PaymentType>("payments");
  }

  static async create(payment: PaymentType) {
    const now = new Date();
    const record: PaymentType = {
      ...payment,
      createdAt: payment.createdAt || now,
      updatedAt: payment.updatedAt || now,
    };
    const result = (await this.collection()).insertOne(record);
    return result;
  }

  static async update(orderId: string, payment: Partial<PaymentType>) {
    const result = await (
      await this.collection()
    ).updateOne({ orderId }, { $set: { ...payment, updatedAt: new Date() } });
    return result;
  }

  static async findByOrderId(orderId: string) {
    return (await this.collection()).findOne({ orderId });
  }
}
