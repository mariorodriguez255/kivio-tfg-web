import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getInitials } from '@/lib/utils'
import { Send, MessageCircle, ArrowLeft, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'

// ── tipos ─────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string
  title: string | null
  participant: { id: string; full_name: string | null; avatar_url: string | null }
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
  listing_info: { id: string; title: string; city: string; monthly_rent: number } | null
}

interface Message {
  message_id: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  content: string
  is_read: boolean
  status: string
  created_at: string
  deleted_by_sender: boolean
}

interface RawMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  status: string
  deleted_by_sender: boolean
  created_at: string
}

// ── helpers ───────────────────────────────────────────────────────────────────
function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diffDays < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' })
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── item de la lista de conversaciones ───────────────────────────────────────
function ConvItem({
  conv, active, userId, onClick,
}: {
  conv: Conversation
  active: boolean
  userId: string
  onClick: () => void
}) {
  const isMe = conv.last_message_sender_id === userId
  const preview = conv.last_message_content
    ? (isMe ? `Tú: ${conv.last_message_content}` : conv.last_message_content)
    : 'Sin mensajes aún'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
        active && 'bg-accent',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conv.participant.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {getInitials(conv.participant.full_name)}
          </AvatarFallback>
        </Avatar>
        {conv.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-semibold' : 'font-medium')}>
            {conv.participant.full_name ?? 'Usuario'}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">{formatTime(conv.last_message_at)}</span>
        </div>
        <p className={cn(
          'text-xs truncate mt-0.5',
          conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}>
          {preview}
        </p>
        {conv.listing_info && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5 mt-0.5">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {conv.listing_info.title}
          </p>
        )}
      </div>
    </button>
  )
}

// ── burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  if (msg.deleted_by_sender) {
    return (
      <div className={cn('flex gap-2 mb-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        <div className="h-7 w-7 shrink-0" />
        <p className="text-xs text-muted-foreground italic px-3 py-1.5">Mensaje eliminado</p>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2 mb-1 items-end', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={msg.sender_avatar ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
            {getInitials(msg.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}
      {isOwn && <div className="h-7 w-7 shrink-0" />}

      <div className="max-w-[70%]">
        <div className={cn(
          'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm',
        )}>
          {msg.content}
        </div>
        <p className={cn(
          'text-xs text-muted-foreground mt-0.5 px-1',
          isOwn ? 'text-right' : 'text-left',
        )}>
          {formatMsgTime(msg.created_at)}
          {isOwn && <span className="ml-1 opacity-70">{(msg.status === 'delivered' || msg.status === 'read') ? '✓✓' : '✓'}</span>}
        </p>
      </div>
    </div>
  )
}

// ── estado vacío ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 border-l bg-muted/20">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-primary/50" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <span className="text-[10px]">💬</span>
        </div>
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="font-semibold">Tus mensajes</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Selecciona una conversación de la izquierda para empezar a chatear
        </p>
      </div>
    </div>
  )
}

// ── página principal ──────────────────────────────────────────────────────────
export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const seenIds = useRef(new Set<string>())
  // Ref estable para activeConv accesible desde closures de realtime
  const activeConvRef = useRef<Conversation | null>(null)

  const activeConv = conversations.find(c => c.id === conversationId) ?? null
  useEffect(() => { activeConvRef.current = activeConv }, [activeConv])

  // ── cargar conversaciones ─────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.rpc('chat_get_user_conversations', {
      p_user_id: user.id,
      p_limit: 50,
      p_offset: 0,
    })
    if (data) setConversations(data as Conversation[])
  }, [user])

  useEffect(() => {
    if (!user) return
    setLoadingConvs(true)
    fetchConversations().finally(() => setLoadingConvs(false))

    // Escuchar actualizaciones de conversaciones (nuevo mensaje de cualquier chat)
    const ch = supabase
      .channel('conversations-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { fetchConversations() })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user, fetchConversations])

  // ── cargar mensajes + realtime ────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([])
      return
    }

    setLoadingMsgs(true)
    seenIds.current.clear()

    supabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
      p_limit: 100,
    }).then(({ data }) => {
      if (data) {
        const msgs = data as Message[]
        msgs.forEach(m => seenIds.current.add(m.message_id))
        setMessages(msgs)
      }
      setLoadingMsgs(false)
    })

    // Marcar como leídos al abrir
    supabase.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    }).then(() => {
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
      )
    })

    // Suscripción realtime para mensajes nuevos y actualizaciones de estado (ticks)
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const raw = payload.new as RawMessage
          if (seenIds.current.has(raw.id)) return
          seenIds.current.add(raw.id)

          const isOwn = raw.sender_id === user.id
          const newMsg: Message = {
            message_id: raw.id,
            sender_id: raw.sender_id,
            sender_name: isOwn
              ? (profile?.full_name ?? 'Tú')
              : (activeConvRef.current?.participant.full_name ?? 'Usuario'),
            sender_avatar: isOwn
              ? (profile?.avatar_url ?? null)
              : (activeConvRef.current?.participant.avatar_url ?? null),
            content: raw.content,
            is_read: isOwn,
            status: raw.status ?? 'sent',
            created_at: raw.created_at,
            deleted_by_sender: raw.deleted_by_sender,
          }

          setMessages(prev => [...prev, newMsg])

          // Marcar como leído si el mensaje es del otro
          if (!isOwn) {
            supabase.rpc('mark_messages_as_read', {
              p_conversation_id: conversationId,
              p_user_id: user.id,
            }).then(() => {})
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const raw = payload.new as RawMessage
          // Actualizar status del mensaje (ej: 'sent' → 'read') para refrescar los ticks
          setMessages(prev =>
            prev.map(m => m.message_id === raw.id ? { ...m, status: raw.status } : m)
          )
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          toast.error('Se perdió la conexión del chat. Recarga la página si no recibes mensajes.')
        }
      })

    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id])

  // Auto-scroll al fondo solo si el usuario ya estaba cerca del final
  useEffect(() => {
    if (messages.length === 0) return
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    // Si está a menos de 150px del final (o es carga inicial), hace scroll
    if (distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus en el input al cambiar de conversación
  useEffect(() => {
    if (conversationId) inputRef.current?.focus()
  }, [conversationId])

  // ── enviar mensaje ────────────────────────────────────────────────────────
  async function sendMessage() {
    const content = input.trim()
    if (!content || !conversationId || !user || sending) return

    setInput('')
    setSending(true)

    const { data, error } = await supabase.rpc('chat_send_message', {
      p_conversation_id: conversationId,
      p_sender_id: user.id,
      p_content: content,
    })

    if (error || !data?.[0]) {
      setInput(content)
      setSending(false)
      toast.error('No se pudo enviar el mensaje. Inténtalo de nuevo.')
      return
    }

    const { message_id, created_at } = data[0] as { message_id: string; created_at: string }

    // Añadir al estado (el realtime lo ignorará por seenIds)
    if (!seenIds.current.has(message_id)) {
      seenIds.current.add(message_id)
      setMessages(prev => [...prev, {
        message_id,
        sender_id: user.id,
        sender_name: profile?.full_name ?? 'Tú',
        sender_avatar: profile?.avatar_url ?? null,
        content,
        is_read: false,
        status: 'sent',
        created_at,
        deleted_by_sender: false,
      }])
    }

    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    // -mx-6 -my-6 cancela el padding del AppLayout, h-[calc(100vh-3.5rem)] = viewport - header
    <div className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">

      {/* Lista de conversaciones */}
      <aside className={cn(
        'flex flex-col border-r bg-background',
        'w-full md:w-80 md:shrink-0',
        conversationId ? 'hidden md:flex' : 'flex',
      )}>
        <div className="shrink-0 border-b">
          <div className="h-14 flex items-center px-4">
            <h2 className="font-semibold">Mensajes</h2>
          </div>
          <div className="px-3 pb-3 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-px p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium">Sin conversaciones</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contacta con alguien desde un anuncio
                </p>
              </div>
            </div>
          ) : (
            conversations
            .filter(conv => !searchQuery.trim() || conv.participant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                active={conv.id === conversationId}
                userId={user?.id ?? ''}
                onClick={() => navigate(`/chat/${conv.id}`)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Panel de mensajes */}
      {!conversationId ? (
        <EmptyState />
      ) : (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="shrink-0 h-14 flex items-center gap-3 px-4 border-b bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => navigate('/chat')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {activeConv ? (
              <>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={activeConv.participant.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(activeConv.participant.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {activeConv.participant.full_name ?? 'Usuario'}
                  </p>
                  {activeConv.listing_info && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {activeConv.listing_info.title} · {Number(activeConv.listing_info.monthly_rent).toLocaleString('es-ES')}€/mes
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}
          </div>

          {/* Lista de mensajes */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
            {loadingMsgs ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn('flex gap-2 items-end', i % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}>
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <p className="text-sm text-muted-foreground">Todavía no hay mensajes</p>
                <p className="text-xs text-muted-foreground">¡Sé el primero en escribir!</p>
              </div>
            ) : (
              <>
                {(() => {
                  const items: React.ReactNode[] = []
                  let lastDay = ''
                  messages.forEach(msg => {
                    const day = getDayLabel(msg.created_at)
                    if (day !== lastDay) {
                      lastDay = day
                      items.push(
                        <div key={`sep-${day}`} className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground px-2 shrink-0">{day}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )
                    }
                    items.push(
                      <MessageBubble key={msg.message_id} msg={msg} isOwn={msg.sender_id === user?.id} />
                    )
                  })
                  return items
                })()}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t bg-background">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Escribe un mensaje..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="flex-1"
                maxLength={2000}
                autoComplete="off"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
