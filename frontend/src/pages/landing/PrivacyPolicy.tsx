import { motion } from "framer-motion"

export default function PrivacyPolicy() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e3a8a] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-white"
          >
            Privacy <span className="text-blue-400">Policy</span>
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
            <Section title="1. Introduction">
              <p>
                SARN Connect ("we", "our", "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website sarnconnect.in or use our services.
              </p>
              <p className="mt-4">
                By using our website and services, you consent to the practices described in this policy. If you do not agree with this policy, please do not use our website or services.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p>We may collect the following types of information:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Name, phone number, and email address</li>
                <li>WhatsApp messaging data (with your explicit consent)</li>
                <li>Business communication data</li>
                <li>Website usage data (cookies, IP address, browser information)</li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>To provide advertising and marketing services</li>
                <li>To send WhatsApp business communications (with opt-in consent)</li>
                <li>To send transactional and service updates via WhatsApp</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To improve our services and website experience</li>
              </ul>
            </Section>

            <Section title="4. WhatsApp Communications">
              <div className="bg-slate-800/60 border border-[#25D366]/30 rounded-xl p-6">
                <p>
                  We use WhatsApp Business API (provided by Meta Platforms Inc.) to send business communications. By opting in, you consent to receive WhatsApp messages from us. You can opt-out at any time by sending 'STOP' to our WhatsApp number or by contacting us at abwafakhan95@gmail.com.
                </p>
                <p className="mt-4">
                  We only send messages to users who have explicitly opted in. We do not send spam or unsolicited messages. All communications comply with Meta's WhatsApp Business API policies and Indian regulations.
                </p>
              </div>
            </Section>

            <Section title="5. Data Sharing">
              <p>We respect your privacy and do not sell your personal data to third parties. However, we may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>With service providers who assist us in operating our business (e.g., Meta/WhatsApp for message delivery)</li>
                <li>If required to comply with Indian law or legal process</li>
                <li>To protect our rights, property, or safety</li>
              </ul>
            </Section>

            <Section title="6. Data Security">
              <p>
                We implement industry-standard security measures to protect your personal information. This includes encrypted data storage, secure data transmission, and limited access to personal data on a need-to-know basis. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>Under the Indian IT Act 2000 and applicable privacy laws, you have the following rights:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Right to access your personal data held by us</li>
                <li>Right to request correction of inaccurate data</li>
                <li>Right to request deletion of your data</li>
                <li>Right to opt-out of communications at any time</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at abwafakhan95@gmail.com.
              </p>
            </Section>

            <Section title="8. Cookies Policy">
              <p>
                Our website may use cookies and similar tracking technologies to enhance your browsing experience. Cookies are small text files stored on your device. We use:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li><strong>Essential cookies:</strong> Required for website functionality</li>
                <li><strong>Analytics cookies:</strong> To understand how visitors use our site</li>
              </ul>
              <p className="mt-3">
                You can disable cookies through your browser settings. However, some features of our website may not function properly as a result.
              </p>
            </Section>

            <Section title="9. Contact for Privacy Queries">
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              <div className="mt-3 space-y-1">
                <p><strong>Email:</strong> abwafakhan95@gmail.com</p>
                <p><strong>Address:</strong> Safed Pool, Shanti Nagar, Masjid, Mumbai - 400072, Maharashtra, India</p>
              </div>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated policy on this page with a revised "Last Updated" date. Your continued use of our website and services after changes constitutes acceptance of the updated policy.
              </p>
            </Section>
          </div>
        </div>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
