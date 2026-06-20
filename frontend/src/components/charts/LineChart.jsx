import {
  LineChart as RechartLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function LineChart({ data, lines, height = 260, title }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {title && <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartLine data={data} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          {lines?.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {(lines || [{ key: 'value', color: '#16a34a' }]).map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color || '#16a34a'}
              strokeWidth={2}
              dot={false}
              name={l.label || l.key}
            />
          ))}
        </RechartLine>
      </ResponsiveContainer>
    </div>
  )
}
