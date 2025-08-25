import MidtransClient from "midtrans-client";

const isProduction = false; // sandbox

export const snapClient = new MidtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
});

export const coreClient = new MidtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});
