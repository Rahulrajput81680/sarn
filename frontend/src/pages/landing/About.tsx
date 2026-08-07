import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, FileCheck, Briefcase, Target, Eye, User } from "lucide-react"

export default function About() {
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
            About <span className="text-blue-400">SARN Connect</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto mt-4"
          >
            Your trusted partner in advertising, market research, and business communication solutions.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                SARN Connect was established in December 2025 with a clear vision — to bridge the gap between businesses and their target audiences through intelligent advertising and data-driven market research.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Based in Mumbai, Maharashtra, we are a registered micro enterprise (UDYAM-MH-19-0413515) specializing in digital marketing, WhatsApp Business API communications, market research, and brand promotion.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Our team combines deep industry knowledge with modern digital tools to deliver campaigns that resonate, engage, and convert. We believe in transparency, compliance, and measurable outcomes.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">Business Details</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Calendar size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Established</p>
                    <p className="text-white font-medium">December 2025</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Briefcase size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Business Type</p>
                    <p className="text-white font-medium">Micro Enterprise</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FileCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Registration</p>
                    <p className="text-white font-medium">UDYAM-MH-19-0413515</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Briefcase size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Industry</p>
                    <p className="text-white font-medium">Advertising & Market Research (NIC Code 73100)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p className="text-white font-medium">
                      Safed Pool, Shanti Nagar, Masjid,<br />
                      Mumbai - 400072, Maharashtra, India
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gradient-to-br from-[#020617] to-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/80 border border-blue-500/20 h-full">
                <CardContent className="p-8">
                  <Target size={40} className="text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                  <p className="text-gray-300 leading-relaxed">
                    To empower businesses with smart, data-driven advertising and marketing solutions that drive growth, enhance brand visibility, and deliver measurable ROI. We are committed to maintaining the highest standards of compliance and transparency in all our communications.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-slate-800/80 border border-blue-500/20 h-full">
                <CardContent className="p-8">
                  <Eye size={40} className="text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                  <p className="text-gray-300 leading-relaxed">
                    To become India's most trusted advertising and market research partner, known for innovation, integrity, and impactful results. We envision a world where every business — regardless of size — has access to professional marketing intelligence and compliant communication channels.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <User size={64} className="text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Founder & CEO</h2>
            <p className="text-gray-400 mb-6">Visionary behind SARN Connect</p>
            <Card className="max-w-lg mx-auto bg-slate-800/80 border border-blue-500/20">
              <CardContent className="p-8">
                <div className="w-24 h-24 rounded-full bg-blue-500/20 mx-auto mb-4 flex items-center justify-center">
                  <User size={48} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Abwafak Khan</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Abwafak Khan brings entrepreneurial vision and industry expertise to lead SARN Connect's mission of delivering smart advertising and market research solutions. With a deep understanding of digital marketing and business communication, he is dedicated to helping businesses grow through innovative and compliant strategies.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
