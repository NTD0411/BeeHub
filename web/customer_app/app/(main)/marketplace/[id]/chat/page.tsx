"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { marketplaceApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  seller_id: string;
  seller?: { full_name: string };
}

export default function ListingChatPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const currentUser = getStoredUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    marketplaceApi.getListing(id).then((res) => {
      if (res.success && res.data) {
        const l = res.data as Listing;
        setListing(l);
        const sellerId = l.seller_id;
        const buyerId = currentUser.id !== sellerId ? currentUser.id : "";
        if (buyerId) {
          marketplaceApi.getMessages(id, buyerId).then((msgRes) => {
            if (msgRes.success && msgRes.data) {
              const msgData = msgRes.data as { messages?: Message[] } | Message[];
              setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages ?? []));
            }
          });
        }
      }
    });
  }, [id, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !listing || !currentUser) return;
    const sellerId = listing.seller_id;
    const buyerId = currentUser.id !== sellerId ? currentUser.id : "";
    if (!buyerId) return;

    setLoading(true);
    try {
      const res = await marketplaceApi.sendMessage(id, buyerId, text.trim());
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as Message]);
        setText("");
      }
    } catch {
      toast("Gửi tin nhắn thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href={`/marketplace/${id}`} className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ color: "var(--text)" }}>
              {listing?.seller?.full_name ?? "Người bán"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{listing?.title}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Bắt đầu cuộc trò chuyện về sản phẩm này</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] px-4 py-2.5 rounded-2xl"
                style={{
                  backgroundColor: isMine ? "var(--primary)" : "var(--card)",
                  color: isMine ? "white" : "var(--text)",
                  border: isMine ? "none" : "1px solid var(--border)",
                }}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-[10px] mt-1 opacity-70 text-right">{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 pb-6" style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 h-11 rounded-xl border px-4 text-sm"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
