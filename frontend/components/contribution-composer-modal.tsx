"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ContributionType } from "@/types/models"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-store"

interface ContributionComposerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: string
  schoolId?: string
  onSubmit: (data: {
    type: ContributionType
    title?: string
    content?: string
    link?: { url: string; title: string }
    image?: { url: string; alt: string }
    anonymous: boolean
  }) => void
}

// Upload image to Vercel Blob Storage
async function uploadImage(file: File): Promise<{ url: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { url: '', error: errorData.error || 'Upload failed' };
    }

    const data = await response.json();
    return { url: data.url };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: 'Failed to upload image' };
  }
}

export function ContributionComposerModal({ 
  open, 
  onOpenChange, 
  chapterId,
  schoolId,
  onSubmit 
}: ContributionComposerModalProps) {
  const { user } = useAuth()
  const [type, setType] = useState<ContributionType>("takeaway")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState("")
  
  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError('')
    setUploading(true)

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setImagePreview(localPreview)

    try {
      // Upload to Vercel Blob Storage
      const result = await uploadImage(file)
      
      if (result.error) {
        setError(result.error)
        setImagePreview(null)
        setImageUrl(null)
      } else {
        setImageUrl(result.url)
      }
    } catch (err) {
      setError('Failed to upload image')
      setImagePreview(null)
      setImageUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    // Validation
    if (!type) {
      setError("Please select a contribution type")
      return
    }

    if (!content && !linkUrl && !imageUrl) {
      setError("Please add content, a link, or an image")
      return
    }

    if (uploading) {
      setError("Please wait for image upload to complete")
      return
    }

    // Submit
    onSubmit({
      type,
      title: title || undefined,
      content: content || undefined,
      link: linkUrl ? { url: linkUrl, title: linkTitle || "Link" } : undefined,
      image: imageUrl ? { url: imageUrl, alt: title || "Uploaded image" } : undefined,
      anonymous,
    })

    // Reset
    setType("takeaway")
    setTitle("")
    setContent("")
    setLinkUrl("")
    setLinkTitle("")
    setAnonymous(false)
    setError("")
    setImagePreview(null)
    setImageUrl(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add Contribution</DialogTitle>
          <DialogDescription>Share your notes, resources, or questions with your classmates.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label htmlFor="type">Contribution Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as ContributionType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="takeaway">Takeaway - Key concept or insight</SelectItem>
                <SelectItem value="notes_photo">Notes Photo - Picture of your notes</SelectItem>
                <SelectItem value="resource">Resource - Helpful link or material</SelectItem>
                <SelectItem value="solved_example">Solved Example - Problem solution</SelectItem>
                <SelectItem value="confusion">Confusion - Question or unclear topic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Give your contribution a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your notes, explanation, or question..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Link inputs */}
          <div className="space-y-3 p-4 border-2 border-border rounded-lg bg-background/50">
            <h4 className="font-semibold text-sm text-ink">Add a Link (optional)</h4>
            <div className="space-y-2">
              <Label htmlFor="linkUrl" className="text-xs">
                URL
              </Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkTitle" className="text-xs">
                Link Title
              </Label>
              <Input
                id="linkTitle"
                placeholder="e.g., Khan Academy Vector Tutorial"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Upload Image (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative border-2 border-border rounded-lg p-2">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Uploading...</p>
                    </div>
                  </div>
                )}
                {imageUrl && !uploading && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Uploaded
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted">PNG, JPG up to 5MB</p>
              </div>
            )}
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
            <div>
              <Label htmlFor="anonymous" className="cursor-pointer">
                Post Anonymously
              </Label>
              <p className="text-sm text-muted">Your name won't be shown to other students</p>
            </div>
            <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Publish Contribution'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
