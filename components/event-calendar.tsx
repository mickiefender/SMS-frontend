"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export function EventCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2017, 3, 14))

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const days = []
  for (let i = 0; i < firstDayOfMonth(currentDate); i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth(currentDate); i++) {
    days.push(i)
  }

  const highlights = [14, 16, 27]
  const colors = { 14: "bg-purple-600", 16: "bg-green-500", 27: "bg-pink-500" }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Event Calendar</h3>
        <div className="flex gap-2">
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft size={18} />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="text-center mb-4 text-sm font-semibold text-gray-600">14 April, 2017</div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="font-semibold text-gray-600">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {days.map((day, idx) => (
          <div key={idx} className={`p-2 rounded ${day ? "hover:bg-gray-100 cursor-pointer" : ""}`}>
            {day && (
              <div
                className={`w-full h-7 flex items-center justify-center rounded ${
                  highlights.includes(day)
                    ? colors[day as keyof typeof colors] + " text-white font-semibold"
                    : "text-gray-600"
                }`}
              >
                {day}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
