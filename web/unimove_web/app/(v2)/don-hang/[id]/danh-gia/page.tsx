"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { ordersApi, reviewsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores";

const TAGS = ["Đúng giờ", "Cẩn thận", "Thân thiện", "Giá hợp lý", "Xe sạch", "Chuyên nghiệp"];

interface OrderBrief {
  id: string;
  status: string;
  provider_name?: string;
  provider?: { full_name?: string };
  my_review?: { id: string; rating: number };
}

export default function DanhGiaDonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();
  const [order, setOrder] = useState<OrderBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    ordersApi
      .get(id)
      .then((res) => {
        if (res.success && res.data) setOrder(res.data as OrderBrief);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const submit = async () => {
    if (rating < 1) {
      showError("Vui lòng chọn số sao");
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.submit(id, {
        rating,
        comment: comment.trim() || undefined,
        tags,
        service_quality_rating: rating,
        punctuality_rating: rating,
        professionalism_rating: rating,
        value_for_money_rating: rating,
      });
      showSuccess("Cảm ơn bạn đã đánh giá!");
      router.push(`/don-hang/${id}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Không gửi được đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const providerName = order?.provider_name ?? order?.provider?.full_name ?? "nhà xe";

  if (loading) {
    return (
      <Container className="max-w-lg py-10">
        <p className="text-sm text-gray-500">Đang tải...</p>
      </Container>
    );
  }

  if (!order || order.status !== "completed") {
    return (
      <Container className="max-w-lg py-10 space-y-4">
        <p className="text-sm text-gray-600">Chỉ đánh giá được sau khi chuyến hoàn thành.</p>
        <Button variant="outline" asChild>
          <Link href={`/don-hang/${id}`}>Quay lại đơn hàng</Link>
        </Button>
      </Container>
    );
  }

  if (order.my_review) {
    return (
      <Container className="max-w-lg py-10 space-y-4">
        <Card className="p-6 text-center">
          <Star className="mx-auto mb-3 fill-amber-400 text-amber-400" size={32} />
          <p className="font-semibold text-gray-900">Bạn đã đánh giá chuyến này</p>
          <p className="mt-1 text-sm text-gray-500">
            {order.my_review.rating} sao — cảm ơn phản hồi của bạn!
          </p>
        </Card>
        <Button variant="outline" asChild className="w-full">
          <Link href={`/don-hang/${id}`}>Quay lại đơn hàng</Link>
        </Button>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-16 pt-6">
      <Container className="max-w-lg">
        <Link
          href={`/don-hang/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0047FF]"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>

        <h1 className="text-xl font-semibold text-gray-900">Đánh giá chuyến đi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mã đơn #{id.slice(0, 8).toUpperCase()} · {providerName}
        </p>

        <Card className="mt-6 p-6 text-center">
          <p className="mb-4 text-sm text-gray-500">Bạn hài lòng thế nào?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-1">
                <Star
                  size={28}
                  className={cn(
                    s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200",
                  )}
                />
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-4 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                tags.includes(t)
                  ? "border-[#0047FF] bg-[#EFF6FF] text-[#0047FF]"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
              )}
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
          className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
        />

        <Button
          className="mt-6 w-full bg-[#0047FF] hover:bg-[#2563EB]"
          loading={submitting}
          onClick={submit}
        >
          Gửi đánh giá
        </Button>
      </Container>
    </div>
  );
}
