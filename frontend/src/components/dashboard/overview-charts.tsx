"use client"

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"

interface OverviewChartsProps {
    volumeData: any[]
    channelData: any[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export function OverviewCharts({ volumeData, channelData }: OverviewChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart - Volume */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-base font-display font-bold text-slate-800">Volumen de Interacciones</h2>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Desempeño Diario</span>
                </div>
                <div className="flex-1 w-full min-h-[250px]">
                    {volumeData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-400">Sin datos suficientes</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="Interacciones"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Donut Chart - Channels */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-base font-display font-bold text-slate-800">Canales Activos</h2>
                </div>
                <div className="flex-1 w-full min-h-[250px] relative flex justify-center items-center">
                    {channelData.length === 0 ? (
                        <div className="text-sm text-slate-400">Sin datos suficientes</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={channelData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {channelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                                    itemStyle={{ fontWeight: '600' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}
