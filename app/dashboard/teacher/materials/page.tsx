"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { academicsAPI, authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Download, FileText, Search, Sparkles, X, Settings, Bell, MessageCircle, BookOpen, Calendar, BarChart3, Zap, Copy, FolderOpen } from "lucide-react"
import Loader from "@/components/loader"
import TeacherFileExplorer from "@/components/teacher-file-explorer"


interface Document {
  id: number
  title: string
  document_type: string
  file: string
  uploaded_by_name: string
  created_at: string
}

export default function TeacherDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiQuestions, setAiQuestions] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiMode, setAiMode] = useState<"document" | "topic">("document")
  const [aiTopic, setAiTopic] = useState("")
  const [aiSubject, setAiSubject] = useState("")
  const [aiSettings, setAiSettings] = useState({
    num_questions: 5,
    question_type: "multiple_choice",
    difficulty: "medium"
  })
  const [formData, setFormData] = useState({
    title: "",
    document_type: "notes",
    description: "",
    related_subject: "",
    related_class: "",
    file: null as File | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Refresh user data from server to ensure it's up-to-date
      try {
        const userRes = await authAPI.me()
        if (userRes.data) {
          sessionStorage.setItem('user', JSON.stringify(userRes.data))
        }
      } catch (userErr) {
        console.error('[v0] Failed to refresh user data:', userErr)
        // Do not block page load, but log the error.
        // The upload might fail if the user data is stale.
      }

      const [docsRes, subjectsRes, classesRes] = await Promise.all([
        academicsAPI.documents(),
        academicsAPI.subjects(),
        academicsAPI.classes(),
      ])

      setDocuments(docsRes.data.results || docsRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
    } catch (err: any) {
      console.error("[v0] Fetch error:", err)
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelectAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formDataToSend = new FormData()
    formDataToSend.append("title", file.name) // Use file name as title
    formDataToSend.append("document_type", "notes") // Default type
    formDataToSend.append("file", file)

    try {
      setAiLoading(true)
      setError(null)
      const uploadResponse = await academicsAPI.uploadDocument(formDataToSend)
      const newDocId = uploadResponse.data.id

      await fetchData() // Refresh documents list

      // Open AI panel and trigger generation
      setSelectedDocId(newDocId)
      setAiMode("document")
      setShowAIPanel(true)
      handleGenerateQuestions(newDocId) // Pass new ID directly
    } catch (err: any) {
      console.error("[v0] Quick Upload error:", err)
      const errorData = err?.response?.data
      let errorMsg = "Failed to upload and process document"
      if (errorData) {
        // ... (existing error handling logic)
      }
      setError(errorMsg)
      setAiLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.file) {
        setError("Please fill in required fields and select a file")
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("document_type", formData.document_type)
      formDataToSend.append("description", formData.description)
      if (formData.related_subject && formData.related_subject !== "") formDataToSend.append("related_subject", formData.related_subject)
      if (formData.related_class && formData.related_class !== "") formDataToSend.append("related_class", formData.related_class)
      if (formData.file) formDataToSend.append("file", formData.file)

      await academicsAPI.uploadDocument(formDataToSend)

      setIsOpen(false)
      setFormData({ title: "", document_type: "notes", description: "", related_subject: "", related_class: "", file: null })
      if (fileInputRef.current) fileInputRef.current.value = ""
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      const errorData = err?.response?.data
      let errorMsg = "Failed to upload document"

      if (errorData) {
        if (errorData.school && (errorData.school[0].includes("required") || errorData.school[0].includes("null"))) {
          errorMsg = "Your account is not associated with a school. Please contact an administrator to be assigned to a school before uploading materials."
        } else {
            try {
              const firstErrorKey = Object.keys(errorData)[0]
              const firstErrorValue = errorData[firstErrorKey]
              
              if (typeof firstErrorValue === 'string') {
                errorMsg = `${firstErrorKey}: ${firstErrorValue}`
              } else if (Array.isArray(firstErrorValue)) {
                errorMsg = `${firstErrorKey}: ${firstErrorValue[0]}`
              } else {
                errorMsg = JSON.stringify(errorData)
              }
            } catch {
              errorMsg = "An unknown error occurred during upload."
            }
        }
      } else {
        errorMsg = err?.message || "Failed to upload document"
      }
      setError(errorMsg)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        await academicsAPI.deleteDocument(id)
        setError(null)
        fetchData()
      } catch (err: any) {
        console.error("[v0] Delete error:", err)
        setError("Failed to delete document. Please try again.")
      }
    }
  }

  const handleGenerateQuestions = async (newDocId: any) => {
    if (aiMode === "document" && !selectedDocId) {
      setAiError("No document selected")
      return
    }

    if (aiMode === "topic" && !aiTopic.trim()) {
      setAiError("Please enter a topic or question")
      return
    }

    try {
      setAiLoading(true)
      setAiError(null)
      setAiQuestions(null)
      
      if (aiMode === "document") {
        console.log("[v0] Generating questions for document:", selectedDocId)
        
        const response = await academicsAPI.generateQuestionsFromDocument(selectedDocId!, aiSettings)
        console.log("[v0] Questions generated successfully:", response.data)
        setAiQuestions(response.data)
      } else {
        // Topic-based mode
        console.log("[v0] Generating questions for topic:", aiTopic)
        
        const payload: any = {
          topic: aiTopic,
          ...aiSettings,
          num_questions: aiSettings.num_questions || 5,
        }

        if (aiSubject && aiSubject.trim()) {
          payload.subject = aiSubject
        }

        const response = await academicsAPI.generateQuestionsFromTopic(payload)
        console.log("[v0] Questions generated from topic:", response.data)
        setAiQuestions(response.data)
      }
    } catch (err: any) {
      console.error("[v0] Error generating questions:", err)
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail ||
                          err?.message || 
                          "Failed to generate questions. Please ensure OPENAI_API_KEY is configured in environment variables"
      setAiError(errorMessage)
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateQuestionsFromExplorer = async (docId: number) => {
    setSelectedDocId(docId)
    setAiMode("document")
    setShowAIPanel(true)
    setAiQuestions(null)
    setAiError(null)
    
    // Automatically trigger AI generation for the selected document
    try {
      setAiLoading(true)
      const response = await academicsAPI.generateQuestionsFromDocument(docId, aiSettings)
      setAiQuestions(response.data)
    } catch (err: any) {
      console.error("AI generation failed:", err)
      setAiError(err.response?.data?.error || "Failed to generate questions. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader size="md" color="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Learning Materials</h1>
          <p className="text-gray-600 mt-2">Manage your teaching materials and use AI to generate exam questions</p>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="file-manager" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="file-manager" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            File Manager
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* File Manager Tab */}
        <TabsContent value="file-manager" className="mt-6">
          <TeacherFileExplorer onGenerateQuestions={handleGenerateQuestionsFromExplorer} />
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="mt-6">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => {
                  setShowAIPanel(true)
                  setAiMode("topic")
                  setSelectedDocId(null)
                  setAiQuestions(null)
                  setAiError(null)
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-shadow"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate from Topic
              </Button>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-5 h-5 mr-2" />
                    Quick Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quick Upload Material</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

                    <div>
                      <Label>Material Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Chapter 5 Notes"
                      />
                    </div>

                    <div>
                      <Label>Material Type</Label>
                      <select
                        value={formData.document_type}
                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="notes">Notes</option>
                        <option value="assignment">Assignment</option>
                        <option value="syllabus">Syllabus</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Subject (Optional)</Label>
                      <select
                        value={formData.related_subject}
                        onChange={(e) => setFormData({ ...formData, related_subject: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Class (Optional)</Label>
                      <select
                        value={formData.related_class}
                        onChange={(e) => setFormData({ ...formData, related_class: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Upload File *</Label>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600">
                      Upload Material
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-xs text-gray-500">
                          {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDocId(doc.id)
                            setAiMode("document")
                            setShowAIPanel(true)
                            setAiQuestions(null)
                            setAiError(null)
                          }}
                          className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Questions
                        </Button>
                        <a href={doc.file} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Question Generation Modal */}
      {showAIPanel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-50 to-purple-50 px-6 py-4 border-b border-teal-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">◆</div>
                  <h2 className="text-lg font-semibold text-gray-900">Tower Harmlert Ai</h2>
                </div>
                <button 
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex h-[calc(90vh-80px)]">
                {/* Left Sidebar */}
                <div className="w-80 border-r bg-gray-50 flex flex-col overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Input placeholder="Search materials..." className="pl-10 text-sm" />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 px-2 mb-3">Learning Materials</p>
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocId(doc.id)
                            setAiMode("document")
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition ${
                            selectedDocId === doc.id
                              ? "border-teal-300 bg-teal-50"
                              : "border-gray-200 hover:border-teal-300 bg-white"
                          }`}
                        >
                          <h4 className="text-sm font-semibold text-gray-900">{doc.title}</h4>
                          <p className="text-xs text-gray-600 mt-1 capitalize">{doc.document_type}</p>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm px-2">No materials uploaded</p>
                    )}
                  </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Top Bar */}
                  <div className="border-b px-6 py-4 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Generate Exam Questions</h3>
                      <p className="text-xs text-gray-500 mt-1">Create questions powered by AI</p>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Mode Selection */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Label className="text-gray-700 block mb-3 font-semibold">Mode</Label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setAiMode("document")
                      setAiQuestions(null)
                      setAiError(null)
                    }}
                    className={aiMode === "document" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"}
                  >
                    From Document
                  </Button>
                  <Button
                    onClick={() => {
                      setAiMode("topic")
                      setAiQuestions(null)
                      setAiError(null)
                    }}
                    className={aiMode === "topic" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"}
                  >
                    From Topic
                  </Button>
                </div>
              </div>

              {/* Topic Input (only in topic mode) */}
              {aiMode === "topic" && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                  <Label className="text-gray-700 font-semibold">Topic or Question</Label>
                  <Textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Enter the topic, concept, or question you want to generate questions about..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg"
                  />
                  <div>
                    <Label className="text-gray-700 font-semibold block mb-2">Subject (Optional)</Label>
                    <select
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900">Settings</h3>

                <div>
                  <Label className="text-gray-700 font-medium block mb-2">Number of Questions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={aiSettings.num_questions}
                    onChange={(e) => setAiSettings({ ...aiSettings, num_questions: parseInt(e.target.value) })}
                    className="border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-600 mt-1">Between 1 and 20</p>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium block mb-2">Question Type</Label>
                  <select
                    value={aiSettings.question_type}
                    onChange={(e) => setAiSettings({ ...aiSettings, question_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium block mb-2">Difficulty</Label>
                  <select
                    value={aiSettings.difficulty}
                    onChange={(e) => setAiSettings({ ...aiSettings, difficulty: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <Button
                  onClick={handleGenerateQuestions}
                  disabled={aiLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg py-2"
                >
                  {aiLoading ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {aiError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-800 font-semibold">Error</p>
                  <p className="text-red-700 text-sm mt-1">{aiError}</p>
                </div>
              )}

              {/* Questions Display */}
              {aiQuestions && (
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-teal-900 font-semibold flex items-center gap-2">
                      <Zap size={16} />
                      Questions Generated Successfully
                    </p>
                    <p className="text-teal-800 text-sm mt-2">
                      {aiQuestions.count || 0} question{aiQuestions.count !== 1 ? "s" : ""} created
                    </p>
                  </div>

                  {/* Display Questions */}
                  {aiQuestions.questions && (
                    <div className="space-y-4">
                      {aiQuestions.questions.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <h4 className="font-semibold text-gray-900 mb-3">Q{idx + 1}: {q.question}</h4>
                          
                          {q.options && (
                            <div className="ml-4 space-y-2 mb-4">
                              {q.options.map((opt: string, optIdx: number) => (
                                <p
                                  key={optIdx}
                                  className={`text-sm p-2 rounded ${
                                    q.correct_answer === String.fromCharCode(65 + optIdx)
                                      ? "font-semibold text-teal-700 bg-teal-50 border border-teal-200"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {opt}
                                </p>
                              ))}
                            </div>
                          )}

                          {q.explanation && (
                            <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-lg mt-3">
                              <p className="text-xs font-semibold text-cyan-900">Explanation:</p>
                              <p className="text-sm text-cyan-800 mt-1">{q.explanation}</p>
                            </div>
                          )}

                          {q.model_answer && (
                            <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-lg mt-3">
                              <p className="text-xs font-semibold text-cyan-900">Model Answer:</p>
                              <p className="text-sm text-cyan-800 mt-1">{q.model_answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Copy Button */}
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(aiQuestions, null, 2))
                      alert("Questions copied to clipboard!")
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg py-2"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Questions
                  </Button>
                </div>
              )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  )
}
