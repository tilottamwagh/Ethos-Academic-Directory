import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { Tenant } from './TenantTable'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
}

interface ChatBotProps {
  tenants: Tenant[]
}

/* ------------------------------------------------------------------ */
/*  Simple in-memory QA engine (no external API needed)              */
/* ------------------------------------------------------------------ */

function buildQaEngine(tenants: Tenant[]) {
  const total = tenants.length
  const clients = tenants.filter(t => t.account_type?.toLowerCase().includes('client'))

  // Filter out null/undefined values to satisfy TypeScript strictness
  const erpTypes: string[] = [...new Set(tenants.map(t => t.erp_type).filter((v): v is string => !!v))].sort()
  const deploymentTypes: string[] = [...new Set(tenants.map(t => t.deployment_type).filter((v): v is string => !!v))].sort()
  const regions: string[] = [...new Set(tenants.map(t => t.region).filter((v): v is string => !!v))].sort()
  const accountTypes: string[] = [...new Set(tenants.map(t => t.account_type).filter((v): v is string => !!v))].sort()

  const erpCounts: Record<string, number> = {}
  for (const t of tenants) {
    const key = t.erp_type || 'None'
    erpCounts[key] = (erpCounts[key] || 0) + 1
  }

  const regionCounts: Record<string, number> = {}
  for (const t of tenants) {
    const key = t.region || 'Unknown'
    regionCounts[key] = (regionCounts[key] || 0) + 1
  }

  const deploymentCounts: Record<string, number> = {}
  for (const t of tenants) {
    const key = t.deployment_type || 'Unknown'
    deploymentCounts[key] = (deploymentCounts[key] || 0) + 1
  }

  function findTenant(query: string): Tenant[] {
    const q = query.toLowerCase().trim()
    return tenants.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.alias?.toLowerCase().includes(q) ||
      t.id?.toLowerCase().includes(q)
    )
  }

  function answer(question: string): string {
    const q = question.toLowerCase().trim()

    // --- Greetings ---
    if (/^(hi|hello|hey|good morning|good evening|greetings|howdy)\b/.test(q)) {
      return "Hello! I'm the Ethos Assistant. I can answer questions about the tenant directory — try asking about total tenants, regions, ERPs, deployments, or search for a specific tenant."
    }

    // --- Help ---
    if (/\b(help|what can you do|commands|guide)\b/.test(q)) {
      return [
        "Here's what I can help with:",
        '',
        '\u2022 "How many tenants?" — total count',
        '\u2022 "List all tenants" — show all names',
        '\u2022 "Tenants in [region]" — filter by region',
        '\u2022 "SaaS tenants" / "Client tenants"',
        '\u2022 "ERP types" / "How many Banner?"',
        '\u2022 "Search [name]" — find a tenant',
        '\u2022 "Show [tenant name]" — details',
        '\u2022 "Region distribution"',
        '',
        'Try speaking or typing a question!',
      ].join('\n')
    }

    // --- Total / count ---
    if (/\bhow many\b.*\b(tenant|client|account|record)s?\b/.test(q) || /\btotal\b.*\b(tenant|client|account|record)s?\b/.test(q)) {
      if (q.includes('client')) {
        return `There are **${clients.length}** client tenants out of **${total}** total tenants.`
      }
      return `There are **${total}** tenants in the directory.`
    }

    // --- List all tenants ---
    if (/^(list|show|display)\b.*\b(all|every)\b.*\b(tenant|name|client)/.test(q) || /\blist all tenants\b/.test(q)) {
      const names = tenants.map(t => `\u2022 ${t.name || t.id}`).slice(0, 50).join('\n')
      return `Here are the tenants${tenants.length > 50 ? ` (showing first 50 of ${tenants.length})` : ''}:\n\n${names}`
    }

    // --- Clients ---
    if (/\bhow many clients\b/.test(q) || /\bclient count\b/.test(q)) {
      return `There are **${clients.length}** client tenants.`
    }

    // --- Region questions ---
    if (/\b(region|regions|territor(y|ies))\b/.test(q)) {
      // Specific region query
      for (const region of regions) {
        const rl = region.toLowerCase()
        if (q.includes(rl)) {
          const count = regionCounts[region] || 0
          return `There are **${count}** tenants in **${region}**.`
        }
      }
      // Region distribution
      if (/\b(distribution|breakdown|list)\b/.test(q) || q.includes('distribution') || q.includes('how many regions')) {
        const lines = regions.map(r => `\u2022 **${r}**: ${regionCounts[r] || 0}`)
        return `**Region distribution:**\n${lines.join('\n')}`
      }
    }

    // --- ERP questions ---
    if (/\b(erp|erps? type|enterprise resource)\b/.test(q)) {
      // Specific ERP count
      for (const erp of erpTypes) {
        const el = erp.toLowerCase()
        if (q.includes(el) && /\bhow many\b/.test(q)) {
          const count = erpCounts[erp] || 0
          return `There are **${count}** tenants using **${erp}**.`
        }
      }
      // ERP breakdown
      if (/\b(distribution|breakdown|list|types|different)\b/.test(q) || q.includes('what erps')) {
        const lines = erpTypes.map(e => `\u2022 **${e}**: ${erpCounts[e] || 0}`)
        return `**ERP distribution:**\n${lines.join('\n')}`
      }
      // Default ERP info
      return `The following ERP types are used: ${erpTypes.join(', ')}.`
    }

    // --- Specific ERP value (e.g. "how many Banner") ---
    for (const erp of erpTypes) {
      const el = erp.toLowerCase()
      if (q.includes(el)) {
        const count = erpCounts[erp] || 0
        return `There are **${count}** tenants using **${erp}**.`
      }
    }

    // --- Deployment questions ---
    if (/\b(deployment|deploy|saas|on.?prem|cloud|hosted)\b/.test(q)) {
      for (const dep of deploymentTypes) {
        const dl = dep.toLowerCase()
        if (q.includes(dl)) {
          const count = deploymentCounts[dep] || 0
          return `There are **${count}** tenants with **${dep}** deployment.`
        }
      }
      if (/\b(distribution|breakdown|list|types)\b/.test(q)) {
        const lines = deploymentTypes.map(d => `\u2022 **${d}**: ${deploymentCounts[d] || 0}`)
        return `**Deployment distribution:**\n${lines.join('\n')}`
      }
    }

    // --- Account type questions ---
    if (/\b(account type|classification|account_type)\b/.test(q)) {
      const lines = accountTypes.map(a => {
        const count = tenants.filter(t => t.account_type === a).length
        return `\u2022 **${a}**: ${count}`
      })
      return `**Account classification breakdown:**\n${lines.join('\n')}`
    }

    // --- Search by name ---
    if (/\b(show|search|find|lookup|get|tell me about|details? of|info on)\b/.test(q)) {
      const searchTerms = ['show', 'search', 'find', 'lookup', 'get', 'tell me about', 'details of', 'details on', 'info on', 'info about']
      let searchQuery = q
      for (const term of searchTerms) {
        searchQuery = searchQuery.replace(term, '').trim()
      }
      searchQuery = searchQuery.replace(/^about\s+/, '').replace(/^me\s+/, '').trim()

      if (searchQuery) {
        const results = findTenant(searchQuery)
        if (results.length === 0) {
          return `I could not find any tenant matching "${searchQuery}". Try a different name or alias.`
        }
        if (results.length === 1) {
          const t = results[0]
          return [
            `**${t.name || 'Unnamed'}**`,
            `\u2022 **ID**: ${t.id}`,
            `\u2022 **Alias**: ${t.alias || '\u2014'}`,
            `\u2022 **Region**: ${t.region || '\u2014'}`,
            `\u2022 **ERP**: ${t.erp_type || '\u2014'}`,
            `\u2022 **Deployment**: ${t.deployment_type || '\u2014'}`,
            `\u2022 **Classification**: ${t.account_type || '\u2014'}`,
            `\u2022 **Account ID**: ${t.accountId || '\u2014'}`,
          ].join('\n')
        }
        const list = results.map(t => `\u2022 ${t.name || t.id} (${t.region || '?'})`).join('\n')
        return `Found **${results.length}** matching tenants:\n${list}`
      }
    }

    // --- Fallback ---
    return [
      "I'm not sure how to answer that. Try asking about:",
      '\u2022 Total tenants / clients',
      '\u2022 Tenants in a specific region',
      '\u2022 ERP or deployment types',
      '\u2022 Searching for a specific tenant name',
      '',
      'Or type **"help"** to see all commands.',
    ].join('\n')
  }

  return { answer }
}

/* ------------------------------------------------------------------ */
/*  ChatBot Component                                                 */
/* ------------------------------------------------------------------ */

export function ChatBot({ tenants }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: "👋 Hi! I'm the **Ethos Assistant**. I can answer questions about the tenant directory. Try typing or speaking a question like \"How many tenants?\" or \"Show me tenants in North America\".",
    },
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const qaEngine = useMemo(() => buildQaEngine(tenants), [tenants])

  /* ---- Text-to-Speech (female voice) ---- */
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    // Strip markdown bold markers for cleaner speech
    const clean = text.replace(/\*\*(.+?)\*\*/g, '$1')

    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'en-US'
    utterance.rate = 0.95
    utterance.pitch = 1.2

    // Find a female voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      /female|woman|girl/i.test(v.name) || /(zira|samantha|karen|moira|tessa|veena|lekha)/i.test(v.name)
    ) || voices.find(v => /english/i.test(v.lang) && /female/i.test(v.name))
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const addMessage = (role: 'user' | 'bot', text: string) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setMessages(prev => [...prev, { id, role, text }])
  }

  const handleSend = (text: string, fromVoice = false) => {
    const trimmed = text.trim()
    if (!trimmed) return

    addMessage('user', trimmed)
    setInput('')
    setIsProcessing(true)

    // Simulate brief processing delay for natural feel
    setTimeout(() => {
      const reply = qaEngine.answer(trimmed)
      addMessage('bot', reply)
      setIsProcessing(false)
      // Speak the reply aloud if triggered by voice input
      if (fromVoice) {
        speakText(reply)
      }
    }, 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  /* ---- Voice Input ---- */
  const toggleListening = () => {
    if (isListening) {
      stopListening()
      return
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      addMessage('bot', 'Voice input is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
      // Auto-send after a brief moment so user can see the transcript
      // Mark as voice-triggered so the bot speaks the reply aloud
      setTimeout(() => handleSend(transcript, true), 200)
    }

    recognition.onerror = () => {
      setIsListening(false)
      addMessage('bot', 'Sorry, I could not hear you. Please try again or type your question.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  /* ---- Render helpers ---- */
  const formatBotMessage = (text: string) => {
    // Convert **bold** to <strong>
    return text
      .split('\n')
      .map((line, i) => {
        const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        return i === 0 ? html : `<br/>${html}`
      })
      .join('')
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'chatbot-toggle--active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="Open Ethos Assistant"
      >
        {isOpen ? '\u2715' : '\uD83D\uDCAC'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="chatbot-panel animate-fade-in">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">{'\uD83E\uDD16'}</span>
              <div>
                <div className="chatbot-header-title">Ethos Assistant</div>
                <div className="chatbot-header-status">
                  {isSpeaking ? '\uD83D\uDD0A Speaking...' : 'Online'}
                  &nbsp;&bull;&nbsp;{tenants.length} tenants indexed
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              {isSpeaking && (
                <button className="chatbot-tts-btn" onClick={stopSpeaking} title="Stop speaking">
                  {'\u23F9'}
                </button>
              )}
              <button className="chatbot-close-btn" onClick={() => { stopSpeaking(); setIsOpen(false); }} title="Close">
                {'\u2715'}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                {msg.role === 'bot' && <span className="chatbot-msg-avatar">{'\uD83E\uDD16'}</span>}
                <div
                  className="chatbot-msg-bubble"
                  dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }}
                />
                {msg.role === 'user' && <span className="chatbot-msg-avatar">{'\uD83D\uDC64'}</span>}
              </div>
            ))}

            {isProcessing && (
              <div className="chatbot-msg chatbot-msg--bot">
                <span className="chatbot-msg-avatar">{'\uD83E\uDD16'}</span>
                <div className="chatbot-msg-bubble chatbot-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="chatbot-input-bar">
            <button
              className={`chatbot-voice-btn ${isListening ? 'chatbot-voice-btn--active' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? '\u23F9' : '\uD83C\uDFA4'}
            </button>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={isListening ? 'Listening...' : 'Ask a question...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isListening}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isProcessing}
              title="Send"
            >
              {'\u27A4'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}