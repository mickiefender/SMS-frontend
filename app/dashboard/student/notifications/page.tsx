'use client'

import { useState, useEffect } from 'react'
import { messagingAPI } from '@/lib/api'
import { Bell, X } from 'lucide-react'

interface Notice {
  id: number
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_pinned: boolean
  created_at: string
}

interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
}

export default function StudentNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notices' | 'announcements'>('notices')
  const [notices, setNotices] = useState<Notice[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [noticesRes, announcementsRes] = await Promise.all([
        messagingAPI.notices(),
        messagingAPI.announcements(),
      ])

      setNotices(noticesRes.data.results || noticesRes.data || [])
      setAnnouncements(announcementsRes.data.results || announcementsRes.data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Notifications</h1>
          <p className="text-gray-600">Stay updated with school notices and announcements</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {(['notices', 'announcements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div className="text-center text-gray-500">Loading...</div>}

        {/* Notices Tab */}
        {activeTab === 'notices' && !loading && (
          <div className="space-y-4">
            {notices.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No notices available</p>
              </div>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{notice.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                            notice.priority
                          )}`}
                        >
                          {notice.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{notice.content}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {notice.is_pinned && <Bell size={20} className="text-blue-600" />}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && !loading && (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No announcements available</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 cursor-pointer transition"
                >
                  <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 line-clamp-3">{announcement.content}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notice Detail Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">{selectedNotice.title}</h2>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                        selectedNotice.priority
                      )}`}
                    >
                      {selectedNotice.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedNotice.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedNotice(null)}>
                  <X size={24} />
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNotice.content}</p>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedAnnouncement.title}</h2>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedAnnouncement.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedAnnouncement(null)}>
                  <X size={24} />
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
