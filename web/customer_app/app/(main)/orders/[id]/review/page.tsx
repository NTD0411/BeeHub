"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, Send } from "lucide-react";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useParams, useRouter } from "next/navigation";

const TAGS = ["Đúng giờ", "Cẩn thận", "Thân thiện", "Giá hợp lý", "Xe sạch"];

export default function ReviewOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const submit = async () => {
    if (rating < 1) {
      toast("Chọn số sao", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast("Cảm ơn đánh giá! (demo — API reviews sắp có)", "success");
    router.push("/activity");
    setLoading(false);
  };

  return (
    <div className="min-h-screen px-5 pt-6 pb-10">
      <FadeSlideIn>
        <Link href="/activity" className="text-sm font-medium mb-4 inline-block" style={{ color: "var(--primary)" }}>← Hoạt động</Link>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Đánh giá chuyến đi</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Đơn #{id?.slice(0, 8)}</p>
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <GlassCard className="p-6 text-center mb-4">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>Bạn hài lòng thế nào?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-1">
                <Star size={32} fill={s <= rating ? "#f59e0b" : "none"} style={{ color: s <= rating ? "#f59e0b" : "var(--border)" }} />
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="flex flex-wrap gap-2 mb-4">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                backgroundColor: tags.includes(t) ? "var(--primary-tint)" : "var(--surface)",
                borderColor: tags.includes(t) ? "var(--primary)" : "var(--border)",
                color: tags.includes(t) ? "var(--primary)" : "var(--muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhận xét thêm (tuỳ chọn)"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border text-sm mb-6 resize-none"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        />

        <Button variant="gradient" className="w-full h-12" loading={loading} onClick={submit}>
          <Send size={18} className="mr-2" /> Gửi đánh giá
        </Button>
      </FadeSlideIn>
    </div>
  );
}
