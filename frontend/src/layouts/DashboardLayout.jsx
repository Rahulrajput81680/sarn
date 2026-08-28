import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Send, Users, MessageSquare, FileText,
  Bell, Search, LogOut, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, MoreVertical, Phone,
  UserCircle, Settings, AlertTriangle, ArrowRight, X, CheckCheck,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import ConnectWhatsAppModal from '../components/onboarding/ConnectWhatsAppModal'
import axiosInstance from '../api/axios'
import socket, { connectSocket, disconnectSocket } from '../api/socket'
import { timeAgo } from '../utils/formatters'

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

function HeaderSearch() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState({ contacts: [], conversations: [] })
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Debounced search across contacts + conversations
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults({ contacts: [], conversations: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      Promise.all([
        axiosInstance.get('/api/v1/contacts', { params: { search: q, limit: 5 } }),
        axiosInstance.get('/api/v1/conversations', { params: { search: q, limit: 5 } }),
      ])
        .then(([cRes, convRes]) => {
          setResults({
            contacts:      cRes.data.data?.contacts || [],
            conversations: convRes.data.data?.conversations || [],
          })
        })
        .catch(() => setResults({ contacts: [], conversations: [] }))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const reset = () => { setQuery(''); setOpen(false); setMobileOpen(false) }

  const goToContact = (c) => {
    reset()
    navigate(`/contacts?q=${encodeURIComponent(c.phone || c.name)}`)
  }

  const goToConversation = (c) => {
    reset()
    navigate(`/inbox?conversationId=${c._id}`)
  }

  const hasResults   = results.contacts.length > 0 || results.conversations.length > 0
  const showDropdown = open && query.trim().length > 0

  const dropdown = showDropdown && (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 max-h-96 overflow-y-auto z-50">
      {loading ? (
        <p className="px-3 py-3 text-xs text-gray-400 text-center">Searching…</p>
      ) : !hasResults ? (
        <p className="px-3 py-3 text-xs text-gray-400 text-center">No results for "{query}"</p>
      ) : (
        <>
          {results.contacts.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contacts</p>
              {results.contacts.map((c) => (
                <button
                  key={c._id}
                  onClick={() => goToContact(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {(c.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-800 truncate">{c.name}</span>
                    <span className="block text-xs text-gray-400 font-mono truncate">{c.phone}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {results.conversations.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Conversations</p>
              {results.conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => goToConversation(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {(c.contact?.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 truncate">{c.contact?.name || 'Unknown'}</span>
                    <span className="block text-xs text-gray-400 truncate">{c.lastMessage?.text || 'No messages yet'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      {/* Desktop: always-visible input */}
      <div className="relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); e.currentTarget.blur() } }}
          placeholder="Search contacts, conversations…"
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {dropdown}
      </div>

      {/* Mobile: icon toggles an inline input */}
      <div className="sm:hidden">
        {mobileOpen ? (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onKeyDown={(e) => { if (e.key === 'Escape') reset() }}
              placeholder="Search…"
              className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={reset} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
            {dropdown}
          </div>
        ) : (
          <button onClick={() => { setMobileOpen(true); setOpen(true) }} className="p-1.5 text-gray-400 hover:text-gray-600">
            <Search size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

function NotificationBell() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [open,        setOpen]        = useState(false)
  const [tab,         setTab]         = useState('inbox') // 'inbox' | 'unread'
  const [convs,       setConvs]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    axiosInstance.get('/api/v1/conversations', { params: { limit: 30 } })
      .then(({ data }) => setConvs(data.data?.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Owns the shared socket's connect/disconnect lifecycle for the whole authenticated app — this
  // component lives in DashboardLayout, which wraps every page, so it's the one place a connection
  // can safely persist across navigation. Inbox.jsx only adds/removes its own listeners now; it
  // must never call connectSocket/disconnectSocket itself, or leaving Inbox would kill this feed.
  useEffect(() => {
    if (!token) return
    connectSocket(token)
    fetchNotifications()

    const refresh = () => fetchNotifications()
    socket.on('new_message', refresh)
    socket.on('new_conversation_message', refresh)

    return () => {
      socket.off('new_message', refresh)
      socket.off('new_conversation_message', refresh)
      disconnectSocket()
    }
  }, [token, fetchNotifications])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  const unreadConvs = convs.filter((c) => c.unreadCount > 0)
  const list = tab === 'unread' ? unreadConvs : convs
  const cap = (n) => (n > 99 ? '99+' : String(n))

  const handleMarkAllRead = async () => {
    if (!totalUnread || markingRead) return
    setMarkingRead(true)
    try {
      await axiosInstance.put('/api/v1/conversations/mark-all-read')
      setConvs((cs) => cs.map((c) => ({ ...c, unreadCount: 0 })))
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingRead(false)
    }
  }

  const goToInbox = () => {
    setOpen(false)
    navigate('/inbox')
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 md:p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Bell size={18} />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-start justify-between px-4 pt-3.5 pb-2">
            <div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalUnread > 0 ? `${totalUnread} unread update${totalUnread > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
            {totalUnread > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors shrink-0"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 px-4 border-b border-gray-100">
            {[
              { key: 'inbox', label: 'Inbox', count: convs.length },
              { key: 'unread', label: 'Unread', count: unreadConvs.length },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  'flex items-center gap-1.5 pb-2.5 pt-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t.key ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    tab === t.key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {cap(t.count)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-xs text-gray-400 text-center">Loading…</p>
            ) : list.length === 0 ? (
              <p className="px-4 py-8 text-xs text-gray-400 text-center">
                {tab === 'unread' ? 'No unread messages' : 'No notifications yet'}
              </p>
            ) : (
              list.map((c) => (
                <button
                  key={c._id}
                  onClick={goToInbox}
                  className={clsx(
                    'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-b-0 transition-colors hover:bg-gray-50',
                    c.unreadCount > 0 && 'bg-green-50/40'
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={14} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className={clsx('text-sm truncate', c.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                        New message from {c.contact?.name || c.contact?.phone || 'Unknown'}
                      </span>
                      {c.unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                    </span>
                    <span className="block text-xs text-gray-400 truncate mt-0.5">
                      {c.lastMessage?.text || 'No messages yet'}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                    {timeAgo(c.lastMessage?.time || c.updatedAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            onClick={goToInbox}
            className="w-full py-2.5 text-xs font-semibold text-green-600 hover:bg-green-50 border-t border-gray-100 transition-colors"
          >
            View all in Inbox
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, isOnboarded } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const waConnected       = !!user?.tenant?.whatsapp?.phoneNumber
  const [mobileSidebarOpen,    setMobileSidebarOpen]    = useState(false)
  const [showSetupModal,       setShowSetupModal]       = useState(false)

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
          <HeaderSearch />

          {/* Right section */}
          <div className="flex items-center gap-1 md:gap-2 ml-auto">
            <span className={clsx(
              'hidden md:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              waConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            )}>
              {waConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {waConnected ? 'Connected' : 'Disconnected'}
            </span>
            <NotificationBell />
          </div>
        </header>
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
        <ConnectWhatsAppModal onDismiss={() => setShowSetupModal(false)} />
      )}
    </div>
  )
}
