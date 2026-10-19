"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare, Send, ArrowLeft, Package, User,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { conversationsApi } from "@/lib/api";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

const BRAND = "#1A56DB";

interface Counterpart { id: string; full_name: string; avatar_url?: string; phone?: string; }
interface Order       { id: string; status: string; service_type?: string; }
interface Conversation {
  id: string; order_id: string;
  last_message_preview?: string; last_message_at?: string;
  unread_count: number; order?: Order; counterpart?: Counterpart;
}
interface Message {
  id: string; content: string; is_mine: boolean; created_at: string;
  sender?: { id: string; full_name: string };
}

function Avatar({ name, url, size = 40 }: { name?: string; url?: string; size?: number }) {
  const initials = (name ?? "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) return (
    <img src={url} alt={name} className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
      style={{ width: size, height: size, backgroundColor: BRAND }}>
      {initials}
    </div>
  );
}

function ServiceLabel({ type }: { type?: string }) {
  const map: Record<string, string> = {
    moving: "Chuyển nhà", delivery: "Giao hàng", heavy_lifting: "Khuân vác",
  };
  return <span className="text-xs text-gray-400">{map[type ?? ""] ?? "Đơn hàng"}</span>;
}

export default function ProviderMessagesPage() {
  const [me,           setMe]           = useState<AuthUser | null>(null);
  const [convos,       setConvos]       = useState<Conversation[]>([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [active,       setActive]       = useState<Conversation | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMe(getStoredUser()); }, []);

  const loadConvos = useCallback(() => {
    setLoadingList(true);
    conversationsApi.list().then(r => {
      if (r.success && r.data) setConvos(r.data as Conversation[]);
    }).finally(() => setLoadingList(false));
  }, []);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  const openConvo = useCallback((conv: Conversation) => {
    setActive(conv);
    setMessages([]);
    setLoadingMsgs(true);
    conversationsApi.getMessages(conv.order_id).then(r => {
      if (r.success && r.data) {
        const d = r.data as { messages?: Message[] };
        setMessages(d.messages ?? []);
        setConvos(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
      }
    }).finally(() => setLoadingMsgs(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!active || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const optimistic: Message = {
      id: `opt-${Date.now()}`, content: text, is_mine: true,
      created_at: new Date().toISOString(),
      sender: me ? { id: me.id, full_name: me.full_name } : undefined,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const r = await conversationsApi.sendMessage(active.order_id, text);
      if (r.success && r.data) {
        const real = r.data as Message;
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...optimistic, ...real } : m));
        setConvos(prev => prev.map(c =>
          c.id === active.id ? { ...c, last_message_preview: text, last_message_at: real.created_at } : c
        ));
      }
    } finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="h-full -m-6 flex overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">

      {/* Left: conversation list */}
      <div className={`flex flex-col border-r border-gray-100 ${active ? "hidden lg:flex" : "flex"}`}
        style={{ width: 320, minWidth: 320 }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tin nhắn</h2>
            <p className="text-xs text-gray-400 mt-0.5">Chat với khách hàng</p>
          </div>
          <button onClick={loadConvos}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 items-center animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 rounded bg-gray-100" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : convos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                <MessageSquare size={32} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 mb-1">Chưa có tin nhắn</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Khi khách hàng nhắn tin về đơn hàng,<br />cuộc trò chuyện sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {convos.map(conv => {
                const isActive = active?.id === conv.id;
                return (
                  <button key={conv.id} onClick={() => openConvo(conv)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80"
                    style={{ backgroundColor: isActive ? "#EFF4FE" : undefined }}>
                    <Avatar name={conv.counterpart?.full_name} url={conv.counterpart?.avatar_url} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          {conv.counterpart?.full_name ?? "Khách hàng"}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {conv.last_message_at ? timeAgo(conv.last_message_at) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <ServiceLabel type={conv.order?.service_type} />
                          {conv.last_message_preview && (
                            <>
                              <span className="text-gray-300 text-xs">·</span>
                              <p className={`text-xs truncate ${conv.unread_count > 0 ? "font-semibold text-gray-700" : "text-gray-400"}`}>
                                {conv.last_message_preview}
                              </p>
                            </>
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="flex items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0"
                            style={{ width: 18, height: 18, backgroundColor: BRAND }}>
                            {conv.unread_count > 9 ? "9+" : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    {!conv.unread_count && <ChevronRight size={14} className="text-gray-200 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: chat window */}
      <div className={`flex-1 flex flex-col min-w-0 ${active ? "flex" : "hidden lg:flex"}`}>
        {!active ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #EFF4FE, #DBEAFE)" }}>
              <MessageSquare size={32} style={{ color: BRAND }} />
            </div>
            <p className="font-bold text-gray-800 mb-1.5">Chọn cuộc trò chuyện</p>
            <p className="text-sm text-gray-400">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu chat</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
              <button onClick={() => setActive(null)}
                className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <Avatar name={active.counterpart?.full_name} url={active.counterpart?.avatar_url} size={38} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {active.counterpart?.full_name ?? "Khách hàng"}
                </p>
                <div className="flex items-center gap-1.5">
                  <Package size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-400 truncate">
                    Đơn #{active.order_id.slice(0, 8).toUpperCase()}
                    {active.order?.service_type && ` · ${active.order.service_type}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
              {loadingMsgs ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} animate-pulse`}>
                      <div className="h-9 rounded-2xl bg-gray-200" style={{ width: `${40 + i * 20}%` }} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                    <MessageSquare size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Chưa có tin nhắn</p>
                  <p className="text-xs text-gray-400">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}>
                    {!msg.is_mine && (
                      <Avatar name={active.counterpart?.full_name} url={active.counterpart?.avatar_url} size={28} />
                    )}
                    <div className={`max-w-[72%] ${!msg.is_mine ? "ml-2" : "mr-0"}`}>
                      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={msg.is_mine
                          ? { backgroundColor: BRAND, color: "#fff", borderBottomRightRadius: 4 }
                          : { backgroundColor: "#fff", color: "#1F2937", border: "1px solid #F3F4F6", borderBottomLeftRadius: 4 }
                        }>
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-gray-400 mt-1 ${msg.is_mine ? "text-right" : "text-left"}`}>
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                    {msg.is_mine && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-2 self-end mb-5"
                        style={{ backgroundColor: "#EFF4FE" }}>
                        <User size={13} style={{ color: BRAND }} />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-[#1A56DB] focus-within:ring-1 focus-within:ring-[#1A56DB] transition-all">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Nhập tin nhắn... (Enter để gửi)" rows={1}
                  className="flex-1 bg-transparent resize-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none py-1 max-h-32"
                  style={{ lineHeight: "1.5" }} />
                <button onClick={send} disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 shrink-0"
                  style={{ backgroundColor: BRAND }}>
                  {sending
                    ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <Send size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">Shift+Enter để xuống dòng</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
