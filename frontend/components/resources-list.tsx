import { ExternalLink, ImageIcon, LinkIcon } from "lucide-react"

interface Resource {
  title: string
  url: string
  why: string
}

interface ResourcesListProps {
  resources: Resource[]
  notePhotos: Array<{ alt: string; url?: string }>
}

export function ResourcesList({ resources, notePhotos }: ResourcesListProps) {
  const hasResources = resources && resources.length > 0
  const hasPhotos = notePhotos && notePhotos.length > 0

  if (!hasResources && !hasPhotos) {
    return (
      <div className="paper-card p-8 text-center">
        <LinkIcon className="h-12 w-12 text-muted mx-auto mb-3" />
        <p className="text-muted">No resources or note photos available yet.</p>
        <p className="text-sm text-muted mt-2">Resources will appear here once AI generates unified notes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasResources && (
        <div>
          <h3 className="font-serif text-xl font-bold text-ink mb-4">Online Resources</h3>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block paper-card p-5 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-ink mb-1 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-muted mb-2">
                      {(() => {
                        try {
                          return new URL(resource.url).hostname
                        } catch {
                          return resource.url
                        }
                      })()}
                    </p>
                    <p className="text-sm text-ink">{resource.why}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {hasPhotos && (
        <div>
          <h3 className="font-serif text-xl font-bold text-ink mb-4">Best Student Note Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notePhotos.map((photo, index) => (
              <div
                key={index}
                className="paper-card p-4 flex flex-col items-center justify-center min-h-[200px] bg-muted/20 overflow-hidden"
              >
                {photo.url ? (
                  <img 
                    src={photo.url} 
                    alt={photo.alt} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-muted mb-3" />
                    <p className="text-sm text-center text-muted">{photo.alt}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
