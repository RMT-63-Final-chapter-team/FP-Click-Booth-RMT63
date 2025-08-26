"use client";

import { TOKEN_PACKAGES } from "@/helpers/tokenPackage";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, X, CreditCard, Check, Flame } from "lucide-react";
import Footer from "@/components/Footer";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const packages = (
    Object.entries(TOKEN_PACKAGES) as [
      keyof typeof TOKEN_PACKAGES,
      { price: number; tokens: number }
    ][]
  ).map(([id, data]) => {
    return {
      id,
      name:
        id === "basic"
          ? "Basic Pack"
          : id === "pro"
          ? "Pro Pack"
          : "Premium Pack",
      tokens: data.tokens,
      price: data.price,
      description:
        id === "basic"
          ? "10 tokens for basic photo editing features"
          : id === "pro"
          ? "30 tokens with advanced filters and effects"
          : "50 tokens with premium templates and unlimited downloads",
      popular: id === "pro", // contoh: jadikan Pro sebagai popular
      color:
        id === "basic" ? "slate-600" : id === "pro" ? "red-500" : "amber-500",
    };
  });

  useEffect(() => {
    if (!document.querySelector("script[data-midtrans-snap]")) {
      const s = document.createElement("script");
      s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      s.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
      );
      s.setAttribute("data-midtrans-snap", "1");
      document.body.appendChild(s);
    }
  }, []);

  const handlePackageSelect = (pkg: (typeof packages)[0]) => {
    setSelectedPackage(pkg.id);
    setShowPaymentModal(true);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const selectedPkg = packages.find((p) => p.id === selectedPackage);
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: selectedPackage,
          itemName: selectedPkg?.name || "Token Package",
          itemId: selectedPackage,
        }),
      });

      const data = await res.json();
      if (!data?.token) throw new Error(data?.error || "Token not received");

      // Store orderId for verification
      const orderId = data.orderId;

      if (!window.snap) {
        alert("Midtrans snap belum terload");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: async (result: unknown) => {
          console.log("Payment success", result);
          setVerifyingPayment(true);

          // Manual verification - check payment status and update tokens
          try {
            // Check payment status via our API
            const verifyRes = await fetch(`/api/payment/${orderId}`, {
              method: "GET",
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.status === "success") {
                alert(
                  "Payment successful! Tokens have been added to your account."
                );
                // Refresh the page to show updated token count
                window.location.reload();
              } else {
                alert(
                  "Payment is being processed. Tokens will be added shortly."
                );
              }
            } else {
              // Fallback: trigger manual verification
              const notifyRes = await fetch("/api/payment/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  order_id: orderId,
                  transaction_status: "settlement",
                  fraud_status: "accept",
                }),
              });

              if (notifyRes.ok) {
                alert(
                  "Payment successful! Tokens have been added to your account."
                );
                window.location.reload();
              } else {
                alert(
                  "Payment successful! Please refresh the page to see your tokens."
                );
              }
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert(
              "Payment successful! Please refresh the page to see your tokens."
            );
          } finally {
            setVerifyingPayment(false);
          }

          setShowPaymentModal(false);
        },
        onPending: (result: unknown) => {
          console.log("Payment pending", result);
          alert("Payment is being processed. Please wait for confirmation.");
        },
        onError: (result: unknown) => {
          console.error("Payment error", result);
          alert("Payment failed. Please try again.");
        },
        onClose: () => {
          console.log("Payment popup closed");
        },
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-red-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-red-200/30 to-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-100/20 to-red-100/20 rounded-full blur-3xl" />
      </div>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-gradient-to-br from-amber-600 via-amber-500 to-red-500 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20" />
          <div className="absolute top-20 right-0 w-32 h-32 bg-white rounded-full translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white rounded-full translate-y-12" />
        </div>

        <div className="container py-16 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
            >
              <span className="text-4xl text-slate-700">
                <Gem className="w-8 h-8 inline-block" />
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl font-bold text-white mb-4"
            >
              Token Packages
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
            >
              Choose the perfect package for your photo booth experience. Get
              more tokens, save more, and capture every moment beautifully.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      <div className="container py-12 relative z-10">
        {/* Package Selection */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto pt-8"
        >
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              whileHover={{
                scale: 1.03,
                y: -5,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePackageSelect(pkg)}
              className={`relative bg-white rounded-2xl shadow-xl border cursor-pointer transition-all duration-300 ${
                selectedPackage === pkg.id
                  ? "border-red-500 ring-4 ring-red-500/20 shadow-2xl"
                  : "border-amber-200 hover:border-red-300 hover:shadow-2xl"
              }`}
            >
              <div
                className={`${
                  pkg.popular ? "pt-8 pb-6 px-6" : "p-6"
                } text-center relative`}
              >
                {pkg.popular && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap border-2 border-white flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      Most Popular
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg ${
                    pkg.id === "basic"
                      ? "bg-slate-600"
                      : pkg.id === "pro"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                >
                  <span className="text-xl font-bold text-white">
                    {pkg.tokens}
                  </span>
                </motion.div>

                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  className="text-xl font-bold mb-3 text-slate-800"
                >
                  {pkg.name}
                </motion.h3>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                  className="mb-4 text-slate-600 leading-relaxed text-sm"
                >
                  {pkg.description}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                  className="mb-4"
                >
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    Rp {pkg.price.toLocaleString("id-ID")}
                  </div>
                  <div className="text-sm text-slate-500">
                    Rp{" "}
                    {Math.round(pkg.price / pkg.tokens).toLocaleString("id-ID")}{" "}
                    per token
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
                  className="space-y-2 mb-4"
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 bg-red-500 rounded-full"
                    ></motion.div>
                    <span className="text-slate-600 font-medium text-sm">
                      {pkg.tokens} Tokens included
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 bg-red-500 rounded-full"
                    ></motion.div>
                    <span className="text-slate-600 font-medium text-sm">
                      Premium photo filters
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-3 h-3 bg-red-500 rounded-full"
                    ></motion.div>
                    <span className="text-slate-600 font-medium text-sm">
                      WhatsApp sharing
                    </span>
                  </div>
                  {pkg.id !== "basic" && (
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-3 h-3 bg-red-500 rounded-full"
                      ></motion.div>
                      <span className="text-slate-600 font-medium text-sm">
                        Advanced editing tools
                      </span>
                    </div>
                  )}
                  {pkg.id === "premium" && (
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-3 h-3 bg-red-500 rounded-full"
                      ></motion.div>
                      <span className="text-slate-600 font-medium text-sm">
                        Unlimited downloads
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Select Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                  className="mt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      pkg.popular
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
                    }`}
                  >
                    Choose Package
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.7 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-10 border border-amber-200 shadow-xl"
        >
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="text-3xl font-bold mb-8 text-center text-slate-800"
          >
            🔒 Secure Payment
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.9 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-red-500 to-red-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <span className="text-2xl">🛡️</span>
              </motion.div>
              <h4 className="text-xl font-semibold mb-3 text-slate-800">
                SSL Protected
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Your payment data is encrypted and secure
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.0 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-amber-500 to-amber-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <span className="text-2xl">🏦</span>
              </motion.div>
              <h4 className="text-xl font-semibold mb-3 text-slate-800">
                Trusted Gateway
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Powered by Midtrans payment system
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.1 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-slate-600 to-slate-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <span className="text-2xl">⚡</span>
              </motion.div>
              <h4 className="text-xl font-semibold mb-3 text-slate-800">
                Instant Tokens
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Tokens added immediately after payment
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-amber-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-500 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    Payment Details
                  </h3>
                </motion.div>

                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </motion.button>
              </div>

              {/* Selected Package Info */}
              {selectedPkg && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 mb-6 border border-amber-200"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Gem className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">
                        {selectedPkg.name}
                      </h4>
                      <p className="text-amber-600 font-medium">
                        {selectedPkg.tokens} Tokens
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Package Price:</span>
                      <span className="font-semibold">
                        Rp {selectedPkg.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Price per Token:</span>
                      <span className="font-semibold">
                        Rp{" "}
                        {Math.round(
                          selectedPkg.price / selectedPkg.tokens
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="border-t border-amber-200 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">
                          Total:
                        </span>
                        <span className="text-2xl font-bold text-red-600">
                          Rp {selectedPkg.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePay}
                disabled={loading || verifyingPayment}
                className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Processing...</span>
                  </>
                ) : verifyingPayment ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Verifying Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay with Midtrans</span>
                  </>
                )}
              </motion.button>

              {/* Security Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>Secure payment powered by Midtrans</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-600 text-center leading-relaxed">
                    💡 <strong>Info:</strong> Tokens will be automatically added
                    to your account after successful payment. You may need to
                    refresh the page to see the updated balance.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </motion.div>
  );
}
