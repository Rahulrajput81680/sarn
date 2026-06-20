import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

// Auth pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import AdminLogin from '../pages/auth/AdminLogin'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import UserList from '../pages/admin/user-management/UserList'
import UserDetail from '../pages/admin/user-management/UserDetail'
import TenantList from '../pages/admin/tenant-management/TenantList'
import TenantDetail from '../pages/admin/tenant-management/TenantDetail'
import CreateTenant from '../pages/admin/tenant-management/CreateTenant'
import Plans from '../pages/admin/subscription/Plans'
import SubscriptionList from '../pages/admin/subscription/SubscriptionList'
import APIMonitor from '../pages/admin/api-usage/APIMonitor'
import WebhookLogs from '../pages/admin/api-usage/WebhookLogs'
import RateLimits from '../pages/admin/api-usage/RateLimits'
import FlaggedMessages from '../pages/admin/content-moderation/FlaggedMessages'
import ModerationRules from '../pages/admin/content-moderation/ModerationRules'
import PlatformOverview from '../pages/admin/system-analytics/PlatformOverview'
import TenantAnalytics from '../pages/admin/system-analytics/TenantAnalytics'
import SystemHealth from '../pages/admin/system-analytics/SystemHealth'
import BillingOverview from '../pages/admin/billing/BillingOverview'
import InvoiceList from '../pages/admin/billing/InvoiceList'
import PaymentConfig from '../pages/admin/billing/PaymentConfig'
import Announcements from '../pages/admin/communication/Announcements'
import EmailTemplates from '../pages/admin/communication/EmailTemplates'
import AuditLog from '../pages/admin/audit-security/AuditLog'
import SessionManager from '../pages/admin/audit-security/SessionManager'
import SecuritySettings from '../pages/admin/audit-security/SecuritySettings'
import TicketList from '../pages/admin/support/TicketList'
import TicketDetail from '../pages/admin/support/TicketDetail'
import KnowledgeBase from '../pages/admin/support/KnowledgeBase'
import FailureLog from '../pages/admin/failure-recovery/FailureLog'
import RetryQueue from '../pages/admin/failure-recovery/RetryQueue'
import EscalationConfig from '../pages/admin/failure-recovery/EscalationConfig'
import MetaConfig from '../pages/admin/meta-integration/MetaConfig'
import PhoneNumbers from '../pages/admin/meta-integration/PhoneNumbers'
import TemplateApproval from '../pages/admin/meta-integration/TemplateApproval'
import RolePermissions from '../pages/admin/role-permissions/RolePermissions'

// Client pages
import Dashboard from '../pages/client/dashboard/Dashboard'
import BulkMessaging from '../pages/client/bulk-messaging/BulkMessaging'
import Campaigns from '../pages/client/campaigns/Campaigns'
import Contacts from '../pages/client/contacts/Contacts'
import Inbox from '../pages/client/inbox/Inbox'
import ChatbotBuilder from '../pages/client/chatbot/ChatbotBuilder'
import Analytics from '../pages/client/analytics/Analytics'
import Templates from '../pages/client/templates/Templates'
import TeamAccess from '../pages/client/team/TeamAccess'
import Billing from '../pages/client/billing/Billing'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Admin auth — standalone, no AuthLayout wrapper */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Client dashboard */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bulk-messaging" element={<BulkMessaging />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/chatbot" element={<ChatbotBuilder />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/team" element={<TeamAccess />} />
          <Route path="/billing" element={<Billing />} />
        </Route>

        {/* Master Admin */}
        <Route
          element={
            <RoleRoute>
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/users/:id" element={<UserDetail />} />
          <Route path="/admin/tenants" element={<TenantList />} />
          <Route path="/admin/tenants/new" element={<CreateTenant />} />
          <Route path="/admin/tenants/:id" element={<TenantDetail />} />
          <Route path="/admin/plans" element={<Plans />} />
          <Route path="/admin/subscriptions" element={<SubscriptionList />} />
          <Route path="/admin/api-usage" element={<APIMonitor />} />
          <Route path="/admin/webhook-logs" element={<WebhookLogs />} />
          <Route path="/admin/rate-limits" element={<RateLimits />} />
          <Route path="/admin/moderation" element={<FlaggedMessages />} />
          <Route path="/admin/moderation/rules" element={<ModerationRules />} />
          <Route path="/admin/analytics" element={<PlatformOverview />} />
          <Route path="/admin/analytics/tenants" element={<TenantAnalytics />} />
          <Route path="/admin/system-health" element={<SystemHealth />} />
          <Route path="/admin/billing" element={<BillingOverview />} />
          <Route path="/admin/billing/invoices" element={<InvoiceList />} />
          <Route path="/admin/billing/config" element={<PaymentConfig />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/email-templates" element={<EmailTemplates />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />
          <Route path="/admin/sessions" element={<SessionManager />} />
          <Route path="/admin/security" element={<SecuritySettings />} />
          <Route path="/admin/support" element={<TicketList />} />
          <Route path="/admin/support/:id" element={<TicketDetail />} />
          <Route path="/admin/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/admin/failures" element={<FailureLog />} />
          <Route path="/admin/retry-queue" element={<RetryQueue />} />
          <Route path="/admin/escalation" element={<EscalationConfig />} />
          <Route path="/admin/meta" element={<MetaConfig />} />
          <Route path="/admin/meta/numbers" element={<PhoneNumbers />} />
          <Route path="/admin/meta/templates" element={<TemplateApproval />} />
          <Route path="/admin/role-permissions" element={<RolePermissions />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
