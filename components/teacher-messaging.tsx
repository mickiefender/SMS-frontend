"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function TeacherMessaging() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRecipient) return
    // TODO: Implement message sending via API
    setNewMessage("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messaging</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Recipient</label>
          <select
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Choose recipient</option>
            <option value="all_students">All Students</option>
            <option value="parents">Parents</option>
          </select>
        </div>

        <div className="space-y-2 h-64 overflow-y-auto border rounded p-3 bg-muted/50">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages yet</p>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id} className="text-sm">
                <p className="font-medium">{msg.sender}</p>
                <p>{msg.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Type message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  )
}
