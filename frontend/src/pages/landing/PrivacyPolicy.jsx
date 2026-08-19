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
            Last Updated: August 2026
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 text-gray-300 leading-relaxed">
            <Section title="1. Introduction">
              <p>
                SARN Connect ("we", "our", "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you visit our website sarnconnect.in, use our advertising and market research services, or when we operate WhatsApp business messaging on behalf of our business clients using the WhatsApp Business Platform provided by Meta Platforms, Inc. ("Meta").
              </p>
              <p className="mt-4">
                By using our website and services, you consent to the practices described in this policy. If you do not agree with this policy, please do not use our website or services.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p><strong className="text-gray-200">Website visitors:</strong> name, email address, phone number, and messages submitted through our contact forms, together with standard website usage data (cookies, IP address, browser information).</p>
              <p className="mt-3"><strong className="text-gray-200">WhatsApp messaging contacts:</strong> when a business uses our platform to communicate with its customers over WhatsApp, we process the recipient's name and phone number, message content, opt-in/opt-out status, and delivery/read status, for the sole purpose of sending and receiving those messages.</p>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>Website and contact-form data may be used to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Respond to your inquiries and provide customer support</li>
                <li>Operate and improve our website and services</li>
                <li>Where you have separately engaged us as a client, to deliver the advertising and market research services described in your service agreement</li>
              </ul>
              <p className="mt-4">WhatsApp messaging data is used strictly to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Send the transactional, service, and marketing messages a recipient has explicitly opted in to receive from the business they are messaging with</li>
                <li>Deliver customer support and respond to inbound messages</li>
                <li>Track delivery, read, and opt-out status so businesses can honor consent in real time</li>
              </ul>
              <p className="mt-4 text-sm text-gray-400">
                We do not use WhatsApp messaging data to build advertising profiles, for ad targeting, or for any purpose unrelated to the messaging service the recipient opted into.
              </p>
            </Section>

            <Section title="4. WhatsApp Business Communications & Meta Platform Compliance">
              <div className="bg-slate-800/60 border border-[#25D366]/30 rounded-xl p-6">
                <p>
                  We use the WhatsApp Business Platform (provided by Meta) to send business communications on behalf of our clients. Messages are only sent to recipients who have explicitly opted in, and every recipient can opt out at any time by replying <strong className="text-gray-100">STOP</strong> to any message, or by contacting us at abwafakhan95@gmail.com — opt-outs are honored immediately.
                </p>
                <p className="mt-4">
                  Our use of the WhatsApp Business Platform, and any data obtained through it, complies with Meta's Platform Terms and the WhatsApp Business Messaging Policy. In particular:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-1">
                  <li>Data obtained through WhatsApp is used only to provide the specific messaging service it was collected for — never for advertising, ad targeting, or building user profiles across other platforms or services</li>
                  <li>We do not sell WhatsApp messaging data to any third party</li>
                  <li>We do not send unsolicited bulk messages or spam</li>
                </ul>
              </div>
            </Section>

            <Section title="5. Data Sharing & Third Parties">
              <p>We do not sell your personal data to third parties. We share information only in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>With Meta Platforms, Inc. (WhatsApp Business Platform), solely as needed to transmit and deliver messages</li>
                <li>With infrastructure providers (cloud hosting and database storage) who process data on our behalf under confidentiality obligations</li>
                <li>If required to comply with Indian law, a legal process, or a valid government request</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
              </ul>
            </Section>

            <Section title="6. Data Security">
              <p>
                We implement industry-standard security measures to protect your personal information, including encrypted storage of access credentials, encrypted data transmission (HTTPS/TLS), and access to personal data restricted to authorized personnel on a need-to-know basis. No method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="7. Data Retention">
              <p>
                We retain personal data and message history only for as long as necessary to provide our services, comply with our legal obligations, resolve disputes, and enforce our agreements. Contact and message data is deleted or anonymized when a business relationship ends and retention is no longer required by law, or sooner upon a valid deletion request.
              </p>
            </Section>

            <Section title="8. Your Rights & Data Deletion" id="data-deletion">
              <p>Under the Indian IT Act 2000 and applicable privacy laws, you have the right to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal data</li>
                <li>Opt out of communications at any time</li>
              </ul>
              <div className="mt-4 bg-slate-800/60 border border-blue-500/20 rounded-xl p-6">
                <p className="font-semibold text-gray-100">How to request data deletion</p>
                <p className="mt-2">
                  To delete your data: reply <strong className="text-gray-100">STOP</strong> to any WhatsApp message to immediately opt out of further messaging, and/or email <strong className="text-gray-100">abwafakhan95@gmail.com</strong> with the phone number or account you'd like deleted. We will delete or anonymize the associated personal data within 30 days, except where we are required to retain it by law.
                </p>
              </div>
            </Section>

            <Section title="9. Cookies Policy">
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

            <Section title="10. Children's Privacy">
              <p>
                Our website and services are not directed at children under the age of 18, and we do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected data from a minor, we will delete it promptly.
              </p>
            </Section>

            <Section title="11. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated policy on this page with a revised "Last Updated" date. Your continued use of our website and services after changes constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="12. Contact Us">
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              <div className="mt-3 space-y-1">
                <p><strong>Email:</strong> abwafakhan95@gmail.com</p>
                <p><strong>Address:</strong> Safed Pool, Shanti Nagar, Masjid, Mumbai - 400072, Maharashtra, India</p>
              </div>
            </Section>
          </div>
        </div>
      </section>
    </div>
  )
}

function Section({ title, children, id }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </motion.div>
  )
}
