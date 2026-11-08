# Trợ lý BeeHub

Trợ lý AI chạy qua API route của website, không gửi API key xuống trình duyệt. Khi phát triển local, có thể đặt một trong các key `GEMINI_API_KEY`, `OPENAI_API_KEY` hoặc `GROQ_API_KEY` trong `backend/.env` hoặc `web/unimove_web/.env.local`. Không dùng tiền tố `NEXT_PUBLIC_` cho API key.

Provider được chọn theo `AI_PROVIDER=gemini|openai|groq`. Nếu không đặt, ứng dụng tự chọn theo key hiện có (Gemini, OpenAI, rồi Groq). Model Gemini chính mặc định là `gemini-3.5-flash-lite`; model dự phòng mặc định là `gemini-3.6-flash`, được dùng sau một lần retry nếu model chính trả 429/503. Có thể cấu hình qua `GEMINI_MODEL` và `GEMINI_FALLBACK_MODEL`; model khác cấu hình qua `OPENAI_MODEL` hoặc `GROQ_MODEL`. Hãy chọn model được API key liệt kê qua Gemini `ListModels`. Khởi động lại website sau khi thay đổi biến môi trường.

Nếu người dùng đã đăng nhập, widget gửi access token hiện tại; API xác minh token bằng backend rồi mới lấy hồ sơ của chính người dùng. Khi câu hỏi cần tư vấn nhà xe, hệ thống lấy nhà xe đang hoạt động đã xác minh, thông tin dịch vụ, khu vực hoạt động, điểm đánh giá và tối đa 20 đánh giá gần nhất. AI không được phép suy đoán khoảng cách thực tế khi chưa có tọa độ.
