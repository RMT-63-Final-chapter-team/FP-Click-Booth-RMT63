import { NextRequest, NextResponse } from "next/server";
import { PaymentModel } from "@/db/models/PaymentModel";
import { coreClient } from "@/helpers/midtrans";
import { UserModel } from "@/db/models/UserModel";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const { orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Ambil dari DB
    let payment = await PaymentModel.findByOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Kalau masih pending → cek status ke Midtrans
    if (payment.status === "pending") {
      try {
        const statusResponse = await coreClient.transaction.status(orderId);

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
        }

        // Update DB kalau ada perubahan
        if (newStatus !== payment.status) {
          await PaymentModel.update(orderId, {
            status: newStatus,
            rawNotification: statusResponse,
            updatedAt: new Date(),
          });

          // Kalau sukses → tambah token user
          if (newStatus === "success" && payment.userId) {
            await UserModel.incrementToken(
              payment.userId.toString(),
              payment.tokens
            );
          }

          payment = await PaymentModel.findByOrderId(orderId); // ambil data terbaru
        }
      } catch (err) {
        console.error("Midtrans status check error:", err);
      }
    }

    return NextResponse.json({
      orderId: payment?.orderId,
      userId: payment?.userId,
      amount: payment?.amount,
      status: payment?.status,
      type: payment?.type,
      tokens: payment?.tokens,
      packageName: payment?.packageName,
      createdAt: payment?.createdAt,
      updatedAt: payment?.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/payment/[orderId] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
