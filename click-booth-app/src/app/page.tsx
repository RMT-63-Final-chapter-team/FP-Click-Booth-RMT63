"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Camera, Palette, Smartphone, Gem, Check, Star } from "lucide-react";
import Footer from "@/components/Footer";
import { BackgroundLines } from "@/components/ui/background-beams-with-collision";
import { BoxesCore } from "@/components/ui/background-boxes";
import { Compare } from "@/components/ui/compare";

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
      price: "Rp. 20.000",
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
      price: "Rp. 55.000",
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
      price: "Rp. 90.000",
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
    <div className="bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 overflow-hidden">
      {/* Hero Section */}
      <BackgroundLines className="relative overflow-hidden min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div className="absolute inset-0 z-0">
          <BoxesCore className="w-full h-full opacity-20" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pb-24 md:pb-32 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                Professional Photo Studio
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent leading-[1.1]">
              Professional Photo Booth with{" "}
              <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                AI
              </span>{" "}
              Precision
            </h1>
            <p className="mt-6 md:mt-8 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              Experience premium photo results, AI-powered filters, and instant
              sharing—crafted for modern events and brands with unmatched
              quality.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booth"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                Start Photo Session
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-slate-300 transition-all duration-300 font-medium"
              >
                Explore Features
              </Link>
            </div>
          </motion.div>
        </div>
      </BackgroundLines>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-white relative">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.6),white)] opacity-30"></div>
        <div className="relative z-10 container mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Why Choose ClickBooth?
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-light">
              Future-ready photo booth technology with professional-grade
              features for every occasion.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-500 overflow-hidden hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/20 text-red-600 ring-1 ring-red-100 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before & After Comparison */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,rgba(255,255,255,0.4))] opacity-40"></div>
        <div className="relative z-10 container mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 mb-6">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-700">
                AI Transformation
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Before & After Magic
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-light">
              See the incredible transformation with our AI-powered filters and
              professional enhancement
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Left side - Compare component */}
            <div className="flex-1 flex justify-center">
              <Compare
                firstImage="/fred2.png"
                secondImage="/gibli2.png"
                className="w-[400px] h-[400px] rounded-2xl shadow-xl"
                slideMode="hover"
                autoplay={true}
                autoplayDuration={3000}
              />
            </div>

            {/* Right side - Description */}
            <div className="flex-1 max-w-lg">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Professional Enhancement
                    </h3>
                    <p className="text-slate-600">
                      Our AI automatically enhances lighting, color balance, and
                      skin tone for professional-quality results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Palette className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Advanced Filters
                    </h3>
                    <p className="text-slate-600">
                      Choose from 10+ premium filters designed by professional
                      photographers for every occasion.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Gem className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Instant Results
                    </h3>
                    <p className="text-slate-600">
                      Transform your photos in real-time with just a hover. No
                      waiting, no manual editing required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-20 md:py-28 bg-gradient-to-br from-amber-50 via-white to-orange-50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(45deg,white,rgba(255,255,255,0.6),white)] opacity-30"></div>
        <div className="relative z-10 container mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 mb-6">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-700">
                Flexible Pricing
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-light">
              Select the perfect token package for your photo booth needs and
              unlock premium features.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.8 }}
                className={`group relative rounded-3xl border-2 bg-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                  plan.popular
                    ? "border-red-500/20 bg-gradient-to-br from-white via-red-50/30 to-white shadow-red-500/10"
                    : "border-slate-200/50 hover:border-slate-300/50"
                } overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/25">
                      <Star className="w-4 h-4 fill-white" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black bg-gradient-to-br from-red-600 to-red-500 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-600 font-medium">
                      <span className="text-2xl font-bold text-slate-900">
                        {plan.tokens}
                      </span>{" "}
                      Tokens
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-slate-700"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600 font-bold" />
                        </div>
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/payment"
                    className={`block w-full text-center px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                      plan.popular
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5"
                        : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 hover:from-slate-200 hover:to-slate-300 hover:shadow-lg"
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

      {/* <FocusCards cards={cards} /> */}

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,rgba(255,255,255,0.2))] opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-purple-600/20"></div>
        <div className="relative z-10 container mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white/90">
                Join Thousands of Users
              </span>
            </div>

            <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-6">
              Ready to Create{" "}
              <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                Amazing Photos?
              </span>
            </h2>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light mb-10">
              Join thousands of users who trust ClickBooth for their
              professional photo needs and create stunning memories.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booth"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                Try Now - Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-bold backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                Sign Up Today
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
