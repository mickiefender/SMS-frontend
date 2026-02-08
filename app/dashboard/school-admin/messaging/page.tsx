'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { messagingAPI, usersAPI, academicsAPI } from '@/lib/api'
import { Bell, Send, X, Edit2, Trash2, Pin } from 'lucide-react'

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
  status: 'draft' | 'published' | 'archived'
  created_at: string
}

interface Teacher {
  id: number
  email: string
  get_full_name: string
}

interface Student {
  id: number
  email: string
  full_name: string
}

export default function MessagingPage() {
  const [activeTab, setActiveTab] = useState<'notices' | 'announcements' | 'messages'>('notices')
  const [notices, setNotices] = useState<Notice[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Notice form state
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    send_to_all: true,
    send_to_teachers: false,
    send_to_students: false,
  })
  const [showNoticeDialog, setShowNoticeDialog] = useState(false)

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    send_to_all: true,
    send_to_teachers: false,
    send_to_students: false,
  })
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [noticesRes, announcementsRes, teachersRes, studentsRes] = await Promise.all([
        messagingAPI.notices(),
        messagingAPI.announcements(),
        usersAPI.teachers(),
        usersAPI.students(),
      ])

      setNotices(noticesRes.data.results || noticesRes.data || [])
      setAnnouncements(announcementsRes.data.results || announcementsRes.data || [])
      setTeachers(teachersRes.data.results || teachersRes.data || [])
      setStudents(studentsRes.data.results || studentsRes.data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await messagingAPI.createNotice(noticeForm)
      setNoticeForm({
        title: '',
        content: '',
        priority: 'medium',
        send_to_all: true,
        send_to_teachers: false,
        send_to_students: false,
      })
      setShowNoticeDialog(false)
      await fetchAllData()
      alert('Notice created successfully!')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create notice')
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = { ...announcementForm, status: 'published' }
      await messagingAPI.createAnnouncement(data)
      setAnnouncementForm({
        title: '',
        content: '',
        send_to_all: true,
        send_to_teachers: false,
        send_to_students: false,
      })
      setShowAnnouncementDialog(false)
      await fetchAllData()
      alert('Announcement published successfully!')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create announcement')
    }
  }

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('Are you sure?')) return
    try {
      await messagingAPI.deleteNotice(id)
      await fetchAllData()
    } catch (err: any) {
      setError('Failed to delete notice')
    }
  }

  const handlePinNotice = async (id: number) => {
    try {
      await messagingAPI.pinNotice(id)
      await fetchAllData()
    } catch (err: any) {
      setError('Failed to pin notice')
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Messaging & Announcements</h1>
          <p className="text-gray-600">Send notices and announcements to teachers and students</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {(['notices', 'announcements', 'messages'] as const).map((tab) => (
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === 'notices' && (
          <div>
            <button
              onClick={() => setShowNoticeDialog(true)}
              className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Bell size={20} /> Create Notice
            </button>

            {/* Notice Dialog */}
            {showNoticeDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create Notice</h2>
                    <button onClick={() => setShowNoticeDialog(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateNotice} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={noticeForm.title}
                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Notice title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Content *</label>
                      <textarea
                        required
                        value={noticeForm.content}
                        onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 h-40"
                        placeholder="Notice content"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={noticeForm.priority}
                        onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Recipients</label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={noticeForm.send_to_all}
                          onChange={(e) =>
                            setNoticeForm({
                              ...noticeForm,
                              send_to_all: e.target.checked,
                              send_to_teachers: false,
                              send_to_students: false,
                            })
                          }
                        />
                        Send to all
                      </label>
                      {!noticeForm.send_to_all && (
                        <>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={noticeForm.send_to_teachers}
                              onChange={(e) =>
                                setNoticeForm({ ...noticeForm, send_to_teachers: e.target.checked })
                              }
                            />
                            Teachers only
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={noticeForm.send_to_students}
                              onChange={(e) =>
                                setNoticeForm({ ...noticeForm, send_to_students: e.target.checked })
                              }
                            />
                            Students only
                          </label>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowNoticeDialog(false)}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Create Notice
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notices List */}
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
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
                        {notice.is_pinned && <Pin size={16} className="text-blue-600" />}
                      </div>
                      <p className="text-gray-600 mb-2">{notice.content}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePinNotice(notice.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Pin size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <button
              onClick={() => setShowAnnouncementDialog(true)}
              className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Send size={20} /> Create Announcement
            </button>

            {/* Announcement Dialog */}
            {showAnnouncementDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create Announcement</h2>
                    <button onClick={() => setShowAnnouncementDialog(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={announcementForm.title}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, title: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Announcement title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Content *</label>
                      <textarea
                        required
                        value={announcementForm.content}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, content: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 h-40"
                        placeholder="Announcement content"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Recipients</label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={announcementForm.send_to_all}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              send_to_all: e.target.checked,
                              send_to_teachers: false,
                              send_to_students: false,
                            })
                          }
                        />
                        Send to all
                      </label>
                      {!announcementForm.send_to_all && (
                        <>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={announcementForm.send_to_teachers}
                              onChange={(e) =>
                                setAnnouncementForm({
                                  ...announcementForm,
                                  send_to_teachers: e.target.checked,
                                })
                              }
                            />
                            Teachers only
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={announcementForm.send_to_students}
                              onChange={(e) =>
                                setAnnouncementForm({
                                  ...announcementForm,
                                  send_to_students: e.target.checked,
                                })
                              }
                            />
                            Students only
                          </label>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementDialog(false)}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Publish Announcement
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div>
                    <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                    <p className="text-gray-600 mb-2">{announcement.content}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Status: {announcement.status}</span>
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-gray-600">Direct messaging feature coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
