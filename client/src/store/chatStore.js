import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultAssistantMessage = {
  id: 'assistant-welcome',
  content: 'Hi there! Tell me who you want to hire and I’ll search LinkedIn for top candidates.',
  type: 'assistant',
  status: 'received',
  timestamp: new Date().toISOString(),
}

const useChatStore = create(
  persist(
    (set, get) => ({
      // State
      messages: [defaultAssistantMessage],
      profiles: [],
      isTyping: false,
      isLoading: false,
      error: null,
      currentConversation: null,

      // Actions
      addMessage: (message) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: Date.now().toString(),
              ...message,
              timestamp: new Date().toISOString(),
            },
          ],
        }))
      },

      updateMessage: (messageId, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        }))
      },

      setProfiles: (profiles) => {
        set({ profiles })
      },

      toggleProfileSave: (profileId) => {
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === profileId ? { ...profile, saved: !profile.saved } : profile
          ),
        }))
      },

      clearMessages: () => {
        set({ messages: [defaultAssistantMessage], profiles: [], error: null })
      },

      setTyping: (typing) => {
        set({ isTyping: typing })
      },

      sendMessage: async (content, type = 'user') => {
        const messageId = Date.now().toString()

        get().addMessage({
          id: messageId,
          content,
          type,
          status: 'sent',
        })

        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: content }),
          })

          if (!response.ok) {
            const errorResponse = await response.json().catch(() => null)
            throw new Error(errorResponse?.error || 'Failed to send message')
          }

          const result = await response.json()

          get().addMessage({
            content: result.response,
            type: 'assistant',
            status: 'received',
          })

          get().setProfiles(Array.isArray(result.profiles) ? result.profiles : [])
          set({ isLoading: false })
        } catch (error) {
          get().updateMessage(messageId, { status: 'error' })
          set({
            error: error.message,
            isLoading: false,
          })
        }
      },

      retryMessage: async (messageId) => {
        const message = get().messages.find((msg) => msg.id === messageId)
        if (!message || message.type !== 'user') return

        get().updateMessage(messageId, { status: 'sending' })
        await get().sendMessage(message.content, message.type)
      },

      setCurrentConversation: (conversationId) => {
        set({ currentConversation: conversationId })
      },

      clearError: () => {
        set({ error: null })
      },

      // Getters
      getMessages: () => get().messages,
      getLastMessage: () => get().messages[get().messages.length - 1],
      getMessageCount: () => get().messages.length,
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50),
        currentConversation: state.currentConversation,
      }),
    }
  )
)

export default useChatStore