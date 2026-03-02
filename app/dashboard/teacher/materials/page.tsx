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
import { Plus, Trash2, Download, Search, Sparkles, X, Zap, Copy, FolderOpen, Printer, BookOpen } from "lucide-react"
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

interface AnyQuestion {
  id?: number
  question: string
  options?: string[]
  correct_answer?: string
  explanation?: string
  model_answer?: string
  marking_points?: string[]
  max_marks?: number
  key_points?: string[]
  rubric?: Record<string, string>
}

interface NormalizedQuestions {
  aiName: string
  questionType: string
  count: number
  questions: AnyQuestion[]
  documentTitle?: string
}

function normalizeResponse(data: any, questionType: string): NormalizedQuestions {
  if (data?.questions?.questions && Array.isArray(data.questions.questions)) {
    return {
      aiName: data.ai_name || "School AI",
      questionType,
      count: data.count ?? data.questions.questions.length,
      questions: data.questions.questions,
      documentTitle: data.document_title,
    }
  }
  if (Array.isArray(data?.questions)) {
    return {
      aiName: data.ai_name || "School AI",
      questionType,
      count: data.questions.length,
      questions: data.questions,
      documentTitle: data.document_title,
    }
  }
  return { aiName: data?.ai_name || "School AI", questionType, count: 0, questions: [], documentTitle: data?.document_title }
}

function printQuestions(norm: NormalizedQuestions, mode: "questions" | "answers") {
  const { questions, questionType, documentTitle, aiName } = norm
  const baseTitle = documentTitle ? `Questions — ${documentTitle}` : "Generated Questions"
  const heading = mode === "answers" ? `${baseTitle} (Answer Key)` : baseTitle

  let body = ""
  questions.forEach((q, idx) => {
    body += `<div style="margin-bottom:24px;page-break-inside:avoid;">`
    body += `<p style="font-weight:bold;margin-bottom:8px;line-height:1.5;"><strong>Q${idx + 1}.</strong> ${q.question}</p>`

    if (questionType === "multiple_choice" && q.options?.length) {
      body += `<ol type="A" style="margin-left:24px;margin-bottom:8px;">`
      q.options.forEach((opt) => { body += `<li style="margin-bottom:4px;">${opt}</li>` })
      body += `</ol>`
      if (mode === "answers") {
        body += `<p style="color:#1a5276;margin-top:8px;"><strong>Answer:</strong> ${q.correct_answer ?? "—"}</p>`
        if (q.explanation) body += `<p style="font-style:italic;color:#555;margin-top:4px;font-size:10pt;"><em>Explanation:</em> ${q.explanation}</p>`
      }
    }

    if (questionType === "short_answer") {
      if (mode === "answers") {
        if (q.model_answer) body += `<p style="color:#1a5276;margin-top:8px;"><strong>Model Answer:</strong> ${q.model_answer}</p>`
        if (q.marking_points?.length) {
          body += `<p style="color:#1a5276;margin-top:8px;"><strong>Marking Points:</strong></p><ul style="margin-left:24px;">`
          q.marking_points.forEach((pt) => { body += `<li>${pt}</li>` })
          body += `</ul>`
        }
        if (q.max_marks) body += `<p style="color:#888;font-size:10pt;">[${q.max_marks} marks]</p>`
      } else {
        body += `<div style="border-bottom:1px solid #aaa;margin-top:8px;height:60px;"></div>`
      }
    }

    if (questionType === "essay") {
      if (mode === "answers") {
        if (q.key_points?.length) {
          body += `<p style="color:#1a5276;margin-top:8px;"><strong>Key Points:</strong></p><ul style="margin-left:24px;">`
          q.key_points.forEach((pt) => { body += `<li>${pt}</li>` })
          body += `</ul>`
        }
        if (q.rubric) {
          body += `<p style="color:#1a5276;margin-top:8px;"><strong>Rubric:</strong></p><ul style="margin-left:24px;">`
          Object.entries(q.rubric).forEach(([k, v]) => { body += `<li><strong>${k}:</strong> ${v}</li>` })
          body += `</ul>`
        }
        if (q.max_marks) body += `<p style="color:#888;font-size:10pt;">[${q.max_marks} marks]</p>`
      } else {
        body += `<div style="border-bottom:1px solid #aaa;margin-top:8px;height:120px;"></div>`
      }
    }

    body += `</div>`
  })

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${heading}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;padding:20mm}.header{text-align:center;margin-bottom:24px;border-bottom:2px solid #000;padding-bottom:12px}.header h1{font-size:16pt;font-weight:bold}.header p{font-size:10pt;color:#555;margin-top:4px}ul li{margin-bottom:4px;line-height:1.5}</style>
</head><body>
<div class="header"><h1>${heading}</h1><p>Generated by ${aiName} &nbsp;|&nbsp; ${questions.length} question${questions.length !== 1 ? "s" : ""}</p></div>
${body}
<script>window.onload=function(){window.print()}</script>
</body></html>`

  const win = window.open("", "_blank", "width=900,height=700")
  if (win) { win.document.write(html); win.document.close() }
}

export default function TeacherDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [normalized, setNormalized] = useState<NormalizedQuestions | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiMode, setAiMode] = useState<"document" | "topic">("document")
  const [aiTopic, setAiTopic] = useState("")
  const [aiSubject, setAiSubject] = useState("")
  const [aiSettings, setAiSettings] = useState({
    num_questions: 5,
    question_type: "multiple_choice",
    difficulty: "medium",
  })
  const [formData, setFormData] = useState({
    title: "",
    document_type: "notes",
    description: "",
    related_subject: "",
    related_class: "",
    file: null as File | null,
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      try {
        const userRes = await authAPI.me()
        if (userRes.data) sessionStorage.setItem("user", JSON.stringify(userRes.data))
      } catch {}
      const [docsRes, subjectsRes, classesRes] = await Promise.all([
        academicsAPI.documents(),
        academicsAPI.subjects(),
        academicsAPI.classes(),
      ])
      setDocuments(docsRes.data.results || docsRes.data || [])
      setSubjects(subjectsRes.data.results || subjectsRes.data || [])
      setClasses(classesRes.data.results || classesRes.data || [])
    } catch (err: any) {
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.file) { setError("Please fill in required fields and select a file"); return }
    try {
      const fd = new FormData()
      fd.append("title", formData.title)
      fd.append("document_type", formData.document_type)
      fd.append("description", formData.description)
      if (formData.related_subject) fd.append("related_subject", formData.related_subject)
      if (formData.related_class) fd.append("related_class", formData.related_class)
      if (formData.file) fd.append("file", formData.file)
      await academicsAPI.uploadDocument(fd)
      setIsOpen(false)
      setFormData({ title: "", document_type: "notes", description: "", related_subject: "", related_class: "", file: null })
      if (fileInputRef.current) fileInputRef.current.value = ""
      setError(null)
      fetchData()
    } catch (err: any) {
      const ed = err?.response?.data
      let msg = "Failed to upload document"
      if (ed?.school?.[0]?.includes("required") || ed?.school?.[0]?.includes("null")) {
        msg = "Your account is not associated with a school. Please contact an administrator."
      } else if (ed) {
        const k = Object.keys(ed)[0]; const v = ed[k]
        msg = `${k}: ${Array.isArray(v) ? v[0] : v}`
      } else { msg = err?.message || msg }
      setError(msg)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this material?")) return
    try { await academicsAPI.deleteDocument(id); fetchData() }
    catch { setError("Failed to delete document.") }
  }

  const handleGenerateQuestions = async (overrideDocId?: number) => {
    const docId = overrideDocId ?? selectedDocId
    if (aiMode === "document" && !docId) { setAiError("No document selected. Please select a document from the list."); return }
    if (aiMode === "topic" && !aiTopic.trim()) { setAiError("Please enter a topic or question."); return }
    try {
      setAiLoading(true); setAiError(null); setNormalized(null)
      let data: any
      if (aiMode === "document") {
        const res = await academicsAPI.generateQuestionsFromDocument(docId!, aiSettings)
        data = res.data
      } else {
        const payload: any = { topic: aiTopic, ...aiSettings }
        if (aiSubject.trim()) payload.subject = aiSubject
        const res = await academicsAPI.generateQuestionsFromTopic(payload)
        data = res.data
      }
      console.log("[v0] Raw AI response:", data)
      const norm = normalizeResponse(data, aiSettings.question_type)
      if (norm.count === 0) {
        setAiError("The AI returned 0 questions. Please check that the document has readable text, or try a different topic.")
      } else {
        setNormalized(norm)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to generate questions. Please ensure OPENAI_API_KEY is configured."
      setAiError(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateQuestionsFromExplorer = async (docId: number) => {
    setSelectedDocId(docId); setAiMode("document"); setShowAIPanel(true); setNormalized(null); setAiError(null)
    await handleGenerateQuestions(docId)
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Learning Materials</h1>
          <p className="text-gray-600 mt-2">Manage your teaching materials and use AI to generate exam questions</p>
        </div>
      </div>

      <Tabs defaultValue="file-manager" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="file-manager" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> File Manager
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-manager" className="mt-6">
          <TeacherFileExplorer onGenerateQuestions={handleGenerateQuestionsFromExplorer} />
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6">
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => { setShowAIPanel(true); setAiMode("topic"); setSelectedDocId(null); setNormalized(null); setAiError(null) }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-shadow"
              >
                <Sparkles className="w-5 h-5 mr-2" /> Generate from Topic
              </Button>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-5 h-5 mr-2" /> Quick Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Quick Upload Material</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
                    <div>
                      <Label>Material Title *</Label>
                      <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Chapter 5 Notes" />
                    </div>
                    <div>
                      <Label>Material Type</Label>
                      <select value={formData.document_type} onChange={(e) => setFormData({ ...formData, document_type: e.target.value })} className="w-full border rounded px-3 py-2">
                        <option value="notes">Notes</option>
                        <option value="assignment">Assignment</option>
                        <option value="syllabus">Syllabus</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." rows={3} />
                    </div>
                    <div>
                      <Label>Subject (Optional)</Label>
                      <select value={formData.related_subject} onChange={(e) => setFormData({ ...formData, related_subject: e.target.value })} className="w-full border rounded px-3 py-2">
                        <option value="">Select Subject</option>
                        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Class (Optional)</Label>
                      <select value={formData.related_class} onChange={(e) => setFormData({ ...formData, related_class: e.target.value })} className="w-full border rounded px-3 py-2">
                        <option value="">Select Class</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Upload File *</Label>
                      <Input ref={fileInputRef} type="file" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600">Upload Material</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

            <Card>
              <CardHeader><CardTitle>Recent Materials</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-xs text-gray-500">{doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => { setSelectedDocId(doc.id); setAiMode("document"); setShowAIPanel(true); setNormalized(null); setAiError(null) }}
                          className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Sparkles className="w-4 h-4" /> Generate Questions
                        </Button>
                        <a href={doc.file} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                        </a>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No materials uploaded yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── AI Question Generation Modal ── */}
      {showAIPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-50 to-purple-50 px-6 py-4 border-b border-teal-200 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">◆</div>
                <h2 className="text-lg font-semibold text-gray-900">AI Question Generator</h2>
              </div>
              <button onClick={() => setShowAIPanel(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">

              {/* Left Sidebar */}
              <div className="w-72 border-r bg-gray-50 flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    <Input placeholder="Search materials..." className="pl-10 text-sm" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600 px-2 mb-3">Learning Materials</p>
                  {documents.length > 0 ? documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => { setSelectedDocId(doc.id); setAiMode("document"); setNormalized(null); setAiError(null) }}
                      className={`w-full text-left p-3 rounded-lg border transition ${selectedDocId === doc.id ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:border-teal-300 bg-white"}`}
                    >
                      <h4 className="text-sm font-semibold text-gray-900">{doc.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 capitalize">{doc.document_type}</p>
                    </button>
                  )) : (
                    <p className="text-gray-500 text-sm px-2">No materials uploaded</p>
                  )}
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b px-6 py-4 flex justify-between items-center bg-white flex-shrink-0">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Generate Exam Questions</h3>
                    <p className="text-xs text-gray-500 mt-1">Create questions powered by AI</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {/* Mode Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <Label className="text-gray-700 block mb-3 font-semibold">Mode</Label>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => { setAiMode("document"); setNormalized(null); setAiError(null) }}
                        className={aiMode === "document" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"}
                      >
                        From Document
                      </Button>
                      <Button
                        onClick={() => { setAiMode("topic"); setNormalized(null); setAiError(null) }}
                        className={aiMode === "topic" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"}
                      >
                        From Topic
                      </Button>
                    </div>
                    {aiMode === "document" && selectedDocId && (
                      <p className="text-xs text-teal-700 mt-2">
                        Selected: <strong>{documents.find((d) => d.id === selectedDocId)?.title ?? `Document #${selectedDocId}`}</strong>
                      </p>
                    )}
                    {aiMode === "document" && !selectedDocId && (
                      <p className="text-xs text-amber-600 mt-2">← Select a document from the left panel</p>
                    )}
                  </div>

                  {/* Topic Input */}
                  {aiMode === "topic" && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
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
                        <select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                          <option value="">Select Subject</option>
                          {subjects.map((s) => <option key={s.id} value={s.name || s.id}>{s.name}</option>)}
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
                        type="number" min="1" max="20"
                        value={aiSettings.num_questions}
                        onChange={(e) => setAiSettings({ ...aiSettings, num_questions: parseInt(e.target.value) || 5 })}
                        className="border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-600 mt-1">Between 1 and 20</p>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium block mb-2">Question Type</Label>
                      <select value={aiSettings.question_type} onChange={(e) => setAiSettings({ ...aiSettings, question_type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium block mb-2">Difficulty</Label>
                      <select value={aiSettings.difficulty} onChange={(e) => setAiSettings({ ...aiSettings, difficulty: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <Button
                      onClick={() => handleGenerateQuestions()}
                      disabled={aiLoading}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg py-2"
                    >
                      {aiLoading ? "Generating..." : <><Zap className="w-4 h-4 mr-2" />Generate Questions</>}
                    </Button>
                  </div>

                  {/* Error */}
                  {aiError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                      <p className="text-red-800 font-semibold">Error</p>
                      <p className="text-red-700 text-sm mt-1">{aiError}</p>
                    </div>
                  )}

                  {/* Questions Display */}
                  {normalized && normalized.count > 0 && (
                    <div className="space-y-4">
                      {/* Success banner */}
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <p className="text-teal-900 font-semibold flex items-center gap-2">
                          <Zap size={16} /> Questions Generated Successfully
                        </p>
                        <p className="text-teal-800 text-sm mt-1">
                          {normalized.count} question{normalized.count !== 1 ? "s" : ""} created
                          {normalized.documentTitle ? ` from "${normalized.documentTitle}"` : ""}
                        </p>
                      </div>

                      {/* Print Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          onClick={() => printQuestions(normalized, "questions")}
                          variant="outline"
                          className="flex items-center gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                        >
                          <Printer className="w-4 h-4" /> Print Questions
                        </Button>
                        <Button
                          onClick={() => printQuestions(normalized, "answers")}
                          variant="outline"
                          className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <BookOpen className="w-4 h-4" /> Print Answer Key
                        </Button>
                        <Button
                          onClick={() => {
                            const text = normalized.questions
                              .map((q, i) => {
                                let str = `Q${i + 1}. ${q.question}\n`
                                if (normalized.questionType === "multiple_choice" && q.options?.length) {
                                  q.options.forEach((opt, j) => {
                                    str += `  ${String.fromCharCode(65 + j)}. ${opt}\n`
                                  })
                                  str += `Answer: ${q.correct_answer ?? ""}\n`
                                } else if (normalized.questionType === "short_answer" && q.model_answer) {
                                  str += `Answer: ${q.model_answer}\n`
                                }
                                return str
                              })
                              .join("\n")
                            navigator.clipboard.writeText(text)
                          }}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copy All
                        </Button>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-4">
                        {normalized.questions.map((q, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-7 h-7 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 leading-relaxed">{q.question}</p>

                                {/* Multiple Choice Options */}
                                {normalized.questionType === "multiple_choice" && q.options && q.options.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {q.options.map((opt, optIdx) => {
                                      const letter = String.fromCharCode(65 + optIdx)
                                      const isCorrect =
                                        q.correct_answer === opt ||
                                        q.correct_answer === letter ||
                                        (q.correct_answer?.startsWith(letter + ".") ?? false)
                                      return (
                                        <div
                                          key={optIdx}
                                          className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                            isCorrect
                                              ? "bg-green-50 border border-green-200 text-green-800"
                                              : "bg-gray-50 border border-gray-200 text-gray-700"
                                          }`}
                                        >
                                          <span className="font-semibold w-5 flex-shrink-0">{letter}.</span>
                                          <span className="flex-1">{opt}</span>
                                          {isCorrect && (
                                            <span className="text-green-600 text-xs font-semibold ml-auto">✓ Correct</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                    {q.explanation && (
                                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                        <span className="font-semibold">Explanation: </span>{q.explanation}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Short Answer */}
                                {normalized.questionType === "short_answer" && (
                                  <div className="mt-3 space-y-2">
                                    {q.model_answer && (
                                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                        <span className="font-semibold">Model Answer: </span>{q.model_answer}
                                      </div>
                                    )}
                                    {q.marking_points && q.marking_points.length > 0 && (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                        <p className="font-semibold mb-1">Marking Points:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                          {q.marking_points.map((pt, ptIdx) => (
                                            <li key={ptIdx}>{pt}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {q.max_marks && (
                                      <span className="text-xs text-gray-500 font-medium">[{q.max_marks} marks]</span>
                                    )}
                                  </div>
                                )}

                                {/* Essay */}
                                {normalized.questionType === "essay" && (
                                  <div className="mt-3 space-y-2">
                                    {q.key_points && q.key_points.length > 0 && (
                                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                        <p className="font-semibold mb-1">Key Points:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                          {q.key_points.map((pt, ptIdx) => (
                                            <li key={ptIdx}>{pt}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {q.rubric && Object.keys(q.rubric).length > 0 && (
                                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                                        <p className="font-semibold mb-1">Rubric:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                          {Object.entries(q.rubric).map(([k, v]) => (
                                            <li key={k}><strong>{k}:</strong> {String(v)}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {q.max_marks && (
                                      <span className="text-xs text-gray-500 font-medium">[{q.max_marks} marks]</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
))}
                      </div>
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

