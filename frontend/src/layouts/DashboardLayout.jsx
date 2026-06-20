import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Send, Megaphone, Users, MessageSquare,
  Bot, BarChart3, FileText, UserCog, CreditCard,
  Bell, Search, LogOut, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, MoreVertical, Phone,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import OnboardingWizard from '../components/onboarding/OnboardingWizard'

const NAV = [
  { label: 'Dashboard',          icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Bulk Messaging',     icon: Send,            to: '/bulk-messaging' },
  { label: 'Campaigns',          icon: Megaphone,       to: '/campaigns' },
  { label: 'Contacts',           icon: Users,           to: '/contacts' },
  { label: 'Team Inbox',         icon: MessageSquare,   to: '/inbox' },
  { label: 'Chatbot Builder',    icon: Bot,             to: '/chatbot' },
  { label: 'Analytics',          icon: BarChart3,       to: '/analytics' },
  { label: 'Templates',          icon: FileText,        to: '/templates' },
  { label: 'Team & Access',      icon: UserCog,         to: '/team' },
  { label: 'Billing',            icon: CreditCard,      to: '/billing' },
]

const AUTO_COLLAPSE_ROUTES = ['/inbox', '/chatbot']

export default function DashboardLayout() {
  const { user, logout, isOnboarded } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const waConnected = true
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (AUTO_COLLAPSE_ROUTES.some((r) => location.pathname.startsWith(r)) && sidebarOpen) {
      toggleSidebar()
    }
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col border-r border-2 border-green-300 transition-all duration-[220ms] ease-out shrink-0 relative overflow-hidden',
          sidebarOpen ? 'w-56' : 'w-16'
        )}
        style={{
          background: 'linear-gradient(175deg, #ffffff 0%, #ffffff 40%, #f0fdf4 64%, #dcfce7 85%, #bbf7d0 100%)',
        }}
      >
        {/* ambient glow orbs */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-green-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 -left-6 w-24 h-24 rounded-full bg-emerald-300/10 blur-2xl" />

        <div className="h-14 flex items-center justify-center px-3 border-b border-green-100/60">
          {sidebarOpen ? (
            <img src="/images/icon.png" alt="Wixabotic" className="h-8 w-auto object-contain" />
          ) : (
            <img
              src="/images/icon.png"
              alt="W"
              className="w-10 h-5 object-cover object-left shrink-0"
            />
          )}
        </div>

        {/* Active WhatsApp Number card */}
        <div className="px-2 pt-2 pb-0.5">
          {sidebarOpen ? (
            <div className="px-3 py-2.5 bg-white/70 border border-green-100 rounded-xl shadow-sm">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Active number</p>
              <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                {user?.name || 'My Business'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs">🇮🇳</span>
                <span className="text-xs text-gray-500 font-mono tracking-tight">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-[10px] font-medium text-green-600">Connected · WhatsApp Business</span>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center p-2 bg-white/70 border border-green-100 rounded-xl shadow-sm"
              title="+91 98765 43210 · Connected"
            >
              <Phone size={14} className="text-green-600" />
            </div>
          )}
        </div>

        <nav className="relative flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  !sidebarOpen && 'justify-center',
                  isActive
                    ? 'bg-white/85 text-green-700 shadow-sm shadow-green-500 border border-green-100/60'
                    : 'text-gray-600 hover:bg-white/55 hover:text-gray-900'
                )
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon size={16} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="relative border-t border-green-100/60 px-3 py-3" ref={profileRef}>
          {/* Sign out popup */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-lg border border-gray-100/80 py-1.5 z-20">
              <button
                onClick={() => { setProfileMenuOpen(false); handleLogout() }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}

          <div className={clsx(
            'flex items-center gap-2.5 bg-white/70 rounded-xl border border-white/60 shadow-sm',
            sidebarOpen ? 'px-3 py-2.5' : 'justify-center p-2 cursor-pointer'
          )}
            onClick={!sidebarOpen ? () => setProfileMenuOpen((v) => !v) : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                    {user?.email || `${(user?.role || 'admin')}@wixabotic.com`}
                  </p>
                </div>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100/60 shrink-0"
                >
                  <MoreVertical size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 flex items-center gap-4 px-5 bg-white border-b border-gray-100 shrink-0">
          <button onClick={toggleSidebar} className="text-gray-400 hover:text-gray-700 transition-colors">
            {sidebarOpen
              ? <PanelLeftClose size={20} />
              : <PanelLeftOpen size={20} />}
          </button>
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className={clsx(
              'hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              waConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            )}>
              {waConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {waConnected ? 'Connected' : 'Disconnected'}
            </span>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {!isOnboarded && <OnboardingWizard />}
    </div>
  )
}
