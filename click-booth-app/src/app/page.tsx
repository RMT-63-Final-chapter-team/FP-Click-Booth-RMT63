"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Camera, Palette, Smartphone, Gem, Check, Star } from "lucide-react";
import Footer from "@/components/Footer";
import { BackgroundLines } from "@/components/ui/background-beams-with-collision";
import { BoxesCore } from "@/components/ui/background-boxes";
// import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

export default function Home() {
  const features = [
    {
      icon: Camera,
      title: "Professional Photo Booth",
      description:
        "High-quality camera with professional lighting and filters for perfect shots.",
    },
    {
      icon: Palette,
      title: "Advanced Editing Tools",
      description:
        "Premium filters, effects, and editing tools to enhance your photos effortlessly.",
    },
    {
      icon: Smartphone,
      title: "Instant WhatsApp Share",
      description: "Share photos instantly to WhatsApp or download directly.",
    },
    {
      icon: Gem,
      title: "Token-based System",
      description:
        "Purchase tokens to unlock premium features and unlimited downloads.",
    },
  ];

  const plans = [
    {
      name: "Basic",
      price: "IDR 20.000",
      tokens: 10,
      features: [
        "10 Photo Sessions",
        "Basic Filters",
        "WhatsApp Share",
        "Standard Quality",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "IDR 55.000",
      tokens: 30,
      features: [
        "25 Photo Sessions",
        "Premium Filters",
        "WhatsApp Share",
        "HD Quality",
        "Advanced Editing",
      ],
      popular: true,
    },
    {
      name: "Premium",
      price: "IDR 90.000",
      tokens: 50,
      features: [
        "50 Photo Sessions",
        "All Filters & Effects",
        "Unlimited Sharing",
        "4K Quality",
        "Premium Templates",
        "Priority Support",
      ],
      popular: false,
    },
  ];

  return (
    <div className="bg-amber-50 text-slate-900">
      {/* Hero Section */}
      <BackgroundLines className="relative overflow-hidden min-h-screen bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200">
        {/* <BoxesCore className="absolute inset-0 z-0 opacity-40 pointer-events-none" /> */}
        <div className="absolute inset-0 z-0">
          <BoxesCore className="w-full h-full opacity-50" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center container mx-auto max-w-7xl">
          {/* <div className="relative h-screen">
            <BoxesCore className="absolute inset-0 z-10 opacity-50" />
          </div> */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pb-20 md:pb-28 text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Professional Photo Booth with{" "}
              <span className="text-red-600">AI</span> Precision
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Experience premium photo results, AI-powered filters, and instant
              sharing—crafted for modern events and brands.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/layout-selection"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-red-500 text-white font-semibold shadow-sm hover:bg-red-600 transition"
              >
                <Camera className="w-5 h-5" />
                Start Photo Session
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-amber-300 text-slate-800 hover:bg-amber-100 transition"
              >
                Explore Features
              </Link>
            </div>
          </motion.div>
        </div>
      </BackgroundLines>

      {/* Features */}
      <section id="features" className="py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Why Choose ClickBooth?
            </h2>
            <p className="mt-3 text-slate-600">
              Future-ready photo booth technology with professional-grade
              features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className="group relative rounded-xl border border-amber-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 mb-4">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {feature.description}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-red-600/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-20 bg-amber-100">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Choose Your Plan
            </h2>
            <p className="mt-3 text-slate-600">
              Select the perfect token package for your photo booth needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className={`relative rounded-2xl border bg-white shadow-sm transition ${
                  plan.popular
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-amber-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-red-700 shadow ring-1 ring-red-200">
                    <Star className="w-4 h-4 fill-red-600 text-red-600" />
                    Most Popular
                  </div>
                )}

                <div className="p-7">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-red-600">
                    {plan.price}
                  </p>
                  <p className="mt-1 text-slate-600">{plan.tokens} Tokens</p>

                  <ul className="mt-6 space-y-2">
                    {plan.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-slate-800"
                      >
                        <Check className="w-4 h-4 text-red-600" />
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/payment"
                    className={`mt-7 block w-full text-center px-4 py-2.5 rounded-lg font-semibold transition ${
                      plan.popular
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-sm"
                        : "bg-amber-200 text-slate-900 hover:bg-amber-300"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="rounded-2xl overflow-hidden border border-amber-200 bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="px-6 md:px-10 py-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Ready to Create Amazing Photos?
              </h2>
              <p className="mt-3 text-white/90">
                Join thousands of users who trust ClickBooth for their
                professional photo needs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/layout-selection"
                  className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold shadow hover:bg-amber-50 transition"
                >
                  Try Now - Free
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 border border-white/70 text-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
