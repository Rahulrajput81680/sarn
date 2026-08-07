import { motion } from "framer-motion"

export default function Terms() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e3a8a] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-white"
          >
            Terms of <span className="text-blue-400">Service</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 mt-4"
          >
            Last Updated: February 2026
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 text-gray-300 leading-relaxed">
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using sarnconnect.in ("the Website") and the services provided by SARN Connect ("we", "our", "us"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.
              </p>
            </Section>

            <Section title="2. Services Description">
              <p>
                SARN Connect provides advertising, digital marketing, market research, and WhatsApp business communication services. The specific scope, deliverables, and pricing for each service will be outlined in individual service agreements or quotations provided to clients.
              </p>
            </Section>

            <Section title="3. User Responsibilities">
              <p>As a user of our website and services, you agree to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Provide accurate, current, and complete information when using our services or forms</li>
                <li>Not use our services for any illegal, unauthorized, or fraudulent purposes</li>
                <li>Not send spam, unsolicited messages, or harmful content through or about our platform</li>
                <li>Comply with WhatsApp's Terms of Service and Meta Platform Policies</li>
                <li>Comply with the Indian IT Act 2000 and TRAI regulations regarding business communications</li>
              </ul>
            </Section>

            <Section title="4. WhatsApp Marketing Terms">
              <div className="bg-slate-800/60 border border-[#25D366]/30 rounded-xl p-6">
                <p>When using our WhatsApp marketing services, the following additional terms apply:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>You must have valid opt-in consent from all recipients before sending messages</li>
                  <li>No unsolicited bulk messages may be sent through our services</li>
                  <li>You must honor all opt-out requests immediately upon receipt</li>
                  <li>All message templates must be pre-approved by Meta before use</li>
                  <li>No illegal, harmful, misleading, or prohibited content may be distributed</li>
                </ul>
                <p className="mt-4 text-gray-400 text-sm">
                  Violation of these terms may result in immediate suspension of services and reporting to relevant authorities.
                </p>
              </div>
            </Section>

            <Section title="5. Payment Terms">
              <ul className="list-disc pl-6 space-y-1">
                <li>Services are charged as per the agreed quotation or contract signed between SARN Connect and the client</li>
                <li>Payment is due within 7 days of invoice date unless otherwise specified in the agreement</li>
                <li>No refunds will be issued for services that have been fully delivered as per the scope of work</li>
                <li>Partial refunds may be considered on a case-by-case basis for undelivered services</li>
              </ul>
            </Section>

            <Section title="6. Intellectual Property">
              <p>
                All content on sarnconnect.in, including text, graphics, logos, images, and software, is the property of SARN Connect unless otherwise stated. Client-provided content and materials remain the intellectual property of the respective client. Nothing in these terms transfers any intellectual property rights to either party except as expressly stated.
              </p>
            </Section>

            <Section title="7. Limitation of Liability">
              <ul className="list-disc pl-6 space-y-1">
                <li>SARN Connect shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services</li>
                <li>Our maximum liability for any claim shall be limited to the total fees paid by the client for the specific service giving rise to the claim</li>
                <li>We do not guarantee specific business outcomes or returns on marketing investments</li>
              </ul>
            </Section>

            <Section title="8. Termination">
              <ul className="list-disc pl-6 space-y-1">
                <li>Either party may terminate a service agreement by providing 7 days written notice</li>
                <li>Upon termination, the client shall pay for all services rendered up to the termination date</li>
                <li>Obligations regarding confidentiality, intellectual property, and payment shall survive termination</li>
                <li>We reserve the right to terminate services immediately for breach of these terms</li>
              </ul>
            </Section>

            <Section title="9. Governing Law">
              <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-6">
                <p>
                  These terms are governed by the laws of Maharashtra, India. Any disputes arising out of or relating to these terms or our services shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
                </p>
              </div>
            </Section>

            <Section title="10. Contact">
              <p>For any questions, concerns, or inquiries regarding these Terms of Service, please contact us:</p>
              <div className="mt-3">
                <p><strong>Email:</strong> abwafakhan95@gmail.com</p>
              </div>
            </Section>
          </div>
        </div>
      </section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </motion.div>
  )
}
