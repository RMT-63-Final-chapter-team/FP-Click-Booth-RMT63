import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Heart,
  Sparkles,
  Star,
  Award,
  Users,
  Zap,
  Shield,
  ArrowUp,
  ExternalLink,
  Clock,
  Globe,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerSections = [
    {
      title: "Services",
      links: [
        { name: "Photo Booth", href: "/booth", icon: Camera },
        { name: "Event Photography", href: "/events", icon: Users },
        { name: "Professional Shoots", href: "/professional", icon: Award },
        { name: "AI Enhancement", href: "/ai-enhance", icon: Sparkles },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about", icon: Star },
        { name: "Our Team", href: "/team", icon: Users },
        { name: "Careers", href: "/careers", icon: Zap },
        { name: "Press Kit", href: "/press", icon: ExternalLink },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help", icon: Shield },
        { name: "Privacy Policy", href: "/privacy", icon: Shield },
        { name: "Terms of Service", href: "/terms", icon: Shield },
        { name: "Contact", href: "/contact", icon: Mail },
      ],
    },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-amber-50 via-amber-100 to-red-50 text-slate-800 overflow-hidden border-t border-amber-200">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Top Section */}
        <div className="border-b border-amber-300/50 bg-white/40 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-1"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
                      ClickBooth
                    </h3>
                    <p className="text-sm text-slate-300">Studio</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Creating unforgettable moments through innovative photo booth
                  experiences. Professional quality meets creative fun.
                </p>

                {/* Contact Info */}
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 text-slate-600 hover:text-amber-600 transition-colors duration-300"
                  >
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">hello@clickbooth.com</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 text-slate-600 hover:text-amber-600 transition-colors duration-300"
                  >
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">+1 (555) 123-4567</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 text-slate-600 hover:text-amber-600 transition-colors duration-300"
                  >
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">Jakarta, Indonesia</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Footer Sections */}
              {footerSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="lg:col-span-1"
                >
                  <h4 className="text-lg font-semibold mb-6 text-slate-800">
                    {section.title}
                  </h4>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="group flex items-center space-x-3 text-slate-600 hover:text-amber-600 transition-all duration-300"
                        >
                          <link.icon className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm group-hover:translate-x-1 transition-transform duration-300">
                            {link.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="container mx-auto max-w-7xl px-6 py-6">
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

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center space-x-4"
            >
              {[
                { icon: Instagram, href: "#", color: "hover:text-pink-400" },
                { icon: Facebook, href: "#", color: "hover:text-blue-400" },
                { icon: Twitter, href: "#", color: "hover:text-sky-400" },
                { icon: Youtube, href: "#", color: "hover:text-red-400" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 bg-amber-100 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-600 ${social.color} transition-all duration-300 hover:bg-amber-200 hover:shadow-lg border border-amber-200`}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </motion.div>

            {/* Scroll to Top */}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 bg-gradient-to-r from-amber-500 to-red-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Extra Info Bar */}
        <div className="border-t border-amber-300/50 bg-amber-100/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span>Available Worldwide</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span>Secure & Private</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Powered by AI Technology</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
