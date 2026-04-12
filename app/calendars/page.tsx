'use client'
import { useState } from 'react'

export default function CalendarPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const HEADERS = ['S','M','T','W','T','F','S']
  const [selected, setSelected] = useState<number|null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-2 pt-4 pb-24">

      {/* Month header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <span className="text-white font-bold text-lg">
          {now.toLocaleString('default',{month:'long'})} {year}
        </span>
        <button className="w-8 h-8 bg-[#22d3ee] rounded-full flex items-center justify-center text-white text-xl leading-none">+</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {HEADERS.map((h,i) => (
          <div key={i} className="text-center text-[11px] text-[#525252] font-medium py-1">{h}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-[#262626] rounded-xl overflow-hidden">
        {Array.from({length: startDay}).map((_,i) => (
          <div key={'e'+i} className="bg-[#0a0a0a] h-12" />
        ))}
        {Array.from({length: totalDays}).map((_,i) => {
          const day = i + 1
          const isToday = day === now.getDate()
          const isSelected = day === selected
          return (
            <div
              key={day}
              onClick={() => setSelected(day)}
              className="bg-[#0a0a0a] h-12 flex flex-col items-center justify-start pt-1 active:bg-[#1a1a1a] transition-colors cursor-pointer">
              <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${isToday ? 'bg-[#22d3ee] text-white' : isSelected ? 'bg-[#1a1a1a] text-white' : 'text-[#a3a3a3]'}`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Selected day placeholder */}
      {selected && (
        <div className="mt-4 mx-2 bg-[#111111] border border-[#262626] rounded-xl p-4">
          <p className="text-xs text-[#525252] uppercase tracking-wider">
            {now.toLocaleString('default',{month:'long'})} {selected}
          </p>
          <p className="text-[#737373] text-sm mt-2">
            No events
          </p>
        </div>
      )}

    </div>
  )
}
