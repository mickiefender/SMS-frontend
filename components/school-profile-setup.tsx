"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useRef } from "react"
import { schoolsAPI } from "@/lib/api"
import Image from "next/image"
import { Upload, X, Loader2, Save } from "lucide-react"

interface School {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  logo_url: string | null
  logo_url_computed: string | null
  website: string
  status: string
}

export function SchoolProfileSetup() {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [school, setSchool] = useState<School | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSchool()
  }, [])

  const fetchSchool = async () => {
    try {
      setLoading(true)
      const response = await schoolsAPI.list()
      if (response.data.results && response.data.results.length > 0) {
        const schoolData = response.data.results[0]
        setSchool(schoolData)
        // Set logo preview from existing logo
        const logoUrl = schoolData.logo_url || schoolData.logo_url_computed
        if (logoUrl) {
          setLogoPreview(logoUrl)
        }
      }
    } catch (error: any) {
      console.error("[v0] Failed to fetch school:", error)
      // Handle error gracefully - don't crash
      if (error.response?.status === 500) {
        console.warn("Backend server error - school data unavailable")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      setSelectedLogo(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setSelectedLogo(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!school?.id) return

    try {
      setSaving(true)

      // First, upload logo if selected
      if (selectedLogo) {
        setUploadingLogo(true)
        const formData = new FormData()
        formData.append('logo', selectedLogo)
        
        await schoolsAPI.uploadLogo(formData)
        setUploadingLogo(false)
      }

      // Then update school details (excluding logo since it was uploaded separately)
      const { logo_url, logo_url_computed, ...schoolData } = school
      await schoolsAPI.update(school.id, schoolData)

      // Refresh school data
      await fetchSchool()
      
      setEditing(false)
      setSelectedLogo(null)
    } catch (error) {
      console.error("[v0] Failed to update school:", error)
      alert('Failed to update school profile. Please try again.')
    } finally {
      setSaving(false)
      setUploadingLogo(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setSelectedLogo(null)
    // Reset logo preview to current logo
    const logoUrl = school?.logo_url || school?.logo_url_computed
    setLogoPreview(logoUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateField = (field: string, value: string) => {
    if (school) {
      setSchool({ ...school, [field]: value })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading school profile...</span>
        </CardContent>
      </Card>
    )
  }

  if (!school) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No school found. Please contact administrator.
        </CardContent>
      </Card>
    )
  }

  const editableFields = [
    { key: 'name', label: 'School Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'phone', label: 'Phone Number', type: 'tel' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State/Province', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'postal_code', label: 'Postal Code', type: 'text' },
    { key: 'website', label: 'Website', type: 'url' },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">School Profile</CardTitle>
          <div className="flex gap-2">
            {editing && (
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              ) : (
                'Edit Profile'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <Label className="text-sm font-medium mb-2 block">School Logo</Label>
            <div className="relative group">
              {logoPreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image 
                    src={logoPreview} 
                    alt="School Logo" 
                    fill
                    className="object-contain bg-white"
                  />
                  {editing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-white p-2 hover:bg-white/20 rounded-full"
                      >
                        <Upload className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className={`w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors ${editing ? 'bg-gray-50' : 'bg-gray-100'}`}
                  onClick={() => editing && fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Upload Logo</span>
                </div>
              )}
              
              {/* Remove button */}
              {editing && logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleLogoSelect}
              className="hidden"
              disabled={!editing}
            />
            
            {editing && (
              <p className="text-xs text-muted-foreground mt-2">
                Max 5MB. JPEG, PNG, WebP, GIF
              </p>
            )}
          </div>

          {/* School Info Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableFields.map((field) => (
              <div key={field.key} className={field.key === 'address' ? 'md:col-span-2' : ''}>
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {editing ? (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={school[field.key as keyof School] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    required={field.required}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {school[field.key as keyof School] || 'N/A'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Display (Read-only) */}
        {!editing && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                school.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {school.status?.charAt(0).toUpperCase() + school.status?.slice(1) || 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Loading overlay when uploading */}
        {uploadingLogo && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Uploading logo...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

