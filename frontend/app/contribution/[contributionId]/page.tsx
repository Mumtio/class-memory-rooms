"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContributionCard } from "@/components/contribution-card"
import type { Contribution } from "@/types/models"
import { ArrowLeft, Send, Loader2, ThumbsUp, MessageSquare } from "lucide-react"

interface Reply {
  id: string
  author: string
  content: string
  createdAt: string
  anonymous: boolean
  helpfulCount?: number
  parentId?: string
}

interface ContributionPageProps {
  params: Promise<{
    contributionId: string
  }>
}

export default function ContributionPage({ params }: ContributionPageProps) {
  const router = useRouter()
  const { user, isAuthenticated, isHydrated } = useAuth()
  const [contributionId, setContributionId] = useState<string | null>(null)
  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  // Resolve params
  useEffect(() => {
    params.then(p => setContributionId(p.contributionId))
  }, [params])

  // Check authentication
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  // Fetch contribution data
  useEffect(() => {
    if (!contributionId || !isAuthenticated) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch contribution details
        const response = await fetch(`/api/forum/posts/${contributionId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Contribution not found")
          } else {
            setError("Failed to load contribution")
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        
        // Map the post to contribution format
        const extendedData = data.post?.extendedData || {}
        let parsedContent = extendedData
        if (data.post?.body) {
          try {
            parsedContent = JSON.parse(data.post.body)
          } catch {
            parsedContent = { content: data.post.body }
          }
        }

        const mappedContribution: Contribution = {
          id: data.post.id,
          chapterId: data.post.threadId,
          type: extendedData.contributionType || extendedData.type || 'takeaway',
          title: parsedContent.title || extendedData.title,
          content: parsedContent.content || data.post.body,
          anonymous: parsedContent.anonymous || extendedData.anonymous || false,
          authorName: extendedData.authorName || data.author?.name || 'Unknown User',
          createdAt: data.post.createdAt,
          link: parsedContent.link,
          image: parsedContent.image || undefined,
          helpfulCount: data.post.helpfulCount || 0,
          replies: data.replies || [],
        }

        setContribution(mappedContribution)
      } catch (err) {
        console.error("Error loading contribution:", err)
        setError("Failed to load contribution")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [contributionId, isAuthenticated])

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !contribution || !user) return

    setSubmitting(true)
    try {
      // Determine which post we're replying to
      const targetPostId = replyingTo ? replyingTo.id : contributionId
      
      const response = await fetch(`/api/forum/posts/${targetPostId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          userId: user.id,
          authorName: user.name,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add reply to local state
        const newReply: Reply = {
          id: data.replyId || `reply-${Date.now()}`,
          author: user.name,
          content: replyContent,
          createdAt: 'Just now',
          anonymous: false,
          helpfulCount: 0,
          parentId: replyingTo ? replyingTo.id : undefined,
        }
        
        setContribution({
          ...contribution,
          replies: [...(contribution.replies || []), newReply],
        })
        setReplyContent("")
        setReplyingTo(null)
      }
    } catch (err) {
      console.error("Error submitting reply:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeReply = async (replyId: string) => {
    if (!user) return

    const isLiked = likedPosts.has(replyId)
    
    try {
      if (isLiked) {
        // Unlike
        await fetch(`/api/forum/posts/${replyId}/helpful?userId=${user.id}`, {
          method: 'DELETE',
        })
        setLikedPosts(prev => {
          const next = new Set(prev)
          next.delete(replyId)
          return next
        })
        // Update local count
        if (contribution) {
          setContribution({
            ...contribution,
            replies: contribution.replies?.map(r => 
              r.id === replyId ? { ...r, helpfulCount: Math.max(0, (r.helpfulCount || 0) - 1) } : r
            ),
          })
        }
      } else {
        // Like
        await fetch(`/api/forum/posts/${replyId}/helpful`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        setLikedPosts(prev => new Set(prev).add(replyId))
        // Update local count
        if (contribution) {
          setContribution({
            ...contribution,
            replies: contribution.replies?.map(r => 
              r.id === replyId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
            ),
          })
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err)
    }
  }

  const handleLikeContribution = async () => {
    if (!user || !contributionId || !contribution) return

    const isLiked = likedPosts.has(contributionId)
    
    try {
      if (isLiked) {
        await fetch(`/api/forum/posts/${contributionId}/helpful?userId=${user.id}`, {
          method: 'DELETE',
        })
        setLikedPosts(prev => {
          const next = new Set(prev)
          next.delete(contributionId)
          return next
        })
        setContribution({
          ...contribution,
          helpfulCount: Math.max(0, (contribution.helpfulCount || 0) - 1),
        })
      } else {
        await fetch(`/api/forum/posts/${contributionId}/helpful`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        setLikedPosts(prev => new Set(prev).add(contributionId))
        setContribution({
          ...contribution,
          helpfulCount: (contribution.helpfulCount || 0) + 1,
        })
      }
    } catch (err) {
      console.error("Error toggling like:", err)
    }
  }

  // Show loading while hydrating
  if (!isHydrated) {
    return null
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Show loading state
  if (loading || !contributionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted">Loading contribution...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-8 text-center max-w-md">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Error</h2>
          <p className="text-muted mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Show contribution not found
  if (!contribution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-8 text-center max-w-md">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Contribution Not Found</h2>
          <p className="text-muted mb-4">The contribution you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: "Chapter", href: `/chapter/${contribution.chapterId}` },
    { label: contribution.title || "Contribution", href: `/contribution/${contributionId}` },
  ]

  // Organize replies - separate direct replies from nested replies
  const directReplies = (contribution.replies || []).filter(r => !r.parentId || r.parentId === contributionId)
  const nestedReplies = (contribution.replies || []).filter(r => r.parentId && r.parentId !== contributionId)

  // Group nested replies by parent
  const repliesByParent: Record<string, Reply[]> = {}
  nestedReplies.forEach(reply => {
    if (reply.parentId) {
      if (!repliesByParent[reply.parentId]) {
        repliesByParent[reply.parentId] = []
      }
      repliesByParent[reply.parentId].push(reply)
    }
  })

  const renderReply = (reply: Reply, isNested = false) => (
    <div key={reply.id} className={`paper-card p-4 ${isNested ? 'ml-8 border-l-2 border-primary/20' : ''}`}>
      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="font-medium text-ink">
          {reply.anonymous ? "Anonymous Student" : reply.author}
        </span>
        <span className="text-muted">•</span>
        <span className="text-muted">{reply.createdAt}</span>
      </div>
      <p className="text-ink leading-relaxed mb-3">{reply.content}</p>
      
      {/* Reply actions */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => handleLikeReply(reply.id)}
          className={`flex items-center gap-1 transition-colors ${
            likedPosts.has(reply.id) ? 'text-primary' : 'text-muted hover:text-ink'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{reply.helpfulCount || 0}</span>
        </button>
        <button
          onClick={() => setReplyingTo(reply)}
          className="flex items-center gap-1 text-muted hover:text-ink transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Reply</span>
        </button>
      </div>

      {/* Nested replies */}
      {repliesByParent[reply.id] && repliesByParent[reply.id].length > 0 && (
        <div className="mt-4 space-y-3">
          {repliesByParent[reply.id].map(nestedReply => renderReply(nestedReply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chapter
          </Button>
        </div>

        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 max-w-3xl mx-auto">
          {/* Main contribution */}
          <ContributionCard 
            contribution={contribution} 
            clickable={false}
            onHelpful={handleLikeContribution}
          />

          {/* Reply section */}
          <div className="mt-8">
            <h2 className="font-serif text-xl font-bold text-ink mb-4">
              Discussion ({contribution.replies?.length || 0} replies)
            </h2>

            {/* Reply input */}
            <div className="paper-card p-4 mb-6">
              {replyingTo && (
                <div className="mb-3 p-2 bg-muted/20 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted">
                    Replying to <span className="font-medium text-ink">{replyingTo.author}</span>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-sm text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <Textarea
                placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : "Write a reply..."}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="mb-3 resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitReply} 
                  disabled={!replyContent.trim() || submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Post Reply
                </Button>
              </div>
            </div>

            {/* Replies list */}
            {directReplies.length > 0 ? (
              <div className="space-y-4">
                {directReplies.map(reply => renderReply(reply))}
              </div>
            ) : (
              <div className="paper-card p-8 text-center">
                <p className="text-muted">No replies yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
