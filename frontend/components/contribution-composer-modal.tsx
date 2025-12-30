"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ContributionType } from "@/lib/mock-data"
import { Upload } from "lucide-react"

interface ContributionComposerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    type: ContributionType
    title?: string
    content?: string
    link?: { url: string; title: string }
    anonymous: boolean
  }) => void
}

export function ContributionComposerModal({ open, onOpenChange, onSubmit }: ContributionComposerModalProps) {
  const [type, setType] = useState<ContributionType>("takeaway")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = () => {
    // Validation
    if (!type) {
      setError("Please select a contribution type")
      return
    }

    if (!content && !linkUrl) {
      setError("Please add content or a link")
      return
    }

    // Submit
    onSubmit({
      type,
      title: title || undefined,
      content: content || undefined,
      link: linkUrl ? { url: linkUrl, title: linkTitle || "Link" } : undefined,
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
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted">PNG, JPG up to 10MB</p>
            </div>
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
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Publish Contribution</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
