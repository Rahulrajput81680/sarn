import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, CreditCard, Activity, Shield,
  BarChart3, DollarSign, Megaphone, Lock, HeadphonesIcon, AlertTriangle,
  Webhook, ChevronDown, ChevronRight, Bell, Search, LogOut,
  Menu, X, Settings, MessageSquare, ShieldCheck,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

const NAV = [
  {
    label: 'Overview',
    items: [{ label: 'Admin Dashboard', icon: LayoutDashboard, to: '/admin' }],
  },
  {
    label: 'User Management',
    items: [
      { label: 'All Users',      icon: Users,     to: '/admin/users' },
      { label: 'All Tenants',    icon: Building2, to: '/admin/tenants' },
      { label: 'Create Tenant',  icon: Building2, to: '/admin/tenants/new' },
    ],
  },
  {
    label: 'Subscription Control',
    items: [
      { label: 'Plans',              icon: CreditCard, to: '/admin/plans' },
      { label: 'All Subscriptions',  icon: CreditCard, to: '/admin/subscriptions' },
    ],
  },
  {
    label: 'API Usage Monitoring',
    items: [
      { label: 'API Monitor',   icon: Activity, to: '/admin/api-usage' },
      { label: 'Webhook Logs',  icon: Webhook,  to: '/admin/webhook-logs' },
      { label: 'Rate Limits',   icon: Shield,   to: '/admin/rate-limits' },
    ],
  },
  {
    label: 'Template Approval',
    items: [
      { label: 'Template Approval', icon: MessageSquare, to: '/admin/meta/templates' },
    ],
  },
  {
    label: 'System Analytics',
    items: [
      { label: 'Platform Overview', icon: BarChart3, to: '/admin/analytics' },
      { label: 'Per-Tenant',        icon: BarChart3, to: '/admin/analytics/tenants' },
      { label: 'System Health',     icon: Activity,  to: '/admin/system-health' },
    ],
  },
  {
    label: 'Billing & Payments',
    items: [
      { label: 'Billing Overview', icon: DollarSign, to: '/admin/billing' },
      { label: 'Invoices',         icon: DollarSign, to: '/admin/billing/invoices' },
      { label: 'Payment Config',   icon: Settings,   to: '/admin/billing/config' },
    ],
  },
  {
    label: 'Compliance Monitoring',
    items: [
      { label: 'Compliance Monitor', icon: ShieldCheck, to: '/admin/moderation' },
      { label: 'Moderation Rules',   icon: Shield,      to: '/admin/moderation/rules' },
    ],
  },
  {
    label: 'Support & Ticketing',
    items: [
      { label: 'Tickets',        icon: HeadphonesIcon, to: '/admin/support' },
      { label: 'Knowledge Base', icon: MessageSquare,  to: '/admin/knowledge-base' },
    ],
  },
  {
    label: 'Audit Logs & Security',
    items: [
      { label: 'Audit Log',          icon: Lock,   to: '/admin/audit-log' },
      { label: 'Sessions',           icon: Lock,   to: '/admin/sessions' },
      { label: 'Security Settings',  icon: Shield, to: '/admin/security' },
    ],
  },
  {
    label: 'Role-Based Permissions',
    items: [
      { label: 'Role Permissions', icon: ShieldCheck, to: '/admin/role-permissions' },
    ],
  },

  // ── Commented out (not in current scope) ─────────────────
  // { label: 'Communication', items: [
  //   { label: 'Announcements',   icon: Megaphone,      to: '/admin/announcements' },
  //   { label: 'Email Templates', icon: MessageSquare,  to: '/admin/email-templates' },
  // ]},
  // { label: 'Recovery', items: [
  //   { label: 'Failure Log', icon: AlertTriangle, to: '/admin/failures' },
  //   { label: 'Retry Queue', icon: AlertTriangle, to: '/admin/retry-queue' },
  //   { label: 'Escalation',  icon: AlertTriangle, to: '/admin/escalation' },
  // ]},
  // { label: 'Meta Integration', items: [
  //   { label: 'Meta Config',    icon: Settings, to: '/admin/meta' },
  //   { label: 'Phone Numbers',  icon: Settings, to: '/admin/meta/numbers' },
  // ]},
]

function SidebarSection({ group, collapsed }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-1">
      {!collapsed && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
        >
          {group.label}
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      )}
      {(open || collapsed) && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                )
              }
            >
              <item.icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Admin mode red top stripe */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-red-500 z-50" />

      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col bg-slate-800 transition-all duration-200 shrink-0 mt-1',
          sidebarOpen ? 'w-56' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center justify-center px-3 py-4 border-b border-slate-700">
          {sidebarOpen ? (
            <>
              <img src="/images/sarn.png" alt="Wixabotic" className="h-8 w-auto object-contain  invert" />
              <span className="text-xs text-red-400 font-medium mt-1">Master Admin</span>
            </>
          ) : (
            <img
              src="/images/sarn.png"
              alt="W"
              className="w-10 h-5 object-cover object-left shrink-0"
            />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {NAV.map((group) => (
            <SidebarSection key={group.label} group={group} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-700 px-3 py-3">
          <div className={clsx('flex items-center gap-2', !sidebarOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-red-400">Super Admin</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 mt-1">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-4 px-5 bg-white border-b border-gray-100 shrink-0 shadow-sm">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-800 transition-colors">
            <Menu size={20} />
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
          <div className="flex items-center gap-1 ml-auto">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
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
