/**
 * ChatbotWidget.jsx — Stitch "NEED Mitra" Civic Cooperative AI Assistant.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Loader2,
  Send,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { getServices, sendChatMessage } from '../services/api'
import BookingModal from './BookingModal'

const INITIAL_PROMPTS = [
  'Need an Electrician for wiring',
  'How does the 85/10 split work?',
  'Emergency water pipe leak!',
  'How to verify worker identity?',
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [allServices, setAllServices] = useState([])
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! 🙏 I am **NEED Mitra**, your Cooperative Federation AI Assistant. How can I assist you with verified services, fair 85/10 splits, or emergency rush dispatch today?',
      quick_actions: [
        { label: 'Book Electrician', action: 'book', service_id: 1 },
        { label: 'Co-op Model Split', link: '/about' },
        { label: 'Support Desk', link: '/support' },
      ],
    },
  ])

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const [bookingModal, setBookingModal] = useState({ isOpen: false, serviceId: null })

  useEffect(() => {
    getServices().then(setAllServices).catch(() => {})
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSend(textToSend) {
    const query = (textToSend || input).trim()
    if (!query || sending) return

    const userMsg = { sender: 'user', text: query }
    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setSending(true)

    try {
      const res = await sendChatMessage(query)
      const botMsg = {
        sender: 'bot',
        text: res.reply || 'I am here to assist you!',
        quick_actions: res.quick_actions || [],
        suggested_services: res.suggested_services || [],
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Apologies, I encountered a temporary connection issue. Please try again or visit our Help Center.',
          quick_actions: [{ label: 'Go to Help Center', link: '/support' }],
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleActionClick(action) {
    if (action.action === 'book' && action.service_id) {
      setBookingModal({ isOpen: true, serviceId: action.service_id })
    } else if (action.link) {
      setIsOpen(false)
      navigate(action.link)
    }
  }

  const activeBookingService =
    allServices.find((s) => s.id === bookingModal.serviceId) ||
    (bookingModal.serviceId ? { id: bookingModal.serviceId } : null)

  return (
    <>
      {/* Floating Trigger Button (Stitch Civic Design) */}
      {!isOpen && (
        <aside className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="h-14 pl-4 pr-6 rounded-full bg-primary hover:bg-primary-container text-on-primary shadow-[0_6px_24px_rgba(0,122,85,0.35)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer border border-primary-fixed/20"
            type="button"
            aria-label="Open NEED Mitra AI Assistant"
          >
            <span className="w-3 h-3 rounded-full bg-secondary-container animate-pulse shrink-0" />
            <span className="material-symbols-outlined text-[24px]">support_agent</span>
            <span className="font-label-lg text-sm sm:text-base font-bold tracking-tight">NEED Mitra AI</span>
          </button>
        </aside>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-[380px] h-[550px] max-h-[85vh] bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/60 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-inverse-surface text-inverse-on-surface p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-md">
                <span className="material-symbols-outlined text-[20px]">diversity_3</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-sm sm:text-base font-bold text-inverse-on-surface">NEED Mitra</span>
                  <span className="bg-primary/30 text-primary-fixed text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                    AI Civic
                  </span>
                </div>
                <p className="text-[11px] text-inverse-on-surface/70 leading-none mt-1">
                  Multi-State Co-op Assistant • Active
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-1.5 rounded-xl hover:bg-white/10 transition"
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Prompt Chips */}
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {INITIAL_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition shadow-xs flex-shrink-0 border border-outline-variant/40"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface-container-low/30 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className={`space-y-2 max-w-[85%] ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-lowest text-on-surface rounded-tl-none border border-outline-variant/40'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>

                  {/* Quick Actions */}
                  {m.quick_actions && m.quick_actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.quick_actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act)}
                          className="rounded-xl bg-surface-container-lowest border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-on-primary transition shadow-xs"
                        >
                          {act.label} →
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested Services */}
                  {m.suggested_services && m.suggested_services.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {m.suggested_services.map((svc) => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-xs"
                        >
                          <div>
                            <span className="font-bold text-on-surface block text-sm">{svc.name}</span>
                            <span className="text-xs text-on-surface-variant font-mono">
                              from ₹{svc.starting_price}
                            </span>
                          </div>
                          <button
                            onClick={() => setBookingModal({ isOpen: true, serviceId: svc.id })}
                            className="bg-primary hover:bg-primary-container text-on-primary px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Book
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm italic">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>NEED Mitra is typing…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-surface-container-lowest border-t border-outline-variant/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about repairs, fair splits, emergency help..."
              className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition disabled:opacity-40 shadow-sm"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Booking Modal Integration */}
      {bookingModal.isOpen && (
        <BookingModal
          isOpen={bookingModal.isOpen}
          onClose={() => setBookingModal({ isOpen: false, serviceId: null })}
          service={activeBookingService}
          allServices={allServices}
        />
      )}
    </>
  )
}
