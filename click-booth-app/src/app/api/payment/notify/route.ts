import { NextResponse } from "next/server";
import { snapClient } from "@/helpers/midtrans";
import { PaymentModel } from "@/db/models/PaymentModel";

// Midtrans akan mengirim POST ke endpoint ini
export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // Ambil order_id dari notifikasi Midtrans
    const orderId = body?.order_id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Invalid notification" },
        { status: 400 }
      );
    }

    // Cek status transaksi ke Midtrans
    const statusResponse = await snapClient.transaction.status(orderId);

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

    // Update MongoDB
    await PaymentModel.update(orderId, {
      status: newStatus,
      rawNotification: body,
    });

    return NextResponse.json({ message: "OK", orderId, status: newStatus });
  } catch (err) {
    console.error("Midtrans notify error:", err);
    return NextResponse.json({ error: "Notify failed" }, { status: 500 });
  }
};
