"use client"

import { useState, useEffect } from "react"
import { academicsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  Search,
  BookOpen,
  Calendar,
  User,
  FolderOpen,
  Award,
  ClipboardList,
  RefreshCw,
  Eye,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Loader from "@/components/loader"

interface Document {
  id: number
  title: string
  document_type: string
  description: string
  file: string
  uploaded_by_name: string
  created_at: string
  subject_name: string
  class_name: string
  folder_name: string
}

interface DocTypeConfig {
  label: string
  color: string
  Icon: LucideIcon
  iconColor: string
}

const DOCUMENT_TYPE_CONFIG: Record<string, DocTypeConfig> = {
  certificate: {
    label: "Certificate",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Icon: Award,
    iconColor: "text-yellow-500",
  },
  transcript: {
    label: "Transcript",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    Icon: ClipboardList,
    iconColor: "text-blue-500",
  },
  syllabus: {
    label: "Syllabus",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    Icon: Calendar,
    iconColor: "text-purple-500",
  },
  assignment: {
    label: "Assignment",
    color: "bg-green-100 text-green-800 border-green-200",
    Icon: BookOpen,
    iconColor: "text-green-500",
  },
  notes: {
    label: "Notes",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    Icon: FileText,
    iconColor: "text-indigo-500",
  },
  other: {
    label: "Other",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    Icon: FileText,
    iconColor: "text-gray-500",
  },
}

const DEFAULT_CONFIG: DocTypeConfig = {
  label: "Other",
  color: "bg-gray-100 text-gray-800 border-gray-200",
  Icon: FileText,
  iconColor: "text-gray-500",
}

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const subjects = Array.from(new Set(documents.map((d) => d.subject_name).filter(Boolean)))
  const types = Array.from(new Set(documents.map((d) => d.document_type)))

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    applyFilters()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, searchTerm, filterType, filterSubject])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await academicsAPI.documents()
      const docs: Document[] = response.data.results || response.data || []
      setDocuments(docs)
    } catch (err: unknown) {
      console.error("Failed to fetch documents:", err)
      setError("Failed to load documents. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...documents]

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.document_type === filterType)
    }

    if (filterSubject !== "all") {
      filtered = filtered.filter((doc) => doc.subject_name === filterSubject)
    }

    setFilteredDocuments(filtered)
  }

  const handleDownload = (doc: Document) => {
    window.open(doc.file, "_blank")
  }

  const getDocConfig = (type: string): DocTypeConfig => {
    return DOCUMENT_TYPE_CONFIG[type] ?? DEFAULT_CONFIG
  }

  const getFileExtension = (url: string) => {
    if (!url) return "FILE"
    const parts = url.split(".")
    return parts[parts.length - 1].toUpperCase().slice(0, 4)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="md" color="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-500 mt-1">
            View and download documents posted for you by your school
          </p>
        </div>
        <Button onClick={fetchDocuments} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, config]) => {
          const count = documents.filter((d) => d.document_type === type).length
          const { Icon, iconColor } = config
          return (
            <div
              key={type}
              onClick={() => setFilterType(filterType === type ? "all" : type)}
              className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-md ${
                filterType === type ? "border-blue-500 shadow-md" : "border-gray-100"
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Icon className={`w-7 h-7 ${iconColor}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}s</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by title, subject, or uploader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DOCUMENT_TYPE_CONFIG[type]?.label ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
                </svg>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing <strong>{filteredDocuments.length}</strong> of <strong>{documents.length}</strong> documents
        </span>
        {(filterType !== "all" || filterSubject !== "all" || searchTerm) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterType("all")
              setFilterSubject("all")
              setSearchTerm("")
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Documents Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchTerm || filterType !== "all" || filterSubject !== "all"
                ? "Try adjusting your search or filters."
                : "Your school hasn't posted any documents for you yet."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const config = getDocConfig(doc.document_type)
            const { Icon, iconColor } = config
            return (
              <Card key={doc.id} className="hover:shadow-lg transition-all border border-gray-100">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Icon className={`w-8 h-8 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                        {doc.title}
                      </h3>
                      <Badge className={`mt-1 text-xs border ${config.color}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {getFileExtension(doc.file)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {doc.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                  )}

                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{doc.uploaded_by_name || "School Admin"}</span>
                    </div>
                    {doc.subject_name && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{doc.subject_name}</span>
                      </div>
                    )}
                    {doc.class_name && (
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{doc.class_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </Button>
                    <Button
                      onClick={() => window.open(doc.file, "_blank")}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Document</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Posted By</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const config = getDocConfig(doc.document_type)
                    const { Icon, iconColor } = config
                    return (
                      <tr key={doc.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                              <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <span className="font-medium text-gray-900 line-clamp-1">{doc.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs border ${config.color}`}>{config.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{doc.subject_name || "—"}</td>
                        <td className="py-3 px-4 text-gray-600">{doc.class_name || "—"}</td>
                        <td className="py-3 px-4 text-gray-600">{doc.uploaded_by_name || "Admin"}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.file, "_blank")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
