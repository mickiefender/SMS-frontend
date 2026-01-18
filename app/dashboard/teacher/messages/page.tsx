"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Search } from "lucide-react"

function MessagesContent() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations/")
        const data = await res.json()
        setConversations(data.results || data || [])
      } catch (error) {
        console.error("Failed to fetch conversations:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation) return

    try {
      await fetch("/api/messages/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: selectedConversation.id,
          message: messageText,
        }),
      })
      setMessageText("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  if (loading) return <div className="text-center py-8">Loading messages...</div>

  return (
    <div className="space-y-6 h-[600px]">
      <div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with students</p>
      </div>

      <div className="flex gap-4 h-full bg-white rounded-lg shadow overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input placeholder="Search..." className="pl-10" />
            </div>
          </div>
          <div className="divide-y">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConversation(c)}
                className={`w-full p-4 text-left hover:bg-gray-50 ${selectedConversation?.id === c.id ? "bg-red-50" : ""}`}
              >
                <h3 className="font-semibold text-gray-900">{c.participant_name || "Student"}</h3>
                <p className="text-sm text-gray-600 truncate">{c.last_message}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b bg-red-50">
                <h2 className="font-semibold text-lg">{selectedConversation.participant_name || "Student"}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">{/* Messages would be displayed here */}</div>
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button type="submit" className="bg-red-600 hover:bg-red-700 gap-2">
                  <Send size={18} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-600">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return <MessagesContent />
}
