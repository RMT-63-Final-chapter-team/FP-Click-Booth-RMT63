"use client";

import { useEffect, useState } from "react";

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
  const [amount, setAmount] = useState<number>(100000);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("basic");

  const packages = [
    {
      id: "basic",
      name: "Basic Pack",
      tokens: 10,
      price: 50000,
      description: "10 tokens for basic photo editing features",
      popular: false,
      color: "charcoal-600",
    },
    {
      id: "pro",
      name: "Pro Pack",
      tokens: 25,
      price: 100000,
      description: "25 tokens with advanced filters and effects",
      popular: true,
      color: "coral-600",
    },
    {
      id: "premium",
      name: "Premium Pack",
      tokens: 50,
      price: 180000,
      description: "50 tokens with premium templates and unlimited downloads",
      popular: false,
      color: "sage-600",
    },
  ];

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
    setAmount(pkg.price);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const selectedPkg = packages.find((p) => p.id === selectedPackage);
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          itemName: selectedPkg?.name || "Token Package",
          itemId: selectedPackage,
        }),
      });

      const data = await res.json();
      if (!data?.token) throw new Error(data?.error || "Token not received");

      if (!window.snap) {
        alert("Midtrans snap belum terload");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: (result: unknown) => {
          console.log("Payment success", result);
          // You can redirect to success page or show success message
          alert("Payment successful! Tokens will be added to your account.");
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
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <div className="bg-white border-b border-charcoal-200 shadow-sm">
        <div className="container py-4">
          <h1 className="text-heading-2 text-center">Token Packages</h1>
          <p className="text-center text-body mt-1">
            Choose your perfect package and unlock premium features
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Package Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg)}
              className={`card cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                selectedPackage === pkg.id
                  ? "border-coral-500 ring-4 ring-coral-500/20"
                  : "border-charcoal-200 hover:border-coral-300"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-coral-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    🔥 Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div
                  className={`w-16 h-16 rounded-2xl bg-${pkg.color} flex items-center justify-center mb-4 mx-auto`}
                >
                  <span className="text-xl font-bold text-white">
                    {pkg.tokens}
                  </span>
                </div>

                <h3 className="text-heading-3 text-center mb-2">{pkg.name}</h3>
                <p className="text-body text-center mb-4">{pkg.description}</p>

                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-warmRed-700">
                    Rp {pkg.price.toLocaleString("id-ID")}
                  </div>
                  <div className="text-body-small">
                    Rp{" "}
                    {Math.round(pkg.price / pkg.tokens).toLocaleString("id-ID")}{" "}
                    per token
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-warmRed-500 rounded-full"></div>
                    <span className="text-body">
                      {pkg.tokens} Tokens included
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-warmRed-500 rounded-full"></div>
                    <span className="text-body">Premium photo filters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-warmRed-500 rounded-full"></div>
                    <span className="text-body">WhatsApp sharing</span>
                  </div>
                  {pkg.id !== "basic" && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-warmRed-500 rounded-full"></div>
                      <span className="text-body">Advanced editing tools</span>
                    </div>
                  )}
                  {pkg.id === "premium" && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-warmRed-500 rounded-full"></div>
                      <span className="text-body">Unlimited downloads</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="card p-8 mb-8">
          <h2 className="text-heading-3 mb-6 text-center">
            🛒 Payment Summary
          </h2>

          <div className="max-w-md mx-auto">
            <div className="bg-cream-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-body font-medium">Selected Package:</span>
                <span className="text-body-strong">{selectedPkg?.name}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-body font-medium">Tokens:</span>
                <span className="text-body-strong">
                  {selectedPkg?.tokens} tokens
                </span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span className="text-body font-medium">Total Amount:</span>
                <span className="text-body-strong text-coral-600">
                  Rp {amount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-body font-medium mb-2"
                >
                  Custom Amount (optional)
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="input w-full"
                  placeholder="Enter custom amount"
                />
              </div>

              <button
                onClick={handlePay}
                disabled={loading || !amount || amount <= 0}
                className="btn btn-primary w-full text-lg py-4 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>💳</span>
                    <span>Pay with Midtrans</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-cream-50 rounded-3xl p-8 border border-charcoal-200">
          <h3 className="text-heading-3 mb-4 text-center">🔒 Secure Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-coral-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                🛡️
              </div>
              <h4 className="text-body-strong mb-2">SSL Protected</h4>
              <p className="text-body-small">
                Your payment data is encrypted and secure
              </p>
            </div>
            <div className="text-center">
              <div className="bg-sage-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                🏦
              </div>
              <h4 className="text-body-strong mb-2">Trusted Gateway</h4>
              <p className="text-body-small">
                Powered by Midtrans payment system
              </p>
            </div>
            <div className="text-center">
              <div className="bg-coral-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                ⚡
              </div>
              <h4 className="text-body-strong mb-2">Instant Tokens</h4>
              <p className="text-body-small">
                Tokens added immediately after payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
