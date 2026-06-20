import {
  PieChart as RechartPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function PieChart({ data, height = 260, title }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {title && <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data?.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RechartPie>
      </ResponsiveContainer>
    </div>
  )
}
