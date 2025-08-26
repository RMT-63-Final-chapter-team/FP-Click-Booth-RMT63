import { NextResponse } from "next/server";
import { PaymentModel } from "@/db/models/PaymentModel";
import { snapClient } from "@/helpers/midtrans";
import { ObjectId } from "mongodb";
import { getUserFromCookies } from "@/helpers/getUserFromCookies";
import {
  PackageName,
  resolvePackage,
  TOKEN_PACKAGES,
} from "@/helpers/tokenPackage";

interface PaymentConfig {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: {
    first_name: string;
    email?: string;
    phone?: string;
  };
  item_details: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  enabled_payments?: string[];
  credit_card?: {
    secure: boolean;
  };
  cstore?: {
    store: string;
  };
  custom_field1?: string; // tokenAmount
  custom_field2?: string; // packageName
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export async function POST(req: Request) {
  const body = await req.json();
  const amount = Number(body?.amount);
  const paymentMethod = body?.paymentMethod || "all";
  // ⬇️ ambil paket & hitung price/tokens dari mapping (abaikan amount dari client)
  const packageName: PackageName = resolvePackage(body?.packageType);
  const { price, tokens: tokenAmount } = TOKEN_PACKAGES[packageName];
  const orderId =
    body?.orderId || `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (!price || isNaN(price) || price <= 0) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // AMBIL EMAIL DARI USER SESSION ATAU BODY
    const userEmail = user.email || body?.email || "";
    const userPhone = body?.phone || "";

    // BUILD CUSTOMER DETAILS DENGAN EMAIL YANG VALID
    const customerDetails: PaymentConfig["customer_details"] = {
      first_name:
        body?.username || body?.name || user.email?.split("@")[0] || "Customer",
    };

    // HANYA TAMBAHKAN EMAIL JIKA VALID
    if (isValidEmail(userEmail)) {
      customerDetails.email = userEmail.trim();
    }

    // HANYA TAMBAHKAN PHONE JIKA ADA
    if (userPhone && userPhone.length >= 10) {
      customerDetails.phone = userPhone.replace(/\D/g, ""); // hapus non-digit
    }

    // Buat transaksi Midtrans
    const paymentConfig: PaymentConfig = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      customer_details: customerDetails,
      // {
      //   first_name: body?.username || body?.name || "Customer",
      // },
      item_details: [
        {
          id: body?.itemId || orderId,
          price,
          quantity: Number(body?.itemQuantity ?? 1),
          name: body?.itemName || "Buy Token",
        },
      ],
      custom_field1: String(tokenAmount), // ⬅️ opsional, enak buat inspeksi di dashboard
      custom_field2: packageName,
    };

    // SWITCH CASE UNTUK PAYMENT METHOD
    switch (paymentMethod) {
      case "credit_card":
        paymentConfig.credit_card = { secure: true };
        paymentConfig.enabled_payments = ["credit_card"];
        break;

      case "bank_transfer":
        paymentConfig.enabled_payments = ["bank_transfer"];
        break;

      case "gopay":
        paymentConfig.enabled_payments = ["gopay"];
        break;

      case "shopeepay":
        paymentConfig.enabled_payments = ["shopeepay"];
        break;

      case "qris":
        paymentConfig.enabled_payments = ["qris"];
        break;

      case "dana":
        paymentConfig.enabled_payments = ["dana"];
        break;

      case "ovo":
        paymentConfig.enabled_payments = ["ovo"];
        break;

      case "indomaret":
        paymentConfig.enabled_payments = ["cstore"];
        paymentConfig.cstore = { store: "indomaret" };
        break;

      case "alfamart":
        paymentConfig.enabled_payments = ["cstore"];
        paymentConfig.cstore = { store: "alfamart" };
        break;

      default: // "all"
        paymentConfig.credit_card = { secure: true };
        paymentConfig.enabled_payments = [
          "credit_card",
          "bank_transfer",
          "gopay",
          "shopeepay",
          "qris",
          "dana",
          "ovo",
          "cstore",
        ];
        break;
    }
    console.log("Payment Config:", {
      orderId,
      amount,
      paymentMethod,
      customerEmail: customerDetails.email || "NO_EMAIL",
      customerName: customerDetails.first_name,
    });
    // Buat transaksi Midtrans
    const response = await snapClient.createTransaction(paymentConfig);

    // Simpan ke DB
    await PaymentModel.create({
      orderId,
      // userId: body?.userId,
      userId: new ObjectId(user.id),
      amount: price,
      packageName,
      type: "token",
      tokens: tokenAmount,
      paymentMethod,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      token: response.token,
      redirectUrl: response.redirect_url,
      orderId,
      paymentMethod,
      customerEmail: customerDetails.email || null,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
