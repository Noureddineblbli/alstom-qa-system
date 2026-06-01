import {React, useState, useEffect} from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export default function AnalyticsSection({
    inspectionTrend,
    verdictStats,
    projectFailureRate,
    projectActivity
}) {
    

    const COLORS = ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B'];

    return (
        <div className="space-y-6">

            {/* GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* ───────────────────────────────────────────── */}
                {/* INSPECTION TREND */}
                {/* ───────────────────────────────────────────── */}
                <div className="bg-[#16191E] border border-white/5 rounded-2xl p-6">
                
                <div className="mb-6">
                    <h4 className="text-lg font-semibold">
                    Inspection Trend
                    </h4>

                    <p className="text-xs text-white/40 mt-1">
                    Number of inspections over time
                    </p>
                </div>

                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={inspectionTrend}>
                        <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        />

                        <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        />

                        <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        />

                        <Tooltip
                        contentStyle={{
                            backgroundColor: '#0F1115',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        />

                        <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {/* ───────────────────────────────────────────── */}
                {/* VERDICT DISTRIBUTION */}
                {/* ───────────────────────────────────────────── */}
                <div className="bg-[#16191E] border border-white/5 rounded-2xl p-6">

                <div className="mb-6">
                    <h4 className="text-lg font-semibold">
                    Verdict Distribution
                    </h4>

                    <p className="text-xs text-white/40 mt-1">
                    VALID vs INVALID inspections
                    </p>
                </div>

                <div className="h-[320px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>

                        <Pie
                        data={verdictStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={65}
                        dataKey="count"
                        paddingAngle={4}
                        >
                        {verdictStats.map((entry, index) => (
                            <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                        </Pie>

                        <Tooltip
                        contentStyle={{
                            backgroundColor: '#0F1115',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        />
                    </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* LEGEND */}
                <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">

                    {verdictStats.map((item, index) => (
                    <div
                        key={item.verdict}
                        className="flex items-center gap-2 text-sm text-white/70"
                    >
                        <div
                        className="w-3 h-3 rounded-full"
                        style={{
                            backgroundColor: COLORS[index % COLORS.length]
                        }}
                        />

                        <span>
                        {item.verdict} ({item.count})
                        </span>
                    </div>
                    ))}

                </div>
                </div>

                {/* ───────────────────────────────────────────── */}
                {/* DEFECT RATE PER PROJECT */}
                {/* ───────────────────────────────────────────── */}
                <div className="bg-[#16191E] border border-white/5 rounded-2xl p-6">

                <div className="mb-6">
                    <h4 className="text-lg font-semibold">
                    Defect Rate per Project
                    </h4>

                    <p className="text-xs text-white/40 mt-1">
                    Percentage of failed inspections per project
                    </p>
                </div>

                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectFailureRate} layout="vertical">

                        <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        />

                        <XAxis
                        type="number"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        />

                        <YAxis
                        type="category"
                        dataKey="project"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        width={120}
                        />

                        <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{
                            backgroundColor: '#0F1115',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        />

                        <Bar
                        dataKey="failure_rate"
                        fill="#EF4444"
                        radius={[0, 8, 8, 0]}
                        />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {/* ───────────────────────────────────────────── */}
                {/* PROJECT ACTIVITY */}
                {/* ───────────────────────────────────────────── */}
                <div className="bg-[#16191E] border border-white/5 rounded-2xl p-6">

                <div className="mb-6">
                    <h4 className="text-lg font-semibold">
                    Project Activity
                    </h4>

                    <p className="text-xs text-white/40 mt-1">
                    Inspections grouped by project
                    </p>
                </div>

                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectActivity}>

                        <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        />

                        <XAxis
                        dataKey="project"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        />

                        <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        />

                        <Tooltip
                        contentStyle={{
                            backgroundColor: '#0F1115',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        />

                        <Bar
                        dataKey="inspections"
                        fill="#3B82F6"
                        radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>

            </div>
        </div>
    );
}