import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'

const schema = z.object({
  companyName: z.string().min(2, 'Required'),
  ownerName: z.string().min(2, 'Required'),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(10, 'Valid phone required'),
  plan: z.string().min(1, 'Select a plan'),
  trialDays: z.coerce.number().min(0),
})

export default function CreateTenant() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'Pro', trialDays: 14 },
  })

  const onSubmit = async (data) => {
    await new Promise((r) => setTimeout(r, 800))
    toast.success(`Tenant "${data.companyName}" created`)
    navigate('/admin/tenants')
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/admin/tenants')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={14} /> Back to tenants
      </button>
      <PageHeader title="Create Tenant" description="Manually onboard a new organization" breadcrumbs={['Admin', 'Tenants', 'New']} />
      <Card className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Company Name" placeholder="Acme Corp" error={errors.companyName?.message} {...register('companyName')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Owner Name" placeholder="John Doe" error={errors.ownerName?.message} {...register('ownerName')} />
            <Input label="Owner Email" type="email" placeholder="john@acme.com" error={errors.ownerEmail?.message} {...register('ownerEmail')} />
          </div>
          <Input label="Owner Phone" placeholder="+91 9876543210" error={errors.ownerPhone?.message} {...register('ownerPhone')} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Plan</label>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                {...register('plan')}
              >
                <option>Free</option>
                <option>Pro</option>
                <option>Enterprise</option>
              </select>
              {errors.plan && <p className="text-xs text-red-500">{errors.plan.message}</p>}
            </div>
            <Input label="Trial Days" type="number" min="0" {...register('trialDays')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting}>Create Tenant</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/tenants')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
