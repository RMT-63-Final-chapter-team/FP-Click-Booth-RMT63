import { NextResponse } from "next/server";
import { coreClient } from "@/helpers/midtrans";
import { PaymentModel } from "@/db/models/PaymentModel";
import { UserModel } from "@/db/models/UserModel";
// import { UserModel } from "@/db/models/UserModel";

// Midtrans akan mengirim POST ke endpoint ini
export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    console.log("🚀 ~ POST ~ body:", body);

    // Ambil order_id dari notifikasi Midtrans
    const orderId = body?.order_id;
    if (!orderId) {
      console.error("❌ order_id missing in notification");
      return NextResponse.json(
        { error: "Invalid notification" },
        { status: 400 }
      );
    }

    // Cek status transaksi ke Midtrans (pakai CoreApi)
    const statusResponse = await coreClient.transaction.status(orderId);
    console.log("Midtrans status response:", statusResponse);
    // Mapping status Midtrans ke sistem kita

    let newStatus: "pending" | "success" | "failed" = "pending";
    switch (statusResponse.transaction_status) {
      case "capture":
      case "settlement":
        newStatus = "success";
        break;
      case "deny":
      case "expire":
      case "cancel":
        newStatus = "failed";
        break;
      default:
        newStatus = "pending";
    }
    // Cari payment di DB
    const payment = await PaymentModel.findByOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update MongoDB
    const result = await PaymentModel.update(orderId, {
      status: newStatus,
      rawNotification: body,
      updatedAt: new Date(),
    });
    console.log("Update result:", result);
    // Kalau sukses → tambah token user
    if (newStatus === "success" && payment.userId) {
      await UserModel.incrementToken(
        payment.userId.toString(),
        payment.tokens // pake jumlah token dari DB, bukan hardcode
      );
    }

    return NextResponse.json({ message: "OK", orderId, status: newStatus });
  } catch (err) {
    console.error("Midtrans notify error:", err);
    return NextResponse.json({ error: "Notify failed" }, { status: 500 });
  }
};
