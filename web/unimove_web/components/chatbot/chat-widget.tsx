'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Bot, MessageCircle, Send, Sparkles, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getStoredToken } from '@/lib/auth';

const USE_AI_ROUTE = true;

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
};

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderAssistantContent(content: string) {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const HeadingTag = heading[1].length === 1 ? 'h3' : 'h4';
      blocks.push(
        <HeadingTag key={`heading-${index}`} className="mb-1 font-semibold text-slate-900">
          {renderInlineMarkdown(heading[2])}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedItem) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^\d+[.)]\s+(.+)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push(
        <ol key={`ordered-${index}`} className="my-1.5 list-decimal space-y-1 pl-5 marker:font-medium">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-0.5">{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^[-*]\s+(.+)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push(
        <ul key={`unordered-${index}`} className="my-1.5 list-disc space-y-1 pl-5 marker:text-blue-500">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-0.5">{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      const nextLine = lines[index].trim();
      if (
        paragraph.length > 0 &&
        (/^#{1,3}\s+/.test(nextLine) || /^\d+[.)]\s+/.test(nextLine) || /^[-*]\s+/.test(nextLine))
      ) {
        break;
      }
      paragraph.push(nextLine);
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="my-1.5 whitespace-pre-wrap break-words">
        {renderInlineMarkdown(paragraph.join(' '))}
      </p>,
    );
  }

  return <div className="space-y-1">{blocks}</div>;
}

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
    return 'Để đăng ký tài khoản trên BeeHub, bạn truy cập trang đăng ký, chọn đúng vai trò phù hợp (khách hàng hoặc nhà cung cấp), điền thông tin cơ bản và hoàn tất xác nhận. Nếu bạn chưa rõ vai trò, hãy chọn vai trò phù hợp với nhu cầu sử dụng.';
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
    return 'BeeHub hỗ trợ thanh toán an toàn qua cổng thanh toán. Bạn có thể thực hiện đặt cọc trước và thanh toán phần còn lại sau khi hoàn tất dịch vụ.';
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
    return 'Nếu bạn là khách hàng, bạn có thể đăng ký tài khoản, đặt dịch vụ và theo dõi đơn hàng dễ dàng trên BeeHub.';
  }

  if (
    normalized.includes('giới thiệu') ||
    normalized.includes('website') ||
    normalized.includes('unimove') ||
    normalized.includes('là gì')
  ) {
    return 'BeeHub là nền tảng kết nối sinh viên với nhà cung cấp dịch vụ vận chuyển, giúp bạn đặt dịch vụ, quản lý đơn hàng và trao đổi thông tin một cách thuận tiện.';
  }

  return 'Nội dung không hợp lệ.';
}

async function getAiReply(message: string, history: ChatMessage[]) {
  try {
    const token = getStoredToken();
    const response = await fetch('/api/chat/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        history: history.slice(-8).map(({ role, content }) => ({ role, content })),
      }),
    });

    const responseText = await response.text();
    let data: { reply?: unknown; error?: unknown };
    try {
      data = JSON.parse(responseText) as { reply?: unknown; error?: unknown };
    } catch {
      if (response.status === 404) {
        return 'Không tìm thấy API trợ lý. Vui lòng khởi động lại website BeeHub từ thư mục web/unimove_web.';
      }
      return 'Máy chủ trợ lý phản hồi không hợp lệ. Vui lòng thử lại sau.';
    }

    if (!response.ok) {
      return typeof data?.error === 'string'
        ? data.error
        : 'Xin lỗi, hiện tôi chưa thể trả lời. Vui lòng thử lại sau.';
    }
    return typeof data?.reply === 'string' && data.reply
      ? data.reply
      : 'Xin lỗi, tôi chưa nhận được câu trả lời. Bạn vui lòng thử lại nhé.';
  } catch (error) {
    console.error('AI request failed', error);
    return 'Xin lỗi, hiện tôi chưa kết nối được trợ lý. Bạn vui lòng thử lại sau nhé.';
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý BeeHub. Bạn có thể hỏi về đăng ký tài khoản, đăng nhập, cách sử dụng website, đặt dịch vụ, thanh toán, theo dõi đơn hàng hoặc hồ sơ cá nhân.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const dragInfo = useRef<{ offsetX: number; offsetY: number; didDrag: boolean } | null>(null);

  const getReply = async (message: string, history: ChatMessage[]) => {
    if (USE_AI_ROUTE) {
      return getAiReply(message, history);
    }

    return getAssistantReply(message);
  };

  const quickQuestions = useMemo(
    () => [
      'Làm sao để đăng ký tài khoản?',
      'Cách đăng nhập vào website?',
      'Cách sử dụng website như thế nào?',
      'Làm sao để đặt dịch vụ?',
      'Tôi muốn xem trạng thái đơn hàng?',
      'Website này có chức năng gì?',
    ],
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    setPosition({
      x: Math.max(16, width - 112),
      y: Math.max(16, height - 132),
    });
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragInfo.current) return;

      dragInfo.current.didDrag = true;

      const nextX = Math.min(
        Math.max(12, event.clientX - dragInfo.current.offsetX),
        window.innerWidth - 72
      );
      const nextY = Math.min(
        Math.max(12, event.clientY - dragInfo.current.offsetY),
        window.innerHeight - 72
      );

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      if (dragInfo.current && !dragInfo.current.didDrag) {
        setIsOpen(true);
      }
      dragInfo.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragInfo.current = {
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      didDrag: false,
    };
    setIsDragging(true);
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    const reply = await getReply(trimmed, messages);

    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: reply,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const panelPosition =
    typeof window === 'undefined'
      ? { left: 12, top: 12 }
      : {
          left: Math.min(Math.max(12, position.x), Math.max(12, window.innerWidth - 376)),
          top: Math.min(Math.max(12, position.y), Math.max(12, window.innerHeight - 460)),
        };

  return (
    <div className="fixed z-[60]">
      <AnimatePresence mode="wait" initial={false}>
        {!isOpen ? (
          <motion.button
            key="launcher"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onPointerDown={handlePointerDown}
            onClick={() => {
              if (!dragInfo.current?.didDrag) {
                setIsOpen(true);
              }
            }}
            className="fixed flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl active:scale-95 touch-none"
            style={{ left: position.x, top: position.y, cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span>Hỗ trợ BeeHub</span>
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed w-[calc(100vw-1.5rem)] max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{ left: panelPosition.left, top: panelPosition.top }}
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Trợ lý BeeHub</p>
                <p className="text-xs text-blue-100">Hỗ trợ về website và đăng ký</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-blue-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[320px] max-h-[78dvh] flex-col bg-slate-50 p-3">
              <div className="mb-2 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className={message.role === 'assistant' ? 'max-w-[86%]' : 'max-w-[80%]'}>
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 shadow-sm'
                        }`}
                      >
                        {message.role === 'assistant'
                          ? renderAssistantContent(message.content)
                          : message.content}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        Đang trả lời...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {showSuggestions && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-200 pt-2">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => {
                        setInputValue(question);
                        setIsOpen(true);
                        setShowSuggestions(false);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="mt-2 flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
