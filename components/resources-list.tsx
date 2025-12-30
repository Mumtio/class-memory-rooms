import { ExternalLink, ImageIcon } from "lucide-react"

interface Resource {
  title: string
  url: string
  why: string
}

interface ResourcesListProps {
  resources: Resource[]
  notePhotos: Array<{ alt: string }>
}

export function ResourcesList({ resources, notePhotos }: ResourcesListProps) {
  return (
    <div className="space-y-6">
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
                  <p className="text-sm text-muted mb-2">{new URL(resource.url).hostname}</p>
                  <p className="text-sm text-ink">{resource.why}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl font-bold text-ink mb-4">Best Student Note Photos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notePhotos.map((photo, index) => (
            <div
              key={index}
              className="paper-card p-4 flex flex-col items-center justify-center min-h-[200px] bg-muted/20"
            >
              <ImageIcon className="h-12 w-12 text-muted mb-3" />
              <p className="text-sm text-center text-muted">{photo.alt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
