import { Link } from "react-router-dom"
import { MapPin, Phone, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] border-t border-blue-500/20 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-extrabold text-blue-400 tracking-wide">SARN</span>
              <span className="text-lg font-semibold text-white">Connect</span>
            </div>
            <p className="text-sm text-gray-400 italic">"Your Growth, Our Mission"</p>
            <p className="text-xs text-gray-500 mt-3">
              Registered under MSME | UDYAM-MH-19-0413515
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Industry: Advertising & Market Research
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block hover:text-blue-400 transition-colors">Home</Link>
              <Link to="/about" className="block hover:text-blue-400 transition-colors">About</Link>
              <Link to="/services" className="block hover:text-blue-400 transition-colors">Services</Link>
              <Link to="/contact" className="block hover:text-blue-400 transition-colors">Contact</Link>
            </div>
            <h3 className="text-white font-semibold mt-6 mb-3">Legal</h3>
            <div className="space-y-2 text-sm">
              <Link to="/privacy-policy" className="block hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block hover:text-blue-400 transition-colors">Terms of Service</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  Safed Pool, Shanti Nagar, Masjid,<br />
                  Mumbai - 400072, Maharashtra, India
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <Phone size={16} className="text-blue-400 shrink-0" />
                <a href="tel:9321290806" className="hover:text-blue-400 transition-colors">9321290806</a>
              </div>
              <div className="flex gap-2 items-center">
                <Mail size={16} className="text-blue-400 shrink-0" />
                <a href="mailto:abwafakhan95@gmail.com" className="hover:text-blue-400 transition-colors">abwafakhan95@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-500/10 mt-8 pt-8 text-center text-xs text-gray-500">
          <p>© 2026 SARN Connect. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
