import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button, Card, CardContent } from "@/components/landing/LandingUi"
import { Megaphone, MessageCircle, BarChart3, TrendingUp, ArrowRight, CheckCircle } from "lucide-react"

const servicesData = [
  {
    icon: <Megaphone size={48} />,
    title: "Digital Marketing",
    tagline: "Dominate the digital landscape with strategic online marketing.",
    description: "Our digital marketing services are designed to help your business reach the right audience through the right channels. We craft data-backed strategies that drive engagement, traffic, and conversions.",
    features: [
      "Social media management across all major platforms",
      "Search engine optimization (SEO) for better rankings",
      "Paid advertising campaigns (Google Ads, Social Media Ads)",
      "Content marketing and strategy development",
      "Performance analytics and reporting",
    ],
  },
  {
    icon: <MessageCircle size={48} />,
    title: "WhatsApp Business Marketing",
    tagline: "Connect with your customers on the world's most popular messaging platform.",
    description: "Leverage the power of WhatsApp Business API to send personalized, compliant, and impactful messages to your customers. We help you set up and manage your WhatsApp marketing campaigns end-to-end.",
    features: [
      "WhatsApp Business API setup and integration",
      "Bulk messaging with Meta-approved templates",
      "Automated customer engagement workflows",
      "Opt-in management and compliance with Meta policies",
      "Campaign analytics and performance tracking",
    ],
  },
  {
    icon: <BarChart3 size={48} />,
    title: "Market Research",
    tagline: "Make informed decisions with actionable market intelligence.",
    description: "We conduct thorough market research to uncover consumer behavior, market trends, and competitive landscapes. Our insights empower you to make data-driven decisions that minimize risk and maximize opportunity.",
    features: [
      "Consumer behavior analysis and segmentation",
      "Competitor analysis and benchmarking",
      "Industry trend research and forecasting",
      "Survey design and data collection",
      "Strategic recommendations and actionable insights",
    ],
  },
  {
    icon: <TrendingUp size={48} />,
    title: "Brand Promotion",
    tagline: "Build a brand that stands out and resonates with your audience.",
    description: "From brand identity creation to full-scale promotional campaigns, we help you build a brand that captures attention and builds loyalty. Our brand promotion services are tailored to your unique market position.",
    features: [
      "Brand identity and visual design development",
      "Promotional campaign strategy and execution",
      "Market positioning and brand messaging",
      "Influencer and partnership coordination",
      "Brand awareness tracking and reporting",
    ],
  },
]

export default function Services() {
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
            Our <span className="text-blue-400">Services</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto mt-4"
          >
            Comprehensive advertising, marketing, and research solutions to accelerate your business growth.
          </motion.p>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {servicesData.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-slate-800/80 border border-blue-500/20 overflow-hidden">
                <CardContent className="p-8 lg:p-10">
                  <div className="grid lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                      <div className="text-blue-400 mb-4">{service.icon}</div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">{service.title}</h2>
                      <p className="text-blue-300 text-sm font-medium mb-4">{service.tagline}</p>
                      <p className="text-gray-400 leading-relaxed mb-6">{service.description}</p>
                      <Link to="/login">
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                          Get Started <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                    <div className="lg:col-span-3">
                      <h3 className="text-lg font-semibold text-white mb-4">What We Offer</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {service.features.map((feature, j) => (
                          <div key={j} className="flex items-start gap-3 text-sm text-gray-300">
                            <CheckCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-900/40 to-blue-800/30 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Contact us to discuss your specific business requirements. We tailor our services to meet your unique goals.
            </p>
            <Link to="/contact">
              <Button className="px-10 py-6 text-lg rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold">
                Contact Us
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
