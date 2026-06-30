import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText,
  Building2, UserPlus, Activity, Webhook,
  Bell, Search, LogOut, PanelLeftClose, PanelLeftOpen,
  UserCircle, Settings, MoreVertical, Shield, Users2,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Templates', icon: FileText,        to: '/admin/meta/templates' },
]

// Admin-only management tools
const ADMIN_NAV = [
  { label: 'Manage Clients', icon: Building2, to: '/admin/tenants' },
  { label: 'Add New Client', icon: UserPlus,  to: '/admin/tenants/new' },
  { label: 'All Users',      icon: Users2,    to: '/admin/users' },
  { label: 'System Health',  icon: Activity,  to: '/admin/system-health' },
  { label: 'Webhook Logs',   icon: Webhook,   to: '/admin/webhook-logs' },
]

const NAV_BOTTOM = [
  { label: 'My Profile', icon: UserCircle, to: '/admin/profile' },
  { label: 'Settings',   icon: Settings,   to: '/admin/settings' },
]

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          !collapsed ? '' : 'justify-center',
          isActive
            ? 'bg-white/85 text-red-600 shadow-sm shadow-red-200 border border-red-100/60'
            : 'text-gray-600 hover:bg-white/55 hover:text-gray-900'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={16} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const profileRef = useRef(null)
  const collapsed = !sidebarOpen

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Red admin top stripe */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600 z-50" />

      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col border-r border-2 border-red-200 transition-all duration-[220ms] ease-out shrink-0 relative overflow-hidden mt-1',
          sidebarOpen ? 'w-56' : 'w-16'
        )}
        style={{
          background: 'linear-gradient(175deg, #ffffff 0%, #ffffff 40%, #fff5f5 64%, #fee2e2 85%, #fecaca 100%)',
        }}
      >
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-red-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 -left-6 w-24 h-24 rounded-full bg-rose-300/10 blur-2xl" />

        {/* Logo */}
        <div className="h-14 flex flex-col items-center justify-center px-3 border-b border-red-100/60">
          {sidebarOpen ? (
            <>
              <img src="/images/sarn.png" alt="SarnConnect" className="h-7 w-auto object-contain" />
              <span className="text-[10px] text-red-500 font-semibold tracking-wide mt-0.5">MASTER ADMIN</span>
            </>
          ) : (
            <img src="/images/sarn.png" alt="S" className="w-5 h-5 object-cover object-left shrink-0" />
          )}
        </div>

        {/* Admin badge card */}
        <div className="px-2 pt-2 pb-0.5">
          {sidebarOpen ? (
            <div className="px-3 py-2.5 bg-white/70 border border-red-100 rounded-xl shadow-sm">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">Admin Mode</p>
              <p className="text-sm font-semibold text-gray-800">Master Control</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield size={10} className="text-red-500 shrink-0" />
                <span className="text-[10px] font-medium text-red-600">Full Platform Access</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-2 bg-white/70 border border-red-100 rounded-xl shadow-sm" title="Master Admin">
              <Shield size={14} className="text-red-500" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto px-2 py-3 flex flex-col">
          {/* Client-parallel items */}
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>

          {/* Admin tools separator */}
          <div className="my-2 border-t border-red-100/60">
            {sidebarOpen && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                Admin Tools
              </p>
            )}
          </div>

          <div className="space-y-0.5">
            {ADMIN_NAV.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>

          {/* Bottom nav */}
          <div className="mt-3 pt-3 border-t border-red-100/60 space-y-0.5">
            {NAV_BOTTOM.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        {/* Profile area */}
        <div className="relative border-t border-red-100/60 px-3 py-3" ref={profileRef}>
          {profileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-lg border border-gray-100/80 py-1.5 z-20">
              <button
                onClick={() => { setProfileMenuOpen(false); navigate('/admin/profile') }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <UserCircle size={15} className="text-gray-400" /> My Profile
              </button>
              <button
                onClick={() => { setProfileMenuOpen(false); navigate('/admin/settings') }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings size={15} className="text-gray-400" /> Settings
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { setProfileMenuOpen(false); handleLogout() }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}

          <div
            className={clsx(
              'flex items-center gap-2.5 bg-white/70 rounded-xl border border-white/60 shadow-sm',
              sidebarOpen ? 'px-3 py-2.5' : 'justify-center p-2 cursor-pointer'
            )}
            onClick={!sidebarOpen ? () => setProfileMenuOpen((v) => !v) : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-red-500 truncate leading-tight mt-0.5">Super Admin</p>
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
      <div className="flex flex-col flex-1 min-w-0 mt-1">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-4 px-5 bg-white border-b border-gray-100 shrink-0 shadow-sm">
          <button onClick={toggleSidebar} className="text-gray-400 hover:text-gray-700 transition-colors">
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants, users…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Admin Mode
            </span>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
