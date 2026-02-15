"use client"

import React, { useState, useEffect, useRef } from "react"
import { academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  FolderPlus,
  Upload,
  RefreshCw,
  Search,
  Grid3x3,
  List,
  Folder,
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  FolderOpen,
  Home,
  ChevronRight,
  X,
  Download,
  Sparkles,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import Loader from "@/components/loader"

interface DocumentFolder {
  id: number
  name: string
  parent_folder: number | null
  subfolder_count: number
  document_count: number
  created_at: string
}

interface Document {
  id: number
  title: string
  document_type: string
  file: string
  folder: number | null
  uploaded_by_name: string
  created_at: string
  is_shared: boolean
}

interface BreadcrumbItem {
  id: number | null
  name: string
}

interface TeacherFileExplorerProps {
  onGenerateQuestions?: (docId: number) => void
}

export default function TeacherFileExplorer({ onGenerateQuestions }: TeacherFileExplorerProps) {
  // State management
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: "Home" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [classes, setClasses] = useState<any[]>([])

  // Dialog states
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Form states
  const [newFolderName, setNewFolderName] = useState("")
  const [renameTarget, setRenameTarget] = useState<{ id: number; name: string; type: "folder" | "document" } | null>(null)
  const [renameName, setRenameName] = useState("")
  const [shareTarget, setShareTarget] = useState<number | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [moveTarget, setMoveTarget] = useState<{ id: number; type: "folder" | "document" } | null>(null)
  const [moveDestination, setMoveDestination] = useState<number | null>(null)
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load initial data
  useEffect(() => {
    loadFolderContents(currentFolderId)
    loadClasses()
  }, [currentFolderId])

  const loadClasses = async () => {
    try {
      const response = await academicsAPI.classes()
      setClasses(response.data.results || response.data || [])
    } catch (err) {
      console.error("Failed to load classes:", err)
    }
  }

  const loadFolderContents = async (folderId: number | null) => {
    try {
      setLoading(true)
      setError(null)

      if (folderId === null) {
        // Load root level - get all folders and filter client-side for root folders
        const [foldersRes, docsRes] = await Promise.all([
          academicsAPI.documentFolders(),
          academicsAPI.documents(),
        ])
        
        console.log("All folders response:", foldersRes.data)
        console.log("All documents response:", docsRes.data)
        
        // Filter for root folders (those without parent_folder)
        const allFolders = foldersRes.data.results || foldersRes.data || []
        const rootFolders = allFolders.filter((folder: DocumentFolder) => {
          console.log("Checking folder:", folder.name, "parent_folder:", folder.parent_folder)
          return folder.parent_folder === null || folder.parent_folder === undefined
        })
        
        console.log("Root folders after filter:", rootFolders)
        
        // Filter for root documents (those without folder)
        const allDocs = docsRes.data.results || docsRes.data || []
        const rootDocs = allDocs.filter((doc: Document) => doc.folder === null || doc.folder === undefined)
        
        console.log("Root documents after filter:", rootDocs)
        
        setFolders(rootFolders)
        setDocuments(rootDocs)
        setBreadcrumb([{ id: null, name: "Home" }])
      } else {
        // Load specific folder
        const response = await academicsAPI.getFolderChildren(folderId)
        setFolders(response.data.folders || [])
        setDocuments(response.data.documents || [])

        // Update breadcrumb
        const breadcrumbRes = await academicsAPI.getFolderBreadcrumb(folderId)
        setBreadcrumb([{ id: null, name: "Home" }, ...breadcrumbRes.data.breadcrumb])
      }
    } catch (err: any) {
      console.error("Failed to load folder contents:", err)
      setError("Failed to load folder contents")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Folder name is required")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await academicsAPI.createDocumentFolder({
        name: newFolderName,
        parent_folder: currentFolderId,
      })
      
      console.log("Folder created successfully:", response.data)
      setNewFolderName("")
      setShowNewFolderDialog(false)
      
      // Reload folder contents
      await loadFolderContents(currentFolderId)
    } catch (err: any) {
      console.error("Failed to create folder:", err)
      console.error("Error response:", err.response?.data)
      setError(err.response?.data?.detail || err.response?.data?.error || "Failed to create folder")
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFiles = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      setError("Please select files to upload")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const uploadPromises = Array.from(uploadFiles).map(async (file) => {
        const formData = new FormData()
        formData.append("title", file.name)
        formData.append("document_type", "notes")
        formData.append("file", file)
        if (currentFolderId) {
          formData.append("folder", currentFolderId.toString())
        }
        
        console.log("Uploading file:", file.name, "to folder:", currentFolderId)
        return academicsAPI.uploadDocument(formData)
      })

      const results = await Promise.all(uploadPromises)
      console.log("Upload results:", results)
      
      setUploadFiles(null)
      setShowUploadDialog(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      
      // Reload folder contents
      await loadFolderContents(currentFolderId)
    } catch (err: any) {
      console.error("Failed to upload files:", err)
      console.error("Error response:", err.response?.data)
      
      // Extract detailed error message
      let errorMessage = "Failed to upload files"
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'string') {
          errorMessage = errorData
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else {
          // Try to get first error from any field
          const firstKey = Object.keys(errorData)[0]
          if (firstKey && errorData[firstKey]) {
            const firstError = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey]
            errorMessage = `${firstKey}: ${firstError}`
          }
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return

    try {
      setLoading(true)
      if (renameTarget.type === "folder") {
        await academicsAPI.updateDocumentFolder(renameTarget.id, { name: renameName })
      } else {
        const formData = new FormData()
        formData.append("title", renameName)
        await academicsAPI.updateDocument(renameTarget.id, formData)
      }
      setShowRenameDialog(false)
      setRenameTarget(null)
      setRenameName("")
      loadFolderContents(currentFolderId)
    } catch (err: any) {
      console.error("Failed to rename:", err)
      setError("Failed to rename item")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, type: "folder" | "document") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      setLoading(true)
      if (type === "folder") {
        await academicsAPI.deleteDocumentFolder(id)
      } else {
        await academicsAPI.deleteDocument(id)
      }
      loadFolderContents(currentFolderId)
    } catch (err: any) {
      console.error("Failed to delete:", err)
      setError("Failed to delete item")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!shareTarget || selectedClasses.length === 0) {
      setError("Please select at least one class")
      return
    }

    try {
      setLoading(true)
      await academicsAPI.shareDocumentWithClasses(shareTarget, selectedClasses)
      setShowShareDialog(false)
      setShareTarget(null)
      setSelectedClasses([])
      loadFolderContents(currentFolderId)
    } catch (err: any) {
      console.error("Failed to share document:", err)
      setError("Failed to share document")
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async () => {
    if (!moveTarget) return

    try {
      setLoading(true)
      if (moveTarget.type === "folder") {
        await academicsAPI.updateDocumentFolder(moveTarget.id, {
          parent_folder: moveDestination,
        })
      } else {
        await academicsAPI.moveDocumentToFolder(moveTarget.id, moveDestination)
      }
      setShowMoveDialog(false)
      setMoveTarget(null)
      setMoveDestination(null)
      loadFolderContents(currentFolderId)
    } catch (err: any) {
      console.error("Failed to move:", err)
      setError("Failed to move item")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadFolderContents(currentFolderId)
      return
    }

    try {
      setLoading(true)
      const response = await academicsAPI.searchDocuments(searchTerm)
      setDocuments(response.data || [])
      setFolders([]) // Hide folders during search
    } catch (err: any) {
      console.error("Search failed:", err)
      setError("Search failed")
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderId: number | null) => {
    setCurrentFolderId(folderId)
    setSearchTerm("")
    setSelectedItems(new Set())
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    return <FileText className="w-8 h-8 text-blue-500" />
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg border">
        <Button onClick={() => setShowNewFolderDialog(true)} size="sm" variant="outline">
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
        <Button onClick={() => setShowUploadDialog(true)} size="sm" variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button onClick={() => loadFolderContents(currentFolderId)} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <div className="flex-1 flex items-center gap-2 min-w-[200px]">
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={() => setViewMode("grid")}
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setViewMode("list")}
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg overflow-x-auto">
        {breadcrumb.map((item, index) => (
          <React.Fragment key={item.id || "root"}>
            <button
              onClick={() => navigateToFolder(item.id)}
              className="flex items-center gap-1 text-sm hover:text-blue-600 whitespace-nowrap"
            >
              {index === 0 ? <Home className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
              <span>{item.name}</span>
            </button>
            {index < breadcrumb.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </React.Fragment>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button onClick={() => setError(null)} size="sm" variant="ghost">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="md" color="#3b82f6" />
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-2"}>
          {/* Folders */}
          {folders.map((folder) => (
            <Card
              key={`folder-${folder.id}`}
              className={`${
                viewMode === "grid"
                  ? "p-4 hover:shadow-lg cursor-pointer transition-shadow"
                  : "p-3 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <div className={viewMode === "grid" ? "space-y-2" : "flex items-center justify-between"}>
                <div
                  className={viewMode === "grid" ? "flex flex-col items-center" : "flex items-center gap-3 flex-1"}
                  onDoubleClick={() => navigateToFolder(folder.id)}
                >
                  <FolderOpen className="w-12 h-12 text-yellow-500" />
                  <div className={viewMode === "grid" ? "text-center" : ""}>
                    <p className="font-medium text-sm truncate">{folder.name}</p>
                    <p className="text-xs text-gray-500">
                      {folder.subfolder_count} folders, {folder.document_count} files
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => navigateToFolder(folder.id)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameTarget({ id: folder.id, name: folder.name, type: "folder" })
                        setRenameName(folder.name)
                        setShowRenameDialog(true)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setMoveTarget({ id: folder.id, type: "folder" })
                        setShowMoveDialog(true)
                      }}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(folder.id, "folder")} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}

          {/* Documents */}
          {documents.map((doc) => (
            <Card
              key={`doc-${doc.id}`}
              className={`${
                viewMode === "grid"
                  ? "p-4 hover:shadow-lg transition-shadow"
                  : "p-3 hover:bg-gray-50"
              }`}
            >
              <div className={viewMode === "grid" ? "space-y-2" : "flex items-center justify-between"}>
                <div className={viewMode === "grid" ? "flex flex-col items-center" : "flex items-center gap-3 flex-1"}>
                  {getFileIcon(doc.title)}
                  <div className={viewMode === "grid" ? "text-center" : ""}>
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{doc.document_type}</p>
                    {doc.is_shared && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Shared</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => window.open(doc.file, "_blank")}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    {onGenerateQuestions && (
                      <DropdownMenuItem onClick={() => onGenerateQuestions(doc.id)}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Questions
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameTarget({ id: doc.id, name: doc.title, type: "document" })
                        setRenameName(doc.title)
                        setShowRenameDialog(true)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setShareTarget(doc.id)
                        setShowShareDialog(true)
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share with Classes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setMoveTarget({ id: doc.id, type: "document" })
                        setShowMoveDialog(true)
                      }}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(doc.id, "document")} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}

          {/* Empty State */}
          {folders.length === 0 && documents.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>This folder is empty</p>
              <p className="text-sm">Create a folder or upload files to get started</p>
            </div>
          )}
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Files</Label>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
              />
              {uploadFiles && (
                <p className="text-sm text-gray-600 mt-2">
                  {uploadFiles.length} file(s) selected
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadFiles}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Name</Label>
              <Input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder="Enter new name"
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share with Classes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`class-${cls.id}`}
                    checked={selectedClasses.includes(cls.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedClasses([...selectedClasses, cls.id])
                      } else {
                        setSelectedClasses(selectedClasses.filter((id) => id !== cls.id))
                      }
                    }}
                  />
                  <label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                    {cls.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Destination</Label>
              <select
                value={moveDestination || ""}
                onChange={(e) => setMoveDestination(e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Root Folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
