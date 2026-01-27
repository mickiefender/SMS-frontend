"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Download, FileText, Search, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Loader from "@/components/loader"

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
      if (formData.related_subject) formDataToSend.append("related_subject", formData.related_subject)
      if (formData.related_class) formDataToSend.append("related_class", formData.related_class)
      if (formData.file) formDataToSend.append("file", formData.file)

      await academicsAPI.createDocument(formDataToSend)

      setIsOpen(false)
      setFormData({ title: "", document_type: "notes", description: "", related_subject: "", related_class: "", file: null })
      if (fileInputRef.current) fileInputRef.current.value = ""
      setError(null)
      fetchData()
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      const errorMsg = err?.response?.data?.detail || 
                      err?.response?.data?.file?.[0] ||
                      err?.response?.data?.title?.[0] ||
                      err?.message ||
                      "Failed to upload document"
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

  const handleGenerateQuestions = async () => {
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
                          "Failed to generate questions. Please ensure OPENAI_API_KEY is configured on the server."
      setAiError(errorMessage)
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
          <p className="text-gray-600 mt-2">Upload teaching materials and use AI to generate exam questions</p>
        </div>
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
            Teacher AI
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-5 h-5 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Study Material</DialogTitle>
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

        <Card>
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

        {/* AI Question Generation Panel */}
        <Sheet open={showAIPanel} onOpenChange={setShowAIPanel}>
          <SheetContent side="right" className="w-full md:w-2/3 lg:w-1/2 overflow-y-auto">
            <SheetHeader className="border-b pb-4 mb-6">
              <SheetTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                AI Question Generator
              </SheetTitle>
              <p className="text-sm text-gray-600 mt-2">Generate exam questions from your learning materials powered by AI</p>
            </SheetHeader>

            <div className="space-y-6">
              {/* Mode Selection */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <Label className="text-gray-700 block mb-3">Choose Mode</Label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setAiMode("document")
                      setSelectedDocId(null)
                      setAiTopic("")
                      setAiQuestions(null)
                      setAiError(null)
                    }}
                    variant={aiMode === "document" ? "default" : "outline"}
                    className={aiMode === "document" ? "bg-blue-600 text-white" : ""}
                  >
                    From Document
                  </Button>
                  <Button
                    onClick={() => {
                      setAiMode("topic")
                      setSelectedDocId(null)
                      setAiQuestions(null)
                      setAiError(null)
                    }}
                    variant={aiMode === "topic" ? "default" : "outline"}
                    className={aiMode === "topic" ? "bg-blue-600 text-white" : ""}
                  >
                    From Topic
                  </Button>
                </div>
              </div>

              {/* Document Selection (only in document mode) */}
              {aiMode === "document" && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <Label className="text-gray-700">Select Document</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`w-full text-left p-3 rounded border-2 transition ${
                            selectedDocId === doc.id
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-blue-400"
                          }`}
                        >
                          <h4 className="font-semibold text-sm">{doc.title}</h4>
                          <p className="text-xs text-gray-500">{doc.document_type}</p>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Topic Input (only in topic mode) */}
              {aiMode === "topic" && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <Label className="text-gray-700">Topic or Question</Label>
                  <Textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Enter the topic, concept, or question you want to generate questions about..."
                    rows={4}
                    className="w-full"
                  />
                  <div>
                    <Label className="text-gray-700">Subject (Optional)</Label>
                    <select
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      className="w-full border rounded px-3 py-2 mt-1"
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
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900">Question Settings</h3>

                <div>
                  <Label className="text-gray-700">Number of Questions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={aiSettings.num_questions}
                    onChange={(e) => setAiSettings({ ...aiSettings, num_questions: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">Between 1 and 20 questions</p>
                </div>

                <div>
                  <Label className="text-gray-700">Question Type</Label>
                  <select
                    value={aiSettings.question_type}
                    onChange={(e) => setAiSettings({ ...aiSettings, question_type: e.target.value })}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div>
                  <Label className="text-gray-700">Difficulty Level</Label>
                  <select
                    value={aiSettings.difficulty}
                    onChange={(e) => setAiSettings({ ...aiSettings, difficulty: e.target.value })}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <Button
                  onClick={handleGenerateQuestions}
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  {aiLoading ? (
                    <>Generating Questions...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {aiError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-800 font-semibold">Error</p>
                  <p className="text-red-700 text-sm">{aiError}</p>
                  <p className="text-red-600 text-xs mt-2">Make sure OPENAI_API_KEY is configured in environment variables</p>
                </div>
              )}

              {/* Questions Display */}
              {aiQuestions && (
                <div className="space-y-4">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-green-800 font-semibold">
                      {aiQuestions.ai_name || "School AI"} - Questions Generated Successfully! ✓
                    </p>
                    <p className="text-green-700 text-sm">
                      {aiQuestions.count || 0} question{aiQuestions.count !== 1 ? "s" : ""} created
                    </p>
                  </div>

                  {/* Display Questions */}
                  {aiQuestions.questions && (
                    <div className="space-y-4">
                      {aiQuestions.questions.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-semibold text-gray-900 mb-2">Q{idx + 1}: {q.question}</h4>
                          
                          {q.options && (
                            <div className="ml-4 space-y-2 mb-3">
                              {q.options.map((opt: string, optIdx: number) => (
                                <p
                                  key={optIdx}
                                  className={`text-sm ${
                                    q.correct_answer === String.fromCharCode(65 + optIdx)
                                      ? "font-semibold text-green-700 bg-green-50 p-2 rounded"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {opt}
                                </p>
                              ))}
                            </div>
                          )}

                          {q.explanation && (
                            <div className="bg-blue-50 p-3 rounded mt-2">
                              <p className="text-xs font-semibold text-blue-900">Explanation:</p>
                              <p className="text-sm text-blue-800">{q.explanation}</p>
                            </div>
                          )}

                          {q.model_answer && (
                            <div className="bg-blue-50 p-3 rounded mt-2">
                              <p className="text-xs font-semibold text-blue-900">Model Answer:</p>
                              <p className="text-sm text-blue-800">{q.model_answer}</p>
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
                    variant="outline"
                    className="w-full"
                  >
                    Copy All Questions
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
