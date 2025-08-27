import Link from "next/link";
import { motion } from "motion/react";
import {
  Camera,
  // Mail,
  // Phone,
  // MapPin,
  Heart,
  Sparkles,
  ArrowUp,
  ExternalLink,
  Clock,
  Globe,
  Shield,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-white text-slate-800 overflow-hidden border-t border-slate-200">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Top Section */}
        <div className="border-b border-slate-200">
          <div className="container mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Company Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      ClickBooth
                    </h3>
                    <p className="text-sm text-slate-500">
                      Professional Studio
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed mb-8 max-w-lg">
                  Creating unforgettable moments through innovative photo booth
                  experiences. Professional quality meets creative fun with
                  AI-powered enhancement.
                </p>

                {/* Contact Info */}
                {/* <div className="space-y-4">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 text-slate-600 hover:text-red-600 transition-colors duration-300"
                  >
                    <Mail className="w-5 h-5 text-red-500" />
                    <span>hello@clickbooth.com</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 text-slate-600 hover:text-red-600 transition-colors duration-300"
                  >
                    <Phone className="w-5 h-5 text-red-500" />
                    <span>+62 (21) 123-4567</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 text-slate-600 hover:text-red-600 transition-colors duration-300"
                  >
                    <MapPin className="w-5 h-5 text-red-500" />
                    <span>Jakarta, Indonesia</span>
                  </motion.div>
                </div> */}
              </motion.div>

              {/* Documentation Link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="lg:col-span-1"
              >
                <h4 className="text-lg font-semibold mb-6 text-slate-800">
                  Documentation
                </h4>
                <Link
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center space-x-3 text-slate-600 hover:text-red-600 transition-all duration-300 p-4 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50"
                >
                  <ExternalLink className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <span className="font-medium group-hover:translate-x-1 transition-transform duration-300 block">
                      Next.js Documentation
                    </span>
                    <span className="text-sm text-slate-500">
                      Learn more about Next.js
                    </span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="container mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2"
            >
              <p className="text-slate-600 text-sm">
                © {new Date().getFullYear()} ClickBooth Studio. Made with
              </p>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-red-500"
              >
                <Heart className="w-4 h-4 fill-current" />
              </motion.div>
              <p className="text-slate-600 text-sm">in Indonesia</p>
            </motion.div>

            {/* Scroll to Top */}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-red-700"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Extra Info Bar */}
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="container mx-auto max-w-6xl px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3 h-3 text-red-500" />
                  <span>Available Worldwide</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-red-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-3 h-3 text-red-500" />
                  <span>Secure & Private</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3 text-red-600" />
                <span>Powered by AI Technology</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
