'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Folder, File, Plus, Trash2, Download, Grid3X3, List, Search, ChevronRight, Upload, FolderPlus, RefreshCw, Eye, MoreVertical, Copy } from 'lucide-react'
import { academicsAPI } from '@/lib/api'

interface FileExplorerModalProps {
  isOpen: boolean
  onClose: () => void
  onFileSelect?: (fileId: number) => void
  mode?: 'select' | 'manage'
}

interface DocumentFolder {
  id: number
  name: string
  description: string
  subfolder_count: number
  document_count: number
  created_at: string
  parent_folder: number | null
}

interface Document {
  id: number
  title: string
  document_type: string
  file: string
  created_at: string
  folder: number | null
  file_size?: number
}

export function FileExplorerModal({ isOpen, onClose, onFileSelect, mode = 'manage' }: FileExplorerModalProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([{ id: null, name: 'All media' }])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'files'>('all')

  useEffect(() => {
    if (isOpen) {
      loadContent()
    }
  }, [isOpen, currentFolderId])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [foldersRes, docsRes] = await Promise.all([
        academicsAPI.get(`/academics/document-folders/?parent_folder=${currentFolderId || 'null'}`),
        academicsAPI.documents({ folder: currentFolderId || 'all' })
      ])

      setFolders(foldersRes.data.results || foldersRes.data || [])
      setDocuments(docsRes.data.results || docsRes.data || [])
    } catch (err: any) {
      console.error('[v0] Error loading content:', err)
      setError('Failed to load folder contents')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderClick = (folder: DocumentFolder) => {
    setCurrentFolderId(folder.id)
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }])
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index < breadcrumbs.length) {
      const clickedId = breadcrumbs[index].id
      setCurrentFolderId(clickedId)
      setBreadcrumbs(breadcrumbs.slice(0, index + 1))
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await academicsAPI.post('/academics/document-folders/', {
        name: newFolderName,
        parent_folder: currentFolderId
      })
      setNewFolderName('')
      setShowNewFolderDialog(false)
      loadContent()
    } catch (err: any) {
      console.error('[v0] Error creating folder:', err)
      setError('Failed to create folder')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('document_type', 'notes')
      formData.append('file', file)
      if (currentFolderId) formData.append('folder', currentFolderId.toString())

      await academicsAPI.post('/academics/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      loadContent()
    } catch (err: any) {
      console.error('[v0] Error uploading file:', err)
      setError('Failed to upload file')
    }
  }

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm('Delete this folder and all its contents?')) return
    try {
      await academicsAPI.delete(`/academics/document-folders/${folderId}/`)
      loadContent()
    } catch (err: any) {
      console.error('[v0] Error deleting folder:', err)
      setError('Failed to delete folder')
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Delete this file?')) return
    try {
      await academicsAPI.delete(`/academics/documents/${docId}/`)
      loadContent()
    } catch (err: any) {
      console.error('[v0] Error deleting document:', err)
      setError('Failed to delete file')
    }
  }

  const filteredItems = {
    folders: folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())),
    documents: documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  const sortedFolders = filteredItems.folders.sort((a, b) => {
    if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return a.name.localeCompare(b.name)
  })

  const sortedDocuments = filteredItems.documents.sort((a, b) => {
    if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return a.title.localeCompare(b.title)
  })

  const showFolders = filterType === 'all' || filterType === 'folders'
  const showDocuments = filterType === 'all' || filterType === 'files'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-2xl font-bold">Media gallery</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="border-b px-6 py-3 space-y-3">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={loadContent}>
              <RefreshCw className="w-4 h-4 mr-2" />
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white ml-auto">
              <Eye className="w-4 h-4 mr-2" />
              All media
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search in current folder"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Folder className="w-4 h-4" />
                  {crumb.name}
                </button>
                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="border-b px-6 py-2 flex items-center justify-between">
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="name">R-Z Sort</option>
              <option value="date">By Date</option>
            </select>
            <Button variant="outline" size="sm">Actions</Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {showFolders && sortedFolders.map(folder => (
                    <div key={folder.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleFolderClick(folder)}>
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition">
                        <Folder className="w-10 h-10 text-gray-600" />
                      </div>
                      <span className="text-center text-sm truncate w-full">{folder.name}</span>
                      <span className="text-xs text-gray-500">{folder.document_count} files</span>
                    </div>
                  ))}
                  {showDocuments && sortedDocuments.map(doc => (
                    <div key={doc.id} className="flex flex-col items-center gap-2 group">
                      <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                        <File className="w-10 h-10 text-blue-600" />
                      </div>
                      <span className="text-center text-sm truncate w-full">{doc.title}</span>
                      <span className="text-xs text-gray-500">{doc.document_type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {showFolders && sortedFolders.map(folder => (
                    <div key={folder.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => handleFolderClick(folder)}>
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-gray-600" />
                        <span>{folder.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{folder.document_count} files</span>
                    </div>
                  ))}
                  {showDocuments && sortedDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-blue-600" />
                        <span>{doc.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">{doc.document_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">{sortedFolders.length} folders, {sortedDocuments.length} files</span>
          {mode === 'select' && (
            <Button className="bg-green-600 hover:bg-green-700 text-white">Insert</Button>
          )}
        </div>
      </DialogContent>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder} className="bg-blue-600">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
