import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

function loadEnvKey(name: string) {
  const envKey = process.env[name] || '';
  if (envKey) return envKey;

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envText = fs.readFileSync(envPath, 'utf8');
    const match = envText.match(new RegExp(`(^|\\n)${name}=(.+)`));
    if (match?.[2]) {
      return match[2].trim().replace(/^['\"]|['\"]$/g, '');
    }
  } catch {
    // ignore
  }

  return '';
}

const OPENAI_API_KEY = loadEnvKey('OPENAI_API_KEY');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const GROQ_API_KEY = loadEnvKey('GROQ_API_KEY');
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const AI_PROVIDER = (process.env.AI_PROVIDER || (GROQ_API_KEY ? 'groq' : 'fallback')).toLowerCase();

function getAssistantReply(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('đăng ký') ||
    normalized.includes('đăng kí') ||
    normalized.includes('tạo tài khoản') ||
    normalized.includes('tài khoản') ||
    normalized.includes('register') ||
    normalized.includes('create account')
  ) {
    return 'Để đăng ký tài khoản trên UniMove, bạn truy cập trang đăng ký, chọn đúng vai trò phù hợp (khách hàng hoặc nhà cung cấp), điền thông tin cơ bản và hoàn tất xác nhận. Nếu bạn chưa rõ vai trò, hãy chọn vai trò phù hợp với nhu cầu sử dụng.';
  }

  if (
    normalized.includes('đăng nhập') ||
    normalized.includes('login') ||
    normalized.includes('sign in') ||
    normalized.includes('masuk')
  ) {
    return 'Để đăng nhập, bạn mở trang đăng nhập, nhập email và mật khẩu đã đăng ký. Nếu quên mật khẩu, hãy sử dụng chức năng quên mật khẩu để đặt lại.';
  }

  if (
    normalized.includes('cách sử dụng') ||
    normalized.includes('hướng dẫn') ||
    normalized.includes('sử dụng web') ||
    normalized.includes('sử dụng website') ||
    normalized.includes('bắt đầu') ||
    normalized.includes('web')
  ) {
    return 'Bạn có thể bắt đầu bằng cách đăng nhập, chọn vai trò phù hợp, rồi thực hiện các bước chính như đặt dịch vụ, xem đơn hàng, quản lý hồ sơ và theo dõi hoạt động trên website.';
  }

  if (
    normalized.includes('đặt dịch vụ') ||
    normalized.includes('đặt chuyến') ||
    normalized.includes('đặt xe') ||
    normalized.includes('đặt đơn') ||
    normalized.includes('booking') ||
    normalized.includes('book')
  ) {
    return 'Để đặt dịch vụ, bạn chọn chức năng đặt chuyến, nhập thông tin điểm đón và điểm đến, sau đó chọn nhà cung cấp phù hợp và xác nhận đơn.';
  }

  if (
    normalized.includes('thanh toán') ||
    normalized.includes('pay') ||
    normalized.includes('cổng thanh toán') ||
    normalized.includes('đặt cọc')
  ) {
    return 'UniMove hỗ trợ thanh toán an toàn qua cổng thanh toán. Bạn có thể thực hiện đặt cọc trước và thanh toán phần còn lại sau khi hoàn tất dịch vụ.';
  }

  if (
    normalized.includes('theo dõi') ||
    normalized.includes('tracking') ||
    normalized.includes('đơn hàng') ||
    normalized.includes('order') ||
    normalized.includes('trạng thái')
  ) {
    return 'Bạn có thể xem trạng thái đơn hàng và theo dõi tiến trình xử lý trong mục đơn hàng hoặc hoạt động của tài khoản.';
  }

  if (
    normalized.includes('hồ sơ') ||
    normalized.includes('profile') ||
    normalized.includes('thông tin cá nhân') ||
    normalized.includes('cập nhật')
  ) {
    return 'Bạn có thể quản lý hồ sơ cá nhân, cập nhật thông tin và thay đổi mật khẩu trong mục tài khoản.';
  }

  if (
    normalized.includes('nhà cung cấp') ||
    normalized.includes('provider') ||
    normalized.includes('tài xế') ||
    normalized.includes('driver')
  ) {
    return 'Nếu bạn là nhà cung cấp, bạn có thể đăng ký tài khoản, xác minh thông tin và nhận đơn hàng phù hợp với dịch vụ của mình.';
  }

  if (
    normalized.includes('khách hàng') ||
    normalized.includes('customer') ||
    normalized.includes('sinh viên')
  ) {
    return 'Nếu bạn là khách hàng, bạn có thể đăng ký tài khoản, đặt dịch vụ và theo dõi đơn hàng dễ dàng trên UniMove.';
  }

  if (
    normalized.includes('giới thiệu') ||
    normalized.includes('website') ||
    normalized.includes('unimove') ||
    normalized.includes('là gì')
  ) {
    return 'UniMove là nền tảng kết nối sinh viên với nhà cung cấp dịch vụ vận chuyển, giúp bạn đặt dịch vụ, quản lý đơn hàng và trao đổi thông tin một cách thuận tiện.';
  }

  return 'Mình chỉ hỗ trợ các câu hỏi về UniMove.';
}

function buildPrompt(message: string) {
  return `Bạn là trợ lý hỗ trợ UniMove. Chỉ trả lời các câu hỏi liên quan đến UniMove: đăng ký, đăng nhập, đặt dịch vụ, thanh toán, đơn hàng, hồ sơ tài khoản và hỗ trợ người dùng. Nếu câu hỏi nằm ngoài phạm vi này, hãy trả lời đúng một câu: "Mình chỉ hỗ trợ các câu hỏi về UniMove." Người dùng hỏi: ${message}`;
}

async function getOpenAiReply(message: string) {
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý hỗ trợ UniMove. Chỉ trả lời các câu hỏi liên quan đến UniMove: đăng ký, đăng nhập, đặt dịch vụ, thanh toán, đơn hàng, hồ sơ tài khoản và hỗ trợ người dùng. Nếu câu hỏi nằm ngoài phạm vi này, hãy trả lời đúng một câu: "Mình chỉ hỗ trợ các câu hỏi về UniMove."',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI] API error', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[OpenAI] request failed', error);
    return null;
  }
}

async function getGroqReply(message: string) {
  if (!GROQ_API_KEY) {
    console.log('[ChatAI] Groq skipped: no GROQ_API_KEY');
    return null;
  }

  console.log('[ChatAI] Calling Groq');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý hỗ trợ UniMove. Chỉ trả lời các câu hỏi liên quan đến UniMove: đăng ký, đăng nhập, đặt dịch vụ, thanh toán, đơn hàng, hồ sơ tài khoản và hỗ trợ người dùng. Nếu câu hỏi nằm ngoài phạm vi này, hãy trả lời đúng một câu: "Mình chỉ hỗ trợ các câu hỏi về UniMove."',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Groq] API error', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[Groq] request failed', error);
    return null;
  }
}

async function getAiReply(message: string) {
  if (AI_PROVIDER === 'groq') {
    const groqReply = await getGroqReply(message);
    if (groqReply) return groqReply;
    return getAssistantReply(message);
  }

  if (AI_PROVIDER === 'openai') {
    const openAiReply = await getOpenAiReply(message);
    if (openAiReply) return openAiReply;
  }

  return getAssistantReply(message);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message : '';
  console.log('[ChatAI] request', {
    provider: AI_PROVIDER,
    hasGroqKey: Boolean(GROQ_API_KEY),
    hasOpenAiKey: Boolean(OPENAI_API_KEY),
    messageLength: message.length,
  });
  const reply = await getAiReply(message);

  return NextResponse.json({
    reply,
    debug: {
      provider: AI_PROVIDER,
      groqKey: Boolean(GROQ_API_KEY),
      openAiKey: Boolean(OPENAI_API_KEY),
    },
  });
}
