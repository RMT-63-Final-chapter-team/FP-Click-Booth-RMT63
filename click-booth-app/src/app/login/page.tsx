"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogIn,
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { dispatchAuthUpdate } from "@/helpers/tokenUpdateHelper";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: { message?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setMessage(data?.message || "Login failed");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // optional: immediately validate and warm /api/me (trusted)
      try {
        const userResponse = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.authenticated) {
            // Dispatch auth update to notify navbar
            dispatchAuthUpdate("login", {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              tokens: userData.tokens || 0,
            });
          }
        }
      } catch {
        /* ignore */
      }

      setMessage("Login successful! Redirecting...");
      setMessageType("success");
      setTimeout(() => router.push("/"), 600);
    } catch (err) {
      console.log("🚀 ~ handleLogin ~ err:", err);
      setMessage("An error occurred during login.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="w-16 h-16 bg-red-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600">Sign in to your ClickBooth account</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-lg border mb-6 ${
              messageType === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {messageType === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-6"
          suppressHydrationWarning
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                placeholder="Enter your email"
                required
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                placeholder="Enter your password"
                required
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors shadow-lg ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
            suppressHydrationWarning
          >
            {!loading && <LogIn className="w-5 h-5" />}
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-amber-200">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
