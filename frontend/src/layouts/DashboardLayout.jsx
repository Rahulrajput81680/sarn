import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Send, Users, MessageSquare, FileText,
  Bell, Search, LogOut, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, MoreVertical, Phone,
  UserCircle, Settings, AlertTriangle, ArrowRight, Info, X,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import OnboardingWizard from '../components/onboarding/OnboardingWizard'

const NAV = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Messages',       icon: MessageSquare,   to: '/inbox' },
  { label: 'Contacts',       icon: Users,           to: '/contacts' },
  { label: 'Templates',      icon: FileText,        to: '/templates' },
  { label: 'Bulk Messaging', icon: Send,            to: '/bulk-messaging' },
]

const NAV_BOTTOM = [
  { label: 'My Profile', icon: UserCircle, to: '/profile' },
  { label: 'Settings',   icon: Settings,   to: '/settings' },
]

const AUTO_COLLAPSE_ROUTES = ['/inbox', '/chatbot']

function SidebarContent({ sidebarOpen, onNavClick = () => {} }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const waPhone = user?.tenant?.whatsapp?.phoneNumber || ''
  const waConnected = !!waPhone

  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-2 border-green-300 transition-all duration-[220ms] ease-out shrink-0 relative overflow-hidden',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
      style={{
        background: 'linear-gradient(175deg, #ffffff 0%, #ffffff 40%, #f0fdf4 64%, #dcfce7 85%, #bbf7d0 100%)',
      }}
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-green-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 -left-6 w-24 h-24 rounded-full bg-emerald-300/10 blur-2xl" />

      <div className="h-14 flex items-center justify-center px-3 border-b border-green-100/60">
        {sidebarOpen ? (
          <img src="/images/sarn.png" alt="Wixabotic" className="h-8 w-auto object-contain" />
        ) : (
          <img src="/images/sarn.png" alt="W" className="w-5 h-5 object-cover object-left shrink-0" />
        )}
      </div>

      <div className="px-2 pt-2 pb-0.5">
        {sidebarOpen ? (
          <div className="px-3 py-2.5 bg-white/70 border border-green-100 rounded-xl shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Active number</p>
            <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
              {user?.name || 'My Business'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono tracking-tight text-gray-500 truncate">
                {waPhone || 'No number connected'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${waConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={`text-[10px] font-medium ${waConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {waConnected ? 'Connected · WhatsApp Business' : 'Not connected'}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-2 bg-white/70 border border-green-100 rounded-xl shadow-sm"
            title={waPhone ? `${waPhone} · Connected` : 'WhatsApp not connected'}
          >
            <Phone size={14} className="text-green-600" />
          </div>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-2 py-3 flex flex-col">
        <div className="space-y-0.5 flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onNavClick}
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
        </div>

        <div className="mt-3 pt-3 border-t border-green-100/60 space-y-0.5">
          {NAV_BOTTOM.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavClick}
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
        </div>
      </nav>

      <div className="relative border-t border-green-100/60 px-3 py-3" ref={profileRef}>
        {profileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-lg border border-gray-100/80 py-1.5 z-20">
            <button
              onClick={() => { setProfileMenuOpen(false); navigate('/profile') }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <UserCircle size={15} className="text-gray-400" />
              My Profile
            </button>
            <button
              onClick={() => { setProfileMenuOpen(false); navigate('/settings') }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings size={15} className="text-gray-400" />
              Settings
            </button>
            <div className="my-1 border-t border-gray-100" />
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
  )
}

export default function DashboardLayout() {
  const { user, isOnboarded } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const waConnected       = !!user?.tenant?.whatsapp?.phoneNumber
  const profileIncomplete = isOnboarded && (!user?.businessName || !user?.category || !user?.waDisplayName)
  const [mobileSidebarOpen,    setMobileSidebarOpen]    = useState(false)
  const [showSetupModal,       setShowSetupModal]       = useState(false)
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false)

  useEffect(() => {
    if (AUTO_COLLAPSE_ROUTES.some((r) => location.pathname.startsWith(r)) && sidebarOpen) {
      toggleSidebar()
    }
  }, [location.pathname])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <SidebarContent sidebarOpen={sidebarOpen} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <SidebarContent sidebarOpen={true} onNavClick={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 flex items-center gap-2 md:gap-4 px-3 md:px-5 bg-white border-b border-gray-100 shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-gray-700 transition-colors"
          >
            <PanelLeftOpen size={20} />
          </button>

          {/* Desktop toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:inline-flex text-gray-400 hover:text-gray-700 transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>

          {/* Search - full on md+, icon button on mobile */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button className="sm:hidden p-1.5 text-gray-400 hover:text-gray-600">
            <Search size={18} />
          </button>

          {/* Right section */}
          <div className="flex items-center gap-1 md:gap-2 ml-auto">
            <span className={clsx(
              'hidden md:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              waConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            )}>
              {waConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {waConnected ? 'Connected' : 'Disconnected'}
            </span>
            <button className="relative p-1.5 md:p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        {/* Profile incomplete banner */}
        {profileIncomplete && !profileBannerDismissed && (
          <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-200 text-blue-800">
            <Info size={15} className="shrink-0 text-blue-500" />
            <p className="flex-1 text-xs font-medium">
              Your business profile is incomplete — finish it to unlock full WhatsApp Business features and Meta verification.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 transition-colors whitespace-nowrap"
            >
              Complete Profile <ArrowRight size={12} />
            </button>
            <button
              onClick={() => setProfileBannerDismissed(true)}
              className="p-0.5 text-blue-400 hover:text-blue-700 transition-colors ml-1"
              title="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* WhatsApp not connected banner */}
        {isOnboarded && !waConnected && (
          <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800">
            <AlertTriangle size={15} className="shrink-0 text-amber-500" />
            <p className="flex-1 text-xs font-medium">
              WhatsApp is not connected — messaging features won't work until you complete setup.
            </p>
            <button
              onClick={() => setShowSetupModal(true)}
              className="flex items-center gap-1 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors whitespace-nowrap"
            >
              Complete Setup <ArrowRight size={12} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {(!isOnboarded || showSetupModal) && (
        <OnboardingWizard onDismiss={() => setShowSetupModal(false)} />
      )}
    </div>
  )
}
