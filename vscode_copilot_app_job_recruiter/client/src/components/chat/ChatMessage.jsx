import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ProfileGrid from '../results/ProfileGrid'

function ChatMessage({ message }) {
  const isUser = message.type === 'user' || message.sender === 'user'
  const content = message.content || message.text
  const bubbleClass = isUser
    ? 'ml-auto rounded-3xl rounded-tr-sm bg-gradient-to-br from-primary to-secondary text-white'
    : 'rounded-3xl rounded-tl-sm bg-bg-card text-text-primary border border-border'

  const markdownComponents = {
    p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
    strong: ({ node, ...props }) => <strong {...props} className="font-semibold" />,
    em: ({ node, ...props }) => <em {...props} className="italic" />,
    code: ({ node, ...props }) => <code {...props} className="bg-bg-secondary rounded px-1 py-0.5 text-sm" />,
    ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside mb-2" />,
    ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside mb-2" />,
    li: ({ node, ...props }) => <li {...props} className="mb-1" />,
  }

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[92%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`p-5 ${bubbleClass} shadow-sm`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>

          {message.profiles?.length > 0 && (
            <div className="mt-4">
              <ProfileGrid profiles={message.profiles} />
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-text-muted">{message.timestamp || message.time || 'Now'}</div>
      </div>
    </div>
  )
}

export default ChatMessage
