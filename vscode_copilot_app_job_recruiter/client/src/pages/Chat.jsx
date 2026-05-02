import { useMemo } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ChatWindow from '../components/chat/ChatWindow'
import ChatHistory from '../components/chat/ChatHistory'
import ProfilePanel from '../components/results/ProfilePanel'
import useChatStore from '../store/chatStore'

const chatHistory = [
  { id: 'conv-1', title: 'Senior Designers', lastMessage: 'Looking for 3+ yr designers in Berlin' },
  { id: 'conv-2', title: 'React Engineers', lastMessage: 'Search React devs in Dubai' },
  { id: 'conv-3', title: 'Marketing Leads', lastMessage: 'Find marketing managers in London' },
]

function Chat() {
  const messages = useChatStore((state) => state.messages)
  const profiles = useChatStore((state) => state.profiles)
  const isLoading = useChatStore((state) => state.isLoading)
  const error = useChatStore((state) => state.error)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const clearMessages = useChatStore((state) => state.clearMessages)
  const toggleProfileSave = useChatStore((state) => state.toggleProfileSave)

  const recentMessages = useMemo(() => messages.slice(-10), [messages])

  const handleSend = async (text) => {
    await sendMessage(text)
  }

  const handlePromptSelect = (prompt) => {
    handleSend(prompt)
  }

  const handleConversationSelect = () => {
    // Placeholder for loading saved conversation
  }

  const handleViewProfile = () => {
    // Placeholder for profile modal
  }

  return (
    <DashboardLayout>
      <div className="grid gap-6 xl:grid-cols-[320px_1.7fr_380px]">
        <ChatHistory conversations={chatHistory} onSelect={handleConversationSelect} />

        <ChatWindow
          messages={recentMessages}
          isLoading={isLoading}
          onSend={handleSend}
          onPromptSelect={handlePromptSelect}
          onClear={clearMessages}
        />

        <ProfilePanel profiles={profiles} onView={handleViewProfile} onSave={toggleProfileSave} />
      </div>
      {error && (
        <div className="mt-6 rounded-3xl border border-error bg-[#2B1010] p-4 text-sm text-error">
          {error}
        </div>
      )}
    </DashboardLayout>
  )
}

export default Chat
