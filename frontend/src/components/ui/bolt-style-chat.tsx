import React, { useState, useRef, useEffect } from 'react'
import {
  Plus, Lightbulb, Paperclip, Image, FileCode,
  ChevronDown, Check, Sparkles, Zap, Brain,
  SendHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// TYPES
interface Model {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  badge?: string
}

interface BoltChatProps {
  title?: string
  subtitle?: string
  placeholder?: string
  onSend?: (message: string) => void
  disabled?: boolean
  announcementText?: string
  announcementHref?: string
}

// MODELS - Bolt style with more options
const models: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable', icon: <Sparkles className="size-4 text-amber-500" /> },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & efficient', icon: <Zap className="size-4 text-blue-500" /> },
  { id: 'o1-preview', name: 'o1-preview', description: 'Advanced reasoning', icon: <Brain className="size-4 text-purple-500" /> }
]

// Ray Background - Blue theme
function RayBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-background" />

      {/* Soft blue radial gradient */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[3000px] h-[1200px]"
        style={{
          background: `radial-gradient(ellipse at center 400px, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 20%, rgba(59, 130, 246, 0.02) 35%, transparent 50%)`
        }}
      />

      {/* Decorative rings - blue */}
      <div
        className="absolute top-[100px] left-1/2 w-[800px] h-[800px] sm:top-1/2 sm:w-[1500px] sm:h-[1400px]"
        style={{ transform: 'translate(-50%) rotate(180deg)' }}
      >
        <div className="absolute w-full h-full rounded-full -mt-[8px]" style={{ background: 'radial-gradient(43.89% 25.74% at 50.02% 97.24%, hsl(var(--background)) 0%, hsl(var(--background)) 100%)', border: '12px solid hsl(var(--foreground))', transform: 'rotate(180deg)', zIndex: 5, opacity: 0.08 }} />
        <div className="absolute w-full h-full rounded-full bg-background -mt-[6px]" style={{ border: '18px solid #dbeafe', transform: 'rotate(180deg)', zIndex: 4, opacity: 0.5 }} />
        <div className="absolute w-full h-full rounded-full bg-background -mt-[4px]" style={{ border: '18px solid #bfdbfe', transform: 'rotate(180deg)', zIndex: 3, opacity: 0.4 }} />
        <div className="absolute w-full h-full rounded-full bg-background -mt-[2px]" style={{ border: '18px solid #93c5fd', transform: 'rotate(180deg)', zIndex: 2, opacity: 0.3 }} />
        <div className="absolute w-full h-full rounded-full bg-background" style={{ border: '16px solid #60a5fa', boxShadow: '0 -10px 30px rgba(59, 130, 246, 0.15)', transform: 'rotate(180deg)', zIndex: 1, opacity: 0.25 }} />
      </div>
    </div>
  )
}


// MODEL SELECTOR - Bolt style
function ModelSelector({ selectedModel = 'gpt-4o', onModelChange }: {
  selectedModel?: string
  onModelChange?: (model: Model) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(models.find(m => m.id === selectedModel) || models[0])

  const handleSelect = (model: Model) => {
    setSelected(model)
    setIsOpen(false)
    onModelChange?.(model)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-95"
      >
        {selected.icon}
        <span>{selected.name}</span>
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-1.5">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Model
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model)}
                    className={cn(
                      "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-150",
                      selected.id === model.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex-shrink-0">{model.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{model.name}</span>
                        {model.badge && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            model.badge === 'Pro' ? "bg-purple-500/20 text-purple-600" : "bg-blue-500/20 text-blue-600"
                          )}>
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{model.description}</span>
                    </div>
                    {selected.id === model.id && <Check className="size-4 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// CHAT INPUT - Bolt style light mode
function ChatInput({ onSend, placeholder = "What do you want to build?", disabled }: {
  onSend?: (message: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [message, setMessage] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    if (message.trim()) {
      onSend?.(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative w-full max-w-[680px] mx-auto">
      {/* Gradient border effect */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-foreground/10 to-transparent pointer-events-none" />

      <div className="relative rounded-2xl bg-card ring-1 ring-border shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_20px_rgba(0,0,0,0.1)]">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full resize-none bg-transparent text-[15px] text-foreground placeholder-muted-foreground px-5 pt-5 pb-3 focus:outline-none min-h-[80px] max-h-[200px]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ height: '80px' }}
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={disabled}
                className={cn(
                  "flex items-center justify-center size-8 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Plus className={cn("size-4 transition-transform duration-200", showAttachMenu && "rotate-45")} />
              </button>

              <AnimatePresence>
                {showAttachMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-2 z-50 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-1.5 min-w-[180px]">
                        {[
                          { icon: <Paperclip className="size-4" />, label: 'Upload file' },
                          { icon: <Image className="size-4" />, label: 'Add image' },
                          { icon: <FileCode className="size-4" />, label: 'Import code' }
                        ].map((item, i) => (
                          <button key={i} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150">
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <ModelSelector />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              disabled={disabled}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
            >
              <Lightbulb className="size-4" />
              <span>Plan</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <span className="hidden sm:inline">Build now</span>
              <SendHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// MAIN BOLT CHAT COMPONENT
export function BoltStyleChat({
  title = "Ask about your",
  subtitle = "Get AI insights on your invoices, expenses & vendors.",
  placeholder = "e.g., How much did I spend on ACME last month?",
  onSend,
  disabled,
  announcementText = "Introducing AI Assistant"
}: BoltChatProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] w-full overflow-hidden">
      {/* Ray Background */}
      <RayBackground />

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        {/* Title section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-1">
            {title}{' '}
            <span className="bg-gradient-to-b from-blue-400 via-blue-500 to-foreground bg-clip-text text-transparent italic">
              invoices
            </span>
            ?
          </h1>
          <p className="text-base font-medium sm:text-lg text-muted-foreground max-w-lg">{subtitle}</p>
        </div>

        {/* Chat input */}
        <div className="w-full max-w-[700px] mb-6 sm:mb-8 mt-2">
          <ChatInput placeholder={placeholder} onSend={onSend} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}

export default BoltStyleChat
