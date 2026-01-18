"use client"

export function RecentActivities() {
  const activities = [
    { icon: "👤", action: "You followed Olivia Williamson", time: "0 minutes ago" },
    { icon: "📝", action: "You Subscribed to Harold Fuller", time: "20 minutes ago" },
    { icon: "🖼️", action: "You updated your profile picture", time: "30 minutes ago" },
    { icon: "📄", action: "You deleted homepage.psd", time: "35 minutes ago" },
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-gray-800 mb-4">Recent Activities</h3>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="mt-1 text-xl">{activity.icon}</div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{activity.action}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
