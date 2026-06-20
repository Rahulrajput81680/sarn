import { useState } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { toast } from 'sonner'

const ARTICLES = [
  { id: 1, title: 'How to connect WhatsApp Business API', category: 'Setup', views: 1240, updated: '2026-05-01' },
  { id: 2, title: 'Troubleshooting webhook failures', category: 'API', views: 890, updated: '2026-04-28' },
  { id: 3, title: 'Managing subscription plans', category: 'Billing', views: 650, updated: '2026-04-20' },
  { id: 4, title: 'Template message approval process', category: 'Templates', views: 420, updated: '2026-04-15' },
]

export default function KnowledgeBase() {
  const [articles, setArticles] = useState(ARTICLES)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', category: '', content: '' })

  const save = () => {
    setArticles((prev) => [...prev, { id: prev.length + 1, ...form, views: 0, updated: '2026-05-12' }])
    setShowNew(false)
    toast.success('Article created')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Knowledge Base"
        description="Internal support documentation"
        breadcrumbs={['Admin', 'Support', 'Knowledge Base']}
        action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Article</Button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {articles.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{a.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.category} · {a.views} views · Updated {a.updated}</p>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Article">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Content</label>
            <textarea rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <Button onClick={save}>Publish Article</Button>
        </div>
      </Modal>
    </div>
  )
}
