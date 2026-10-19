'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Bot, MessageCircle, Send, Sparkles, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const USE_AI_ROUTE = true;

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
};

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

  return 'Nội dung không hợp lệ.';
}

async function getAiReply(message: string) {
  try {
    const response = await fetch('/api/chat/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API route error', response.status, errorText);
      return getAssistantReply(message);
    }

    const data = await response.json();
    return data?.reply || getAssistantReply(message);
  } catch (error) {
    console.error('AI request failed', error);
    return getAssistantReply(message);
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
        'Xin chào! Tôi là trợ lý UniMove. Bạn có thể hỏi về đăng ký tài khoản, đăng nhập, cách sử dụng website, đặt dịch vụ, thanh toán, theo dõi đơn hàng hoặc hồ sơ cá nhân.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const dragInfo = useRef<{ offsetX: number; offsetY: number; didDrag: boolean } | null>(null);

  const getReply = async (message: string) => {
    if (USE_AI_ROUTE) {
      return getAiReply(message);
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

    const reply = await getReply(trimmed);

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
            <span>Hỗ trợ UniMove</span>
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
                <p className="text-sm font-semibold">Trợ lý UniMove</p>
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

                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 shadow-sm'
                        }`}
                      >
                        {message.content}
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
