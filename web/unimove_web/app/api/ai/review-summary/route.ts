import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface ReviewSummaryResponse {
  summary: string | null;
  highlights: string[];
  concerns: string[];
  verdict: string | null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  let body: { reviews?: Array<{ rating: number; comment?: string | null; tags?: string[] }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const reviews = body.reviews ?? [];
  if (reviews.length === 0) {
    return NextResponse.json({ summary: null, highlights: [], concerns: [], verdict: null });
  }

  // Build a full review list for the prompt
  const reviewLines = reviews
    .slice(0, 30)
    .map((r, i) => {
      const stars = `${r.rating}/5 sao`;
      const comment = r.comment?.trim() ? `"${r.comment.trim().slice(0, 200)}"` : "(không có nhận xét)";
      const tags = r.tags?.length ? `[${r.tags.join(", ")}]` : "";
      return `${i + 1}. ${stars} ${tags}\n   ${comment}`;
    })
    .join("\n");

  // Tag frequency analysis
  const allTags = reviews.flatMap((r) => r.tags ?? []);
  const tagFreq: Record<string, number> = {};
  for (const t of allTags) tagFreq[t] = (tagFreq[t] ?? 0) + 1;
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => `${tag} (${count}x)`)
    .join(", ");

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const lowRatingCount = reviews.filter((r) => r.rating <= 2).length;

  const prompt = `Bạn là chuyên gia phân tích đánh giá khách hàng cho nền tảng vận chuyển chuyển trọ sinh viên UniMove (Đà Nẵng).

=== DỮ LIỆU ĐÁNH GIÁ ===
- Tổng số đánh giá: ${reviews.length}
- Điểm trung bình: ${avgRating}/5
- Số đánh giá 5 sao: ${fiveStarCount}
- Số đánh giá ≤ 2 sao: ${lowRatingCount}
- Tags phổ biến: ${topTags || "không có"}

Chi tiết đánh giá:
${reviewLines}

=== YÊU CẦU ===
Hãy trả về JSON hợp lệ với cấu trúc sau (KHÔNG có markdown, KHÔNG có code block):
{
  "summary": "Đoạn tóm tắt tổng quan 2-3 câu về nhà xe, phong cách chuyên nghiệp, bằng tiếng Việt",
  "highlights": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
  "concerns": ["điểm cần lưu ý 1"],
  "verdict": "Một câu kết luận ngắn gọn về mức độ đáng tin cậy của nhà xe"
}

Quy tắc:
- summary: tóm tắt toàn diện về chất lượng dịch vụ, thái độ, đúng giờ, giá cả — dựa trên dữ liệu thực tế
- highlights: tối đa 4 điểm mạnh nổi bật nhất được khách hay nhắc đến (ngắn, súc tích, mỗi mục ≤ 10 từ)
- concerns: điểm hạn chế nếu có (nếu toàn 5 sao và nhận xét tốt thì để mảng rỗng [])
- verdict: câu kết luận ví dụ "Nhà xe đáng tin cậy, phù hợp với sinh viên chuyển trọ"
- Viết bằng tiếng Việt, giọng khách quan, không quá khen hoặc chê
- CHỈ trả về JSON thuần, không thêm bất kỳ text nào khác`;

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
          topP: 0.85,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("[Gemini] API error:", geminiRes.status, err);
      return NextResponse.json(buildFallback(reviews, avgRating));
    }

    const data = await geminiRes.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    console.log("[Gemini] raw response:", raw);

    if (!raw) {
      return NextResponse.json(buildFallback(reviews, avgRating));
    }

    // Strip markdown code blocks if Gemini wraps with ```json ... ```
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    try {
      const parsed = JSON.parse(cleaned) as ReviewSummaryResponse;
      return NextResponse.json({
        summary: parsed.summary ?? buildFallback(reviews, avgRating).summary,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 3) : [],
        verdict: parsed.verdict ?? null,
      });
    } catch {
      console.warn("[Gemini] JSON parse failed, using raw text as summary");
      // Fallback: treat raw text as the summary
      return NextResponse.json({
        summary: raw.slice(0, 400),
        highlights: [],
        concerns: [],
        verdict: null,
      });
    }
  } catch (err) {
    console.error("[Gemini] Fetch failed:", err);
    return NextResponse.json(buildFallback(reviews, avgRating));
  }
}

function buildFallback(
  reviews: Array<{ rating: number; tags?: string[] }>,
  avgRating: string,
): ReviewSummaryResponse {
  const allTags = reviews.flatMap((r) => r.tags ?? []);
  const tagFreq: Record<string, number> = {};
  for (const t of allTags) tagFreq[t] = (tagFreq[t] ?? 0) + 1;
  const topHighlights = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  return {
    summary: `Nhà xe được khách hàng đánh giá ${avgRating}/5 sao qua ${reviews.length} lượt nhận xét.`,
    highlights: topHighlights,
    concerns: [],
    verdict: null,
  };
}
