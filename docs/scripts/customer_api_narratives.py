# -*- coding: utf-8 -*-
"""Mô tả luồng người dùng — kiểu kể chuyện cho dev (gộp vào CSV)."""

NARRATIVES = {
    'F1': (
        '【Luồng Pass đồ — khớp app hiện tại】\n'
        'NGƯỜI MUA: Trang chủ → «Pass đồ cũ» (/pass-items, tab Khám phá) → chi tiết tin → «Tôi muốn nhận» (hoặc «Vào chat thương lượng») → '
        '/pass-items/:id/chat → thương lượng → CHỜ người bán «Chốt đơn» trong chat → mới hiện «Đặt xe lấy đồ» → '
        'màn «Chở đồ về nhà» (/booking/location, pickup = khu vực tin) → «Tiếp tục» (gọi transport-booked) → '
        'Combo chuyển trọ → Chọn nhà xe → Bảo hiểm → Thanh toán cọc → Theo dõi đơn.\n'
        'NGƯỜI BÁN: /pass-items tab «Tin của tôi» → đăng tin (/pass-items/new) → chi tiết tin của mình → '
        '«Người quan tâm» / «N khách — mở danh sách chat» → /pass-items/:id/chat (chọn ?buyer=) → thương lượng → «Chốt đơn». '
        '«Huỷ chốt» chỉ khi khách CHƯA bấm Tiếp tục đặt xe (buyer_transport_booked = false).'
    ),
    'F2': (
        '【Luồng đặt chuyến — khớp HomeShell + router】\n'
        'App có 4 tab dưới: Trang chủ | Thanh toán | Hoạt động | Tin nhắn (thông báo/khuyến mãi, KHÔNG phải chat nhà xe).\n\n'
        'A) «Đặt chuyến» (Trang chủ): /booking/location → «Tiếp tục» → /booking/packages → «Chọn nhà xe» → '
        '/booking/partners → /booking/insurance → /booking/payment → /orders/:id/tracking.\n'
        'B) Card «Combo chuyển trọ» lớn: vào /booking/packages TRƯỚC (có thể sửa địa điểm) → partners → insurance → payment.\n'
        'C) «So sánh nhà xe»: /booking/partners thẳng → insurance → payment.\n'
        'D) «Khuân vác»: /booking/labor → /booking/location → /booking/labor/configure → /booking/payment (không qua combo/nhà xe/bảo hiểm).\n'
        'E) Sau Pass đồ chốt: /booking/location (Chở đồ về nhà) → packages → … như A.\n'
        'Lưu ý: hầu hết bước đang dùng mock repository; API trong sheet là mục tiêu khi nối backend.'
    ),
    1: (
        'API kiểm tra server còn chạy không. Người dùng thường không thấy bước này — dev có thể gọi lúc mở app để biết backend sống. '
        'Xong thì app vẫn tiếp tục bình thường (đăng nhập hoặc vào Trang chủ).'
    ),
    2: (
        'Người dùng chưa có tài khoản: vào màn Đăng ký → điền email, mật khẩu, họ tên, số điện thoại → bấm «Đăng ký». '
        'App gọi API này để tạo tài khoản khách hàng. Thành công: app lưu đăng nhập (token) → chuyển Trang chủ '
        '(hoặc báo «kiểm tra email» nếu bật xác thực email, khi đó phải xác thực xong mới đăng nhập được). '
        'Thất bại: email đã dùng → báo lỗi, ở lại màn Đăng ký.'
    ),
    3: (
        'Người dùng đã có tài khoản: màn Đăng nhập → nhập email + mật khẩu → bấm «Đăng nhập». '
        'API kiểm tra đúng/sai. Đúng: nhớ đăng nhập → vào Trang chủ. Sai: báo «Email hoặc mật khẩu không đúng», ở lại màn Đăng nhập. '
        'Chưa xác thực email (nếu có): báo riêng, không cho vào app.'
    ),
    4: (
        'Cùng màn Đăng nhập: người dùng bấm «Tiếp tục với Google» → chọn tài khoản Google trên điện thoại. '
        'App lấy token Google gửi API này. Lần đầu: tạo tài khoản UniMove từ thông tin Google. Lần sau: đăng nhập như email. '
        'Thành công → Trang chủ. Hủy chọn Google → không gọi API, vẫn ở màn Đăng nhập.'
    ),
    5: (
        '【App hiện tại】Màn Splash (~4 giây) KHÔNG gọi API — chỉ kiểm tra: đã xem onboarding chưa → đã lưu token trên máy chưa → '
        'đi /onboarding (lần đầu) | /home (có token) | /login.\n'
        '【Khi nối API】Có thể gọi GET /auth/me hoặc /customers/me ngay trên Splash để làm mới profile trước khi vào /home; '
        '401 thì xóa token → /login.'
    ),
    6: (
        'Người dùng quên mật khẩu: từ Đăng nhập → «Quên mật khẩu» → nhập email → bấm «Gửi». '
        'API gửi mã/ link về email. App báo «Đã gửi hướng dẫn» → chuyển sang màn Đặt lại mật khẩu (dù email có tồn tại hay không, để bảo mật).'
    ),
    7: (
        'Tiếp bước quên MK: người dùng nhập email, mã OTP (trong email), mật khẩu mới → bấm «Xác nhận». '
        'API đổi mật khẩu. Thành công → về màn Đăng nhập + báo đổi MK thành công → đăng nhập lại bằng MK mới. '
        'OTP sai → báo lỗi tại ô mã.'
    ),
    8: (
        'Người dùng đã đăng nhập: Cá nhân → «Đổi mật khẩu» → nhập MK cũ, MK mới, nhập lại MK mới → Lưu. '
        'API xác nhận MK cũ đúng rồi đổi. Thành công → báo «Đã đổi» → quay lại Cá nhân (vẫn đăng nhập). MK cũ sai → báo lỗi.'
    ),
    9: (
        'Cá nhân → «Đăng xuất» → xác nhận. App gọi API (nếu có) và xóa đăng nhập trên máy → luôn về màn Đăng nhập, '
        'kể cả mất mạng lúc gọi API.'
    ),
    10: (
        'Người dùng vào Cá nhân hoặc Trang chủ (phần avatar/tên): app gọi API lấy họ tên, ảnh, MSSV, trường, số đơn, điểm… '
        'Hiển thị lên màn. Sau khi sửa hồ sơ hoặc đăng nhập mới cũng gọi lại để cập nhật.'
    ),
    11: (
        'Cá nhân → «Chỉnh sửa» → sửa tên, SĐT, MSSV, trường… → «Lưu». API cập nhật. Thành công → báo «Đã lưu» → '
        'quay Cá nhân thấy thông tin mới. Email không đổi được trên màn này.'
    ),
    12: (
        'Trong Sửa hồ sơ: chạm avatar → chọn ảnh từ máy. API upload ảnh. Thành công → avatar đổi trên form; '
        'về Trang chủ / Cá nhân cũng thấy ảnh mới.'
    ),
    13: (
        'Người dùng mở tab «Thanh toán» ở thanh menu dưới: app gọi API lấy số dư ví và điểm tích lũy → hiện ở thẻ đầu tab.'
    ),
    14: (
        'Màn /booking/location khi mở: BookingFlowCubit.loadPlaces() (hiện mock — chưa gọi API thật). '
        'Danh sách «Gần đây» hiện dưới bản đồ; chạm một dòng → điền địa chỉ đến. '
        'Người dùng nhập/chọn xong → bấm «Tiếp tục» → sang /booking/packages (chuyển trọ) hoặc /booking/labor/configure (khuân vác).'
    ),
    15: (
        'Tab Thanh toán → «Phương thức thanh toán»: app gọi API lấy PayOS/MoMo đã liên kết → hiện danh sách, mục nào là mặc định.'
    ),
    16: (
        'Trong Phương thức thanh toán → «Thêm» / liên kết PayOS hoặc MoMo → sau khi liên kết cổng thành công, app gọi API lưu → '
        'quay lại danh sách thấy PT mới.'
    ),
    17: (
        'Trên danh sách PT: người dùng chọn «Đặt làm mặc định» → API cập nhật → lần thanh toán sau tự chọn PT đó.'
    ),
    18: (
        'Trên danh sách PT: xóa một PT → xác nhận → API xóa → mục biến mất khỏi list.'
    ),
    19: (
        '【Mục tiêu API】Sau khi user nhập đủ điểm lấy + điểm giao, trước khi sang bước tiếp theo — tính km và quận/huyện.\n'
        '【App hiện tại】Nút «Tiếp tục» trên /booking/location CHƯA gọi validate-route; chỉ kiểm tra destination không rỗng rồi push sang packages. '
        'Dev nối API: gọi trong onPressed «Tiếp tục», lưu distance vào BookingFlowCubit. '
        'Pass đồ: pickup cố định theo area tin; destination do buyer nhập.'
    ),
    20: (
        'Màn «Chọn gói»: app gọi API lấy 3 gói (Tiết kiệm / Tiêu chuẩn / Cao cấp) → người dùng chọn một gói → «Tiếp tục» '
        'sang chọn nhà xe (hoặc bảo hiểm tùy luồng app).'
    ),
    21: (
        'Màn «Bảo hiểm đồ đạc»: app gọi API lấy các gói bảo hiểm (hoặc «Không mua») → chọn → tiếp sang màn thanh toán.'
    ),
    22: (
        'Màn «Chọn nhà xe» (hoặc so sánh từ Trang chủ): app gọi API lấy danh sách nhà xe, giá, sao → người dùng lọc/sắp xếp, '
        'chọn một nhà → tiếp bước sau (bảo hiểm hoặc thanh toán).'
    ),
    23: (
        'Khi cần xem kỹ một nhà xe (tùy UI): app gọi API chi tiết — tên, gói dịch vụ, vài đánh giá gần nhất → '
        'người dùng đọc rồi quay lại chọn.'
    ),
    24: (
        'Luồng «Khuân vác»: sau khi chọn số người/giờ, app gọi API lấy vài báo giá đội khuân vác → người dùng chọn một đội → '
        'giá cộng vào tổng thanh toán.'
    ),
    25: (
        'Màn «Thanh toán / Xác nhận đặt xe»: app gọi API tính chi tiết giá (xe, km, bậc, khuân vác, bảo hiểm, giảm giá, tiền cọc 30%). '
        'Hiện bảng chi tiết. Mỗi khi đổi mã KM hoặc gói → gọi lại để cập nhật số tiền.'
    ),
    26: (
        'Cùng màn thanh toán: người dùng gõ mã giảm giá → «Áp dụng» → API kiểm tra mã còn hiệu lực không và giảm bao nhiêu → '
        'hiện kết quả; nếu hợp lệ thì tính lại tổng tiền (gọi lại API ước tính giá).'
    ),
    27: (
        'Trang chủ: app gọi API lấy banner khuyến mãi (tiêu đề, ảnh) → hiện carousel. Người dùng bấm banner → '
        'nhảy sang màn đặt chuyến hoặc màn app chỉ định.'
    ),
    28: (
        'Tab «Hoạt động» hoặc «Lịch sử đơn»: app gọi API lấy danh sách đơn của người dùng (đang chạy / đã xong / lọc trạng thái) → '
        'hiện từng thẻ đơn. Chạm một đơn → màn theo dõi chuyến.'
    ),
    29: (
        'Khi vào chi tiết/theo dõi một đơn: app có thể gọi API lấy thông tin đầy đủ đơn đó (địa chỉ, giá, trạng thái, nhà xe).'
    ),
    30: (
        'Màn thanh toán: người dùng bấm «Đặt cọc» / «Xác nhận». Trước hết API tạo đơn hàng (trạng thái chờ nhà xe). '
        'Có mã đơn rồi → bước tiếp: API đặt cọc (dòng 38). Thành công cả chuỗi → sang màn theo dõi chuyến. '
        'Đơn từ Pass đồ: gửi kèm mã tin pass để hệ thống liên kết.'
    ),
    31: (
        'Luồng chỉ đặt khuân vác (hoặc thêm khuân vác vào đơn đang có): tương tự tạo đơn nhưng loại «khuân vác» — '
        'sau đó thanh toán và theo dõi.'
    ),
    32: (
        'Khi đơn còn cho phép hủy: người dùng bấm «Hủy đơn» → nhập lý do → API hủy → thẻ đơn chuyển «Đã hủy», '
        'có thể hoàn tiền theo chính sách (backend xử lý).'
    ),
    33: (
        'Màn theo dõi: sau khi tài xế báo hoàn thành, người dùng bấm «Xác nhận đã nhận hàng / hoàn thành» → API xác nhận → '
        'đơn chuyển hoàn tất → gợi ý sang màn đánh giá.'
    ),
    34: (
        'Màn «Theo dõi chuyến»: app gọi API một lần lấy đủ: trạng thái đơn, thông tin tài xế, vị trí trên bản đồ (nếu có), '
        'timeline các bước (đang lấy hàng, đang giao…), nút chat với nhà xe. Kéo refresh → gọi lại.'
    ),
    35: (
        'Cùng màn theo dõi (tùy chọn): app gọi nhẹ API chỉ lấy «còn khoảng X phút» để cập nhật dòng ETA mà không tải cả trang.'
    ),
    36: (
        'Cùng màn theo dõi: ngoài API, app lắng nghe realtime (Supabase) — khi tài xế đổi trạng thái hoặc di chuyển thì '
        'bản đồ và timeline tự cập nhật, không cần người dùng tải lại.'
    ),
    37: (
        'Sau chuyến xong: màn «Đánh giá» → chọn sao, tag (Đúng giờ, Nhiệt tình…), ghi chú → «Gửi». '
        'API lưu đánh giá. Thành công → cảm ơn / màn giới thiệu bạn bè → về lịch sử đơn (đơn đó không hỏi đánh giá nữa).'
    ),
    38: (
        'Ngay sau khi tạo đơn (bước 30): app gọi API tạo thanh toán cọc (~30% tổng tiền) → nhận link PayOS hoặc QR → '
        'mở cổng thanh toán cho người dùng trả. Trả xong (server nhận webhook) → vào theo dõi chuyến.'
    ),
    39: (
        'PayOS gọi thẳng vào server khi người dùng trả tiền xong — app khách hàng không gọi API này. '
        'Người dùng chỉ thấy trạng đơn đổi sau khi quay lại app hoặc nhận thông báo.'
    ),
    40: (
        'Tab «Thanh toán»: phần lịch sử — app gọi API danh sách giao dịch (đặt cọc, hoàn tiền…) kèm mã đơn → '
        'hiện list. Chạm một dòng → chi tiết giao dịch.'
    ),
    41: (
        'Từ lịch sử thanh toán: chạm một giao dịch → app gọi API chi tiết (số tiền, trạng thái, liên kết đơn nào).'
    ),
    42: (
        'Thường do hệ thống tự gọi khi hủy đơn — hoàn % tiền cọc. App có thể chỉ hiển thị «Đã hoàn tiền» sau hủy đơn.'
    ),
    43: (
        '【Khác tab «Tin nhắn» dưới cùng — tab đó là khuyến mãi/thông báo】\n'
        'Chat với nhà xe: từ thẻ đơn đang chạy trên Trang chủ, hoặc Tab Hoạt động, hoặc màn Theo dõi chuyến → nút «Chat» / «Nhắn tin» → '
        '/chat/:conversationId (chat_thread_page). API inbox dùng khi có danh sách hội thoại riêng (hiện app có thể mở thẳng từ conversationId trên đơn).'
    ),
    44: (
        'Trong chat với nhà xe: mở một hội thoại → app gọi API lấy lịch sử tin nhắn (phân trang nếu nhiều).'
    ),
    45: (
        'Trong chat với nhà xe: người dùng gõ tin → «Gửi» → API lưu tin → bubble hiện trong khung chat.'
    ),
    46: (
        'Tab thứ 4 thanh menu (icon Tin nhắn) = messages_tab_page — chỉ thông báo ưu đãi / voucher / hệ thống (comment trong code: Grab-style). '
        'KHÔNG phải chat với tài xế. App gọi mock/API notifications → list card → chạm → /notifications/:id hoặc deep link.'
    ),
    47: (
        'Khi vào app / sau khi đọc thông báo: app gọi API đếm số chưa đọc → hiện badge số trên tab «Tin nhắn».'
    ),
    48: (
        'Chạm một thông báo → app gọi API chi tiết (và thường đánh dấu đã đọc) → màn nội dung đầy đủ + nút hành động (Đặt ngay…).'
    ),
    49: (
        'Đánh dấu đã đọc một thông báo (vuốt hoặc khi mở) → API cập nhật → badge giảm.'
    ),
    50: (
        'Sau khi đăng nhập, app gửi token máy (FCM) lên server để sau này nhận push «Đơn được nhận», «Có tin nhắn»… '
        'Người dùng không thấy bước riêng.'
    ),
    51: (
        'Tab Pass đồ → «Khám phá»: app gọi API lấy tin người khác đăng (lọc từ khóa/danh mục) → lưới thẻ tin. '
        'Chạm tin → màn chi tiết.'
    ),
    52: (
        'Tab Pass đồ → «Tin của tôi»: app gọi API chỉ tin do mình đăng → quản lý, sửa trạng thái, thấy có bao nhiêu người quan tâm.'
    ),
    53: (
        'Màn chi tiết một tin Pass đồ:\n'
        '• Người mua: xem giá, mô tả → «Tôi muốn nhận» → chat; nếu đã chốt giá thì thấy «Đặt xe lấy đồ», chưa chốt thì chờ.\n'
        '• Người bán: thấy «Người quan tâm», vào chat từng khách, «Chốt đơn» / «Huỷ chốt» (nếu khách chưa đặt xe).'
    ),
    54: (
        '«Đăng tin mới»: điền tên món, mô tả, loại, tình trạng, khu vực, giá (0 = cho tặng), ảnh → «Đăng». '
        'API tạo tin + báo phí đăng tin (nếu có) → có thể mở PayOS trả phí → xong thì tin hiện ở «Tin của tôi» / Khám phá.'
    ),
    55: (
        'Ngay sau đăng tin nếu cần trả phí đăng: app gọi API thanh toán phí → mở PayOS giống đặt cọc → trả xong tin mới hiện công khai.'
    ),
    56: (
        'Người bán trên tin của mình: đổi trạng thái (đang mở / đã giữ / ẩn tin…) → API cập nhật → chip trạng thái đổi trên UI.'
    ),
    57: (
        'Người mua trên tin người khác: bấm «Tôi muốn nhận» → API ghi nhận quan tâm → người bán thấy tên trong «Người quan tâm» → '
        'thường mở luôn màn chat với người bán.'
    ),
    58: (
        'Người bán: trên chi tiết tin hoặc inbox chat (không chọn khách cụ thể) → API lấy danh sách khách đã quan tâm, '
        'tin nhắn cuối, số chưa đọc → chạm một khách → chat riêng với khách đó (?buyer= id).'
    ),
    59: (
        'Màn chat Pass đồ (một khách cụ thể): app gọi API lấy toàn bộ tin (người mua / người bán / hệ thống «Đã chốt đơn»). '
        'Người bán mở thread → đánh dấu đã đọc (hết badge).'
    ),
    60: (
        'Cùng màn chat: gõ tin hoặc «Đề nghị giá» → Gửi → API lưu → hiện bubble. Chốt đơn không gửi bằng tin thường mà dùng API chốt (dòng 61).'
    ),
    61: (
        'Người bán trong chat: menu «Chốt đơn» → có thể nhập giá thỏa thuận (hoặc dùng giá đăng) → API chốt. '
        'Khách thấy tin hệ thống «Đã chốt đơn… có thể đặt xe» và trên chi tiết tin hiện nút «Đặt xe lấy đồ».'
    ),
    62: (
        'Người bán đổi ý trước khi khách đặt xe: «Huỷ chốt đơn» → API mở lại thương lượng → khách mất nút đặt xe đến khi chốt lại. '
        'Nếu khách đã đặt xe rồi: app không cho huỷ chốt, báo «Khách đã đặt xe».'
    ),
    63: (
        'Người mua: sau chốt đơn, bấm «Đặt xe lấy đồ» trên chi tiết tin → BookingFlowCubit.startPassItemDelivery → /booking/location '
        '(tiêu đề «Chở đồ về nhà»). Nhập địa chỉ nhận → «Tiếp tục» → app gọi markTransportBooked (mock) RỒI push /booking/packages → '
        'partners → insurance → payment. Khóa huỷ chốt cho seller sau bước này.'
    ),
    64: (
        'Tùy chọn trên tin Pass: app gọi vài báo giá vận chuyển nhanh — có thể bỏ, dùng luồng chọn nhà xe bình thường.'
    ),
    65: (
        'Trước khi đăng tin Pass hoặc đổi avatar: chọn ảnh trên máy → API upload → nhận link ảnh → gắn vào form đăng tin / hồ sơ.'
    ),
    66: (
        'Sau khi gửi đánh giá chuyến đi xong: app có thể gọi API lấy mã giới thiệu bạn bè + số thưởng → hiện popup chia sẻ.'
    ),
}
