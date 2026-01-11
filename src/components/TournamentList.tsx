'use client'

import React, { useState, useMemo } from 'react'
import TournamentCard from './TournamentCard'
import { Trophy, Filter, X } from 'lucide-react'

interface TournamentListProps {
    tournaments: any[]
    cloneFrom?: string
}

export default function TournamentList({ tournaments, cloneFrom }: TournamentListProps) {
    const [filterGender, setFilterGender] = useState<string>('all')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [filterDivision, setFilterDivision] = useState<string>('all')

    // Extract unique options from tournaments
    const { categories, divisions } = useMemo(() => {
        const cats = new Set<string>()
        const divs = new Set<string>()

        tournaments.forEach(t => {
            if (t.divs) {
                Object.keys(t.divs).forEach(key => cats.add(key))
                Object.values(t.divs).forEach((val: any) => {
                    if (Array.isArray(val)) {
                        val.forEach((d: any) => {
                            const dName = typeof d === 'string' ? d : d.name
                            if (dName) divs.add(dName)
                        })
                    }
                })
            }
        })

        return {
            categories: Array.from(cats).sort(),
            divisions: Array.from(divs).sort()
        }
    }, [tournaments])

    // Filter logic
    const filteredTournaments = useMemo(() => {
        return tournaments.filter(t => {
            // 1. Gender
            if (filterGender !== 'all' && t.gender && t.gender !== filterGender) return false

            // 2. Category
            if (filterCategory !== 'all') {
                const hasCat = t.divs && Object.keys(t.divs).includes(filterCategory)
                if (!hasCat) return false
            }

            // 3. Division
            if (filterDivision !== 'all') {
                // Check if any category has this division
                let hasDiv = false
                if (t.divs) {
                    Object.values(t.divs).forEach((val: any) => {
                        if (Array.isArray(val)) {
                            val.forEach((d: any) => {
                                const dName = typeof d === 'string' ? d : d.name
                                if (dName === filterDivision) hasDiv = true
                            })
                        }
                    })
                }
                if (!hasDiv) return false
            }

            return true
        })
    }, [tournaments, filterGender, filterCategory, filterDivision])

    const clearFilters = () => {
        setFilterGender('all')
        setFilterCategory('all')
        setFilterDivision('all')
    }

    const hasActiveFilters = filterGender !== 'all' || filterCategory !== 'all' || filterDivision !== 'all'

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 font-bold text-sm mr-2 shrink-0">
                    <Filter className="w-4 h-4" />
                    필터
                </div>

                <div className="flex flex-wrap gap-2 flex-1">
                    {/* Gender Select */}
                    <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">성별 전체</option>
                        <option value="male">남성부</option>
                        <option value="female">여성부</option>
                        <option value="mixed">혼성부</option>
                    </select>

                    {/* Category Select */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">종별 전체</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Division Select */}
                    <select
                        value={filterDivision}
                        onChange={(e) => setFilterDivision(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">디비전 전체</option>
                        {divisions.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1"
                    >
                        <X className="w-3 h-3" />
                        필터 초기화
                    </button>
                )}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTournaments.map((tour) => (
                    <TournamentCard key={tour.id} tour={tour} cloneFrom={cloneFrom} />
                ))}

                {filteredTournaments.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-in fade-in">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium text-lg">
                            {hasActiveFilters
                                ? '조건에 맞는 대회가 없습니다.'
                                : '현재 접수 중인 대회가 없습니다.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-blue-600 font-bold hover:underline"
                            >
                                필터 초기화하기
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
