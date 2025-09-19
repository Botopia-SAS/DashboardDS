'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface RangeFilterProps {
  currentRange: string
}

const RangeFilter = ({ currentRange }: RangeFilterProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-300">
        Range: {currentRange === 'all' ? 'All time' : 
                currentRange === 'day' || currentRange === 'today' ? 'Today' : 
                currentRange === 'month' ? 'This month' : 'This year'}
      </span>
      <div className="flex items-center gap-2">
        <select
          value={currentRange}
          onChange={(e) => handleRangeChange(e.target.value)}
          className="text-black rounded-md px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="day">Today</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>
  )
}

export default RangeFilter