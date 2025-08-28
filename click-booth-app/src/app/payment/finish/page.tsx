"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { dispatchTokenUpdate } from "@/helpers/tokenUpdateHelper";

type VerifyResult = {
  ok: boolean;
  status: "success" | "pending" | "failed";
  message?: string;
};

export default function PaymentFinishPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const orderId = useMemo(() => sp.get("order_id") || "", [sp]);
  const transactionStatus = sp.get("transaction_status"); // capture | settlement | pending | deny | cancel | expire
  const fraudStatus = sp.get("fraud_status"); // accept | challenge | deny (kadang tidak ada)
  const [state, setState] = useState<
    "verifying" | "success" | "pending" | "failed"
  >("verifying");
  const [msg, setMsg] = useState("Finishing your payment...");

  useEffect(() => {
    if (!orderId) {
      setState("failed");
      setMsg("Invalid order_id.");
      return;
    }

    const verify = async () => {
      setState("verifying");
      setMsg("Verifying payment...");

      try {
        // 1) Coba verifikasi via endpoint status (pastikan Anda punya endpoint ini)
        const res = await fetch(`/api/payment/${encodeURIComponent(orderId)}`, {
          method: "GET",
        });
        if (res.ok) {
          const data = await res.json();
          // Harapkan { status: "success" | "pending" | "failed" }
          const s: VerifyResult = data;
          if (s.status === "success") {
            setState("success");
            setMsg("Payment verified. Tokens added to your account.");
            // Dispatch token update to refresh navbar
            dispatchTokenUpdate();
            // Refresh navbar badge/token setelah 1.5s lalu arahkan
            setTimeout(() => router.replace("/profile"), 2500);
            return;
          }
          if (s.status === "pending") {
            setState("pending");
            setMsg("Payment pending. We will add tokens once it is settled.");
            return;
          }
          setState("failed");
          setMsg(s.message || "Payment failed.");
          return;
        }

        // 2) Fallback (dev): trigger manual notify agar token ditambah
        const notify = await fetch("/api/payment/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            transaction_status:
              transactionStatus === "capture" && fraudStatus !== "challenge"
                ? "settlement"
                : transactionStatus || "settlement",
            fraud_status: fraudStatus || "accept",
          }),
        });

        if (notify.ok) {
          setState("success");
          setMsg("Payment processed. Tokens added to your account.");
          // Dispatch token update to refresh navbar
          dispatchTokenUpdate();
          setTimeout(() => router.replace("/profile"), 1500);
        } else {
          setState("pending");
          setMsg(
            "We received your payment. Please wait a moment then refresh."
          );
        }
      } catch (e) {
        console.error(e);
        setState("pending");
        setMsg("Could not verify now. We will sync shortly.");
      }
    };

    verify();
  }, [orderId, transactionStatus, fraudStatus, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 px-4 pt-24">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-100/30 to-blue-100/30 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="w-full max-w-lg bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 shadow-2xl text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            type: "spring",
            bounce: 0.4,
          }}
          className="mb-6"
        >
          {state === "verifying" && (
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            </div>
          )}
          {state === "success" && (
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              </motion.div>
            </div>
          )}
          {state === "pending" && (
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          )}
          {state === "failed" && (
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-bold text-slate-800 mb-3"
        >
          {state === "success"
            ? "Payment Successful! 🎉"
            : state === "failed"
            ? "Payment Failed"
            : state === "pending"
            ? "Payment Pending"
            : "Verifying Payment..."}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-slate-600 mb-8 leading-relaxed"
        >
          {msg}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 rounded-2xl p-6 text-sm text-slate-700 mb-8 shadow-inner"
        >
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Payment Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Order ID</span>
              <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">
                {orderId || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Status</span>
              <span
                className={`font-medium px-2 py-1 rounded-full text-xs ${
                  transactionStatus === "capture" ||
                  transactionStatus === "settlement"
                    ? "bg-green-100 text-green-700"
                    : transactionStatus === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {transactionStatus || "-"}
              </span>
            </div>
            {fraudStatus && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Security Check</span>
                <span
                  className={`font-medium px-2 py-1 rounded-full text-xs ${
                    fraudStatus === "accept"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {fraudStatus}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.replace("/profile")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Go to Profile
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.replace("/payment")}
            className="px-6 py-3 rounded-xl border border-gray-300 text-slate-700 bg-white hover:bg-gray-50 font-semibold shadow-lg transition-all duration-300"
          >
            Back to Payment
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
