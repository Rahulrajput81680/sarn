import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function Contact() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e3a8a] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-white"
          >
            Contact <span className="text-blue-400">Us</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto mt-4"
          >
            Get in touch with SARN Connect. We'd love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Send Us a Message</h2>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Your phone number"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Message *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us about your requirements..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full py-6 text-base rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold">
                  Send Message
                </Button>
              </form>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>

              <div className="flex gap-4">
                <MapPin size={24} className="text-blue-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Office Address</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Safed Pool, Shanti Nagar, Masjid,<br />
                    Mumbai - 400072, Maharashtra, India
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone size={24} className="text-blue-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Phone</h3>
                  <a href="tel:9321290806" className="text-gray-400 text-sm hover:text-blue-400 transition-colors">
                    9321290806
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <Mail size={24} className="text-blue-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Email</h3>
                  <a href="mailto:abwafakhan95@gmail.com" className="text-gray-400 text-sm hover:text-blue-400 transition-colors break-all">
                    abwafakhan95@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock size={24} className="text-blue-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Business Hours</h3>
                  <p className="text-gray-400 text-sm">Monday to Saturday</p>
                  <p className="text-gray-400 text-sm">10:00 AM to 7:00 PM</p>
                  <p className="text-gray-500 text-xs mt-1">Closed on Sundays and public holidays</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-12 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden border border-blue-500/20"
          >
            <iframe
              title="SARN Connect Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.534!2d72.8777!3d19.0760!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c7c5b5b5b5b5%3A0x0!2sMumbai%2C+Maharashtra!5e0!3m2!1sen!2sin!4v1"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </section>
    </div>
  )
}
