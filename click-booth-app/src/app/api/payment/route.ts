// ...existing code...
import { NextResponse } from "next/server";
import { PaymentModel } from "@/db/models/PaymentModel";
import { snapClient } from "@/helpers/midtrans";
import { ObjectId } from "mongodb";
import { getUserFromCookies } from "@/helpers/getUserFromCookies";

export async function POST(req: Request) {
  const body = await req.json();
  const amount = Number(body?.amount);
  const orderId =
    body?.orderId || `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (!amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Buat transaksi Midtrans
    const response = await snapClient.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: body?.username || body?.name || "Customer",
        // email: body?.email || "",
        // phone: body?.phone || "",
      },
      item_details: [
        {
          id: body?.itemId || orderId,
          price: Number(body?.itemPrice ?? amount),
          quantity: Number(body?.itemQuantity ?? 1),
          name: body?.itemName || "Buy Token",
        },
      ],
    });
    // if (!body.userId || !ObjectId.isValid(body.userId)) {
    //   return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    // }

    // Simpan ke DB
    await PaymentModel.create({
      orderId,
      // userId: body?.userId,
      userId: new ObjectId(user.id),
      amount,
      type: "token",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      token: response.token,
      redirectUrl: response.redirect_url,
      orderId,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
