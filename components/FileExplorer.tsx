"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Folder, File, UploadCloud, ArrowLeft, FileText, FileCode, FileImage, FileVideo, FileAudio, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileOrFolder {
  type: "file" | "folder"
  name: string
  size?: number
  lastModified?: Date
  children?: FileOrFolder[]
}

const mockFilesAndFolders: FileOrFolder[] = [
  { 
    type: "folder", 
    name: "Course Materials",
    children: [
      { type: "file", name: "Textbook.pdf", size: 1234567, lastModified: new Date("2023-10-01") },
      { type: "folder", name: "Week 1", children: [
        { type: "file", name: "Lecture1.pptx", size: 2345678, lastModified: new Date("2023-10-02") }
      ]},
    ]
  },
  { type: "folder", name: "Lecture Notes" },
  { type: "file", name: "Syllabus.docx", size: 34567, lastModified: new Date("2023-09-15") },
  { type: "file", name: "Introduction.pptx", size: 12345, lastModified: new Date("2023-09-20") },
]

const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(extension || '')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['xls', 'xlsx'].includes(extension || '')) return <FileCode className="h-5 w-5 text-green-500" />;
    if (['ppt', 'pptx'].includes(extension || '')) return <FileImage className="h-5 w-5 text-orange-500" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return <FileImage className="h-5 w-5 text-purple-500" />;
    if (['mp4', 'mov', 'avi'].includes(extension || '')) return <FileVideo className="h-5 w-5 text-yellow-500" />;
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) return <FileAudio className="h-5 w-5 text-pink-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
}

export default function FileExplorer() {
  const [newFolderName, setNewFolderName] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [rootItems, setRootItems] = useState<FileOrFolder[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    setRootItems(mockFilesAndFolders)
    setCurrentPath([])
  }, [])

  const getCurrentItems = () => {
    let items = rootItems;
    for (const part of currentPath) {
      const folder = items.find(item => item.type === 'folder' && item.name === part);
      if (folder && folder.children) {
        items = folder.children;
      } else {
        return [];
      }
    }
    return items;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  const handleCreateFolder = () => {
    if (!newFolderName) {
      toast({
        title: "Folder name cannot be empty",
        variant: "destructive",
      })
      return
    }
    
    const newFolder = { type: "folder", name: newFolderName, children: [] } as FileOrFolder;

    let newRootItems = [...rootItems];
    let currentLevel = newRootItems;

    for (const part of currentPath) {
        const folder = currentLevel.find(item => item.type === 'folder' && item.name === part);
        if (folder && folder.children) {
            currentLevel = folder.children;
        }
    }
    currentLevel.push(newFolder);
    setRootItems(newRootItems);
    setNewFolderName("");
  }

  const handleUpload = async () => {
    if (!files) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const newFileItems = Array.from(files).map(file => ({ type: "file", name: file.name, size: file.size, lastModified: new Date(file.lastModified) } as FileOrFolder))
      
      let newRootItems = [...rootItems];
      let currentLevel = newRootItems;
  
      for (const part of currentPath) {
          const folder = currentLevel.find(item => item.type === 'folder' && item.name === part);
          if (folder && folder.children) {
              currentLevel = folder.children;
          }
      }
      currentLevel.push(...newFileItems);
      setRootItems(newRootItems);
      
      toast({
        title: "Files uploaded",
        description: "Your files have been uploaded successfully.",
      })
      setFiles(null)
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFolderClick = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  }

  const handleBackClick = () => {
    setCurrentPath(currentPath.slice(0, -1));
  }

  const handleRename = (name: string) => {
    const newName = prompt("Enter new name:", name);
    if (newName && newName !== name) {
        // Mock rename
        let newRootItems = [...rootItems];
        let currentLevel = newRootItems;
        for (const part of currentPath) {
            const folder = currentLevel.find(item => item.type === 'folder' && item.name === part);
            if (folder && folder.children) {
                currentLevel = folder.children;
            }
        }
        const item = currentLevel.find(item => item.name === name);
        if (item) {
            item.name = newName;
            setRootItems(newRootItems);
        }
    }
  }

  const handleDelete = (name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        // Mock delete
        let newRootItems = [...rootItems];
        let currentLevel = newRootItems;
        for (const part of currentPath) {
            const folder = currentLevel.find(item => item.type === 'folder' && item.name === part);
            if (folder && folder.children) {
                currentLevel = folder.children;
            }
        }
        const index = currentLevel.findIndex(item => item.name === name);
        if (index > -1) {
            currentLevel.splice(index, 1);
            setRootItems(newRootItems);
        }
    }
  }

  return (
    <div>
        <div className="flex items-center space-x-2">
            {currentPath.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleBackClick}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
            <span>/{currentPath.join('/')}</span>
        </div>
        <div className="grid gap-1 py-4 h-96 overflow-y-auto border rounded-md p-2">
          {getCurrentItems().map((item, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md group">
              <div className="flex-shrink-0" onClick={() => item.type === 'folder' && handleFolderClick(item.name)}>
                {item.type === "folder" ? <Folder className="h-5 w-5 text-yellow-500" /> : getFileIcon(item.name)}
              </div>
              <span className="flex-grow" onClick={() => item.type === 'folder' && handleFolderClick(item.name)}>{item.name}</span>
              <span className="text-sm text-gray-500">{item.size && (item.size / 1024).toFixed(2)} KB</span>
              <span className="text-sm text-gray-500">{item.lastModified && item.lastModified.toLocaleDateString()}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleRename(item.name)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(item.name)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Input
            type="text"
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <Button onClick={handleCreateFolder}>Create Folder</Button>
        </div>
        <div className="flex items-center space-x-2 mt-4">
            <Label htmlFor="file-upload" className="flex items-center space-x-2 cursor-pointer p-2 border rounded-md">
                <UploadCloud className="h-5 w-5" />
                <span>Upload Files/Folders</span>
            </Label>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} multiple webkitdirectory="" />
            <Button onClick={handleUpload} disabled={loading || !files}>
                {loading ? "Uploading..." : "Upload"}
            </Button>
        </div>
    </div>
  )
}
