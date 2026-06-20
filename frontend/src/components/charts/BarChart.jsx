import {
  BarChart as RechartBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function BarChart({ data, bars, height = 260, title }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {title && <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartBar data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
          {bars?.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {(bars || [{ key: 'value', color: '#16a34a' }]).map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color || '#16a34a'} radius={[4, 4, 0, 0]} name={b.label || b.key} />
          ))}
        </RechartBar>
      </ResponsiveContainer>
    </div>
  )
}
