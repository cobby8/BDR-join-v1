'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1']

interface RegionChartProps {
    data: { name: string; value: number }[]
}

export function RegionPieChart({ data }: RegionChartProps) {
    if (!data.length) {
        return <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다.</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    )
}

interface TournamentChartProps {
    data: { name: string; teamCount: number; revenue: number }[]
}

export function TournamentRevenueChart({ data }: TournamentChartProps) {
    if (!data.length) {
        return <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다.</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${(value / 10000).toLocaleString()}만`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                    formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()}원`, '매출']}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" name="예상 매출" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function TournamentTeamChart({ data }: TournamentChartProps) {
    if (!data.length) {
        return <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다.</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="teamCount" fill="#10B981" name="참가팀 수" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
