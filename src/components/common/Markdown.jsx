import ReactMarkdown from 'react-markdown';

/**
 * @param {{ content: string, className?: string }} props
 */
export default function Markdown({ content, className = '' }) {
  if (!content) return null;
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1
              className="type-display-sm mt-5 mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="type-card-title mt-5 mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="type-body-emphasis mt-4 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal pl-6">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong>{children}</strong>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--apple-link)' }}
              className="hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
