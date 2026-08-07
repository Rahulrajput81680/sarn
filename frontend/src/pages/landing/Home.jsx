import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button, Card, CardContent } from "@/components/landing/LandingUi"
import { Megaphone, MessageCircle, BarChart3, TrendingUp, ArrowRight, Shield, Award, Building2 } from "lucide-react"

const services = [
  {
    icon: <Megaphone size={36} />,
    title: "Digital Marketing",
    description: "Social media management, SEO optimization, and online advertising campaigns to boost your digital presence.",
  },
  {
    icon: <MessageCircle size={36} />,
    title: "WhatsApp Business Marketing",
    description: "Bulk messaging, automated campaigns, and customer engagement via WhatsApp Business API.",
  },
  {
    icon: <BarChart3 size={36} />,
    title: "Market Research",
    description: "Consumer insights, competitor analysis, and data-driven strategies for informed decision-making.",
  },
  {
    icon: <TrendingUp size={36} />,
    title: "Brand Promotion",
    description: "Brand identity development, promotional campaigns, and strategic market positioning.",
  },
]

const whyUs = [
  {
    icon: <Shield size={28} />,
    title: "MSME Registered",
    description: "Officially registered micro enterprise with government recognition.",
  },
  {
    icon: <Award size={28} />,
    title: "Industry Expertise",
    description: "Deep domain knowledge in advertising and market research.",
  },
  {
    icon: <Building2 size={28} />,
    title: "Mumbai Based",
    description: "Proudly serving clients from our Mumbai headquarters.",
  },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e3a8a] py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxYTU2ZGIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-4xl mx-auto">
              Grow Your Business with{" "}
              <span className="text-blue-400">Smart Advertising</span> &{" "}
              <span className="text-blue-400">Marketing Solutions</span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto mt-6">
              SARN Connect delivers data-driven advertising, market research, and WhatsApp business communication services to help your brand thrive.
            </p>
            <div className="flex justify-center gap-4 mt-10 flex-wrap">
              <Link to="/login">
                <Button className="px-8 py-6 text-base rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold">
                  Get Started <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" className="px-8 py-6 text-base rounded-xl border-blue-500 text-blue-400 hover:bg-blue-500/10 font-bold">
                  Our Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-[#1e3a8a]/30 border-y border-blue-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-300">
            <span className="flex items-center gap-2">
              <Shield size={16} className="text-blue-400" /> MSME Registered
            </span>
            <span className="flex items-center gap-2">
              <Award size={16} className="text-blue-400" /> Udyam Certified
            </span>
            <span className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-400" /> Mumbai Based
            </span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Our Services</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Comprehensive advertising and marketing solutions tailored for your business growth.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-slate-800/80 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-blue-400 mb-4 flex justify-center">{service.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-400">{service.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-[#020617] to-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Why Choose Us</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              We combine industry expertise with a commitment to delivering measurable results.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-slate-800/80 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-blue-400 mb-4 flex justify-center">{item.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Opt-In */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <MessageCircle size={48} className="text-[#25D366] mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Get business updates on WhatsApp
              </h2>
              <p className="text-gray-400 mb-8">Subscribe now to receive updates, offers, and insights directly on WhatsApp.</p>
            </motion.div>
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onSubmit={(e) => e.preventDefault()}
              className="space-y-4 text-left"
            >
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-gray-400">
                <input type="checkbox" required className="mt-1 accent-[#25D366]" />
                <span>
                  I agree to receive WhatsApp messages from SARN Connect. I can opt-out anytime by sending STOP. View our{" "}
                  <Link to="/privacy-policy" className="text-blue-400 underline hover:text-blue-300">Privacy Policy</Link>.
                </span>
              </label>
              <Button type="submit" className="w-full py-6 text-base rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold">
                Subscribe on WhatsApp
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-900/40 to-blue-800/30 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
              Partner with SARN Connect for data-driven advertising and marketing solutions that deliver real results.
            </p>
            <Link to="/contact">
              <Button className="px-12 py-6 text-lg rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold">
                Contact Us Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
