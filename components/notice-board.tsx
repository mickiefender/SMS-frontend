"use client"

export function NoticeBoard() {
  const notices = [
    { author: "Jenyfer Lopez", time: "5 min ago", text: "Great School managemensom simply dummy text of the printing" },
    { author: "Killar Miller", time: "2 min ago", text: "Great School managemensom simply dummy text of the printing" },
    { author: "Jenyfer Lopez", time: "5 min ago", text: "Great School managemensom simply" },
    { author: "Mike Huasy", time: "5 min ago", text: "Great School managemensom simply" },
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Notice Board</h3>
        <div className="text-sm text-gray-500">16 May, 2017</div>
      </div>

      <div className="space-y-3">
        {notices.map((notice, idx) => (
          <div key={idx} className="border-l-4 border-purple-600 pl-3 py-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-800">{notice.author}</span>
              <span className="text-xs text-gray-500">{notice.time}</span>
            </div>
            <p className="text-sm text-gray-600">{notice.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
