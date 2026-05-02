import { useMemo, useState } from 'react'
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
  const [selectedProfile, setSelectedProfile] = useState(null)
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

  const handleConversationSelect = (conversationId) => {
    // Future: load a conversation by ID
    console.log('Selected conversation', conversationId)
  }

  const handleNewChat = () => {
    clearMessages()
    setSelectedProfile(null)
  }

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile)
  }

  const handleCloseProfile = () => {
    setSelectedProfile(null)
  }

  return (
    <DashboardLayout>
      <div className="grid gap-6 xl:grid-cols-[320px_1.7fr_380px]">
        <ChatHistory
          conversations={chatHistory}
          onSelect={handleConversationSelect}
          onNewChat={handleNewChat}
        />

        <ChatWindow
          messages={recentMessages}
          isLoading={isLoading}
          onSend={handleSend}
          onPromptSelect={handlePromptSelect}
          onClear={handleNewChat}
        />

        <ProfilePanel profiles={profiles} onView={handleViewProfile} onSave={toggleProfileSave} />
      </div>

      {error && (
        <div className="mt-6 rounded-3xl border border-error bg-[#2B1010] p-4 text-sm text-error">
          {error}
        </div>
      )}

      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">{selectedProfile.name}</h2>
                <p className="text-text-secondary">{selectedProfile.currentRole} at {selectedProfile.currentCompany}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseProfile}
                className="rounded-2xl border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-5 rounded-3xl bg-bg-primary p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-text-muted">About</p>
                  <p className="mt-3 text-text-secondary">{selectedProfile.currentRole} with {selectedProfile.experienceYears} years experience in {selectedProfile.location}.</p>
                </div>
                <div className="rounded-3xl bg-bg-primary p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedProfile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-primary">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-border bg-bg-primary p-5">
                <div>
                  <p className="text-sm text-text-muted">Location</p>
                  <p className="mt-2 text-text-primary">{selectedProfile.location}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Connections</p>
                  <p className="mt-2 text-text-primary">{selectedProfile.connections}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Open to work</p>
                  <p className="mt-2 text-text-primary">{selectedProfile.openToWork ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Chat
