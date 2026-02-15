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
  Filter,
  BookOpen,
  Calendar,
  User,
  FolderOpen,
} from "lucide-react"
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

export default function StudentMaterialsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSubject, setFilterSubject] = useState<string>("all")

  // Get unique subjects and types for filters
  const subjects = Array.from(new Set(documents.map(d => d.subject_name).filter(Boolean)))
  const types = Array.from(new Set(documents.map(d => d.document_type)))

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, filterType, filterSubject])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await academicsAPI.documents()
      const docs = response.data.results || response.data || []
      // Filter only shared documents
      const sharedDocs = docs.filter((doc: Document) => doc.class_name)
      setDocuments(sharedDocs)
    } catch (err: any) {
      console.error("Failed to fetch documents:", err)
      setError("Failed to load materials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.uploaded_by_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.document_type === filterType)
    }

    // Subject filter
    if (filterSubject !== "all") {
      filtered = filtered.filter((doc) => doc.subject_name === filterSubject)
    }

    setFilteredDocuments(filtered)
  }

  const handleDownload = (doc: Document) => {
    window.open(doc.file, "_blank")
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "notes":
        return <FileText className="w-8 h-8 text-blue-500" />
      case "assignment":
        return <BookOpen className="w-8 h-8 text-green-500" />
      case "syllabus":
        return <Calendar className="w-8 h-8 text-purple-500" />
      default:
        return <FileText className="w-8 h-8 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "notes":
        return "bg-blue-100 text-blue-700"
      case "assignment":
        return "bg-green-100 text-green-700"
      case "syllabus":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learning Materials</h1>
        <p className="text-gray-600 mt-2">
          Access materials shared by your teachers
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by subject" />
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

            {/* Refresh Button */}
            <Button onClick={fetchDocuments} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} materials
        </p>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Materials Found
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== "all" || filterSubject !== "all"
                ? "Try adjusting your filters"
                : "Your teachers haven't shared any materials yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(doc.document_type)}
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {doc.title}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {doc.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{doc.uploaded_by_name}</span>
                  </div>

                  {doc.subject_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{doc.subject_name}</span>
                    </div>
                  )}

                  {doc.class_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FolderOpen className="w-4 h-4" />
                      <span>{doc.class_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(doc.document_type)}>
                    {doc.document_type.charAt(0).toUpperCase() +
                      doc.document_type.slice(1)}
                  </Badge>
                </div>

                {/* Download Button */}
                <Button
                  onClick={() => handleDownload(doc)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
