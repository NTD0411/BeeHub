import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/auth/auth_token_storage.dart';
import '../../../../core/mock/mock_customer_data.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../data/chat_repository.dart';
import '../../domain/chat_models.dart';

/// Khung chat kiểu Grab — bubble xám (tài xế) / xanh (bạn).
class ChatThreadBody extends StatefulWidget {
  const ChatThreadBody({
    super.key,
    required this.conversationId,
    this.readOnly = false,
    this.readOnlyHint,
  });

  final String conversationId;
  final bool readOnly;
  final String? readOnlyHint;

  @override
  State<ChatThreadBody> createState() => _ChatThreadBodyState();
}

class _ChatThreadBodyState extends State<ChatThreadBody> {
  final _repo = ChatRepository();
  final _input = TextEditingController();
  final _scroll = ScrollController();
  List<ChatMessage> _messages = [];
  bool _loading = true;

  static const _quickReplies = [
    'Tôi đang xuống',
    'Bạn đợi 2 phút nhé',
    'Gọi cho tôi khi đến',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final msgs = await _repo.fetchMessages(widget.conversationId);
    if (mounted) {
      setState(() {
        _messages = msgs;
        _loading = false;
      });
    }
    _scrollToEnd();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  Future<void> _send([String? preset]) async {
    if (widget.readOnly) return;
    final text = (preset ?? _input.text).trim();
    if (text.isEmpty) return;
    _input.clear();
    final user = await AuthTokenStorage.instance.loadUser();
    final senderId = user?['id'] as String? ?? MockCustomerData.userId;
    final msg = await _repo.sendMessage(
      conversationId: widget.conversationId,
      senderId: senderId,
      content: text,
    );
    if (!mounted) return;
    setState(() => _messages = [..._messages, msg]);
    _scrollToEnd();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loading) {
      return Center(child: CircularProgressIndicator(color: c.primary));
    }

    final peerBubble = isDark ? c.surface : const Color(0xFFF3F4F6);
    final bg = isDark ? c.background : const Color(0xFFFAFAFA);

    return ColoredBox(
      color: bg,
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 8.h),
              itemCount: _messages.length + 2,
              itemBuilder: (context, i) {
                if (i == 0) {
                  return Padding(
                    padding: EdgeInsets.only(bottom: 12.h),
                    child: Text(
                      'Tin nhắn được mã hóa. Không chia sẻ thông tin cá nhân qua chat.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted, height: 1.35),
                    ),
                  );
                }
                if (i == 1) {
                  return Center(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: 16.h),
                      child: Text(
                        'Hôm nay',
                        style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                      ),
                    ),
                  );
                }
                final m = _messages[i - 2];
                if (m.messageType == ChatMessageType.orderUpdate) {
                  return _systemLine(m.content, c);
                }
                return _bubble(m, c, peerBubble);
              },
            ),
          ),
          if (widget.readOnly)
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              color: c.surfaceTint,
              child: Text(
                widget.readOnlyHint ?? 'Đơn đã kết thúc — chỉ xem lại tin nhắn.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
              ),
            )
          else ...[
            _quickReplyRow(c),
            _composer(c),
          ],
        ],
      ),
    );
  }

  Widget _bubble(ChatMessage m, UniMoveColors c, Color peerBubble) {
    final mine = m.isMine;
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Column(
        crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Align(
            alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              constraints: BoxConstraints(maxWidth: 260.w),
              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: mine ? c.primary : peerBubble,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(18.r),
                  topRight: Radius.circular(18.r),
                  bottomLeft: Radius.circular(mine ? 18.r : 4.r),
                  bottomRight: Radius.circular(mine ? 4.r : 18.r),
                ),
              ),
              child: Text(
                m.content,
                style: TextStyle(
                  color: mine ? Colors.white : c.onSurface,
                  fontSize: 15.sp,
                  height: 1.35,
                ),
              ),
            ),
          ),
          SizedBox(height: 4.h),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 4.w),
            child: Text(
              mine ? '${_time(m.createdAt)} · ${m.isRead ? 'Đã xem' : 'Đã gửi'}' : _time(m.createdAt),
              style: TextStyle(fontSize: 10.sp, color: c.onSurfaceMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _systemLine(String text, UniMoveColors c) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8.h),
      child: Center(
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
          decoration: BoxDecoration(
            color: c.surfaceTint,
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
          ),
        ),
      ),
    );
  }

  Widget _quickReplyRow(UniMoveColors c) {
    return SizedBox(
      height: 40.h,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 12.w),
        itemCount: _quickReplies.length,
        separatorBuilder: (_, __) => SizedBox(width: 8.w),
        itemBuilder: (_, i) {
          final label = _quickReplies[i];
          return ActionChip(
            label: Text(label, style: TextStyle(fontSize: 12.sp)),
            backgroundColor: c.surface,
            side: BorderSide(color: c.border),
            onPressed: () => _send(label),
          );
        },
      ),
    );
  }

  Widget _composer(UniMoveColors c) {
    return Material(
      color: c.surface,
      elevation: 8,
      shadowColor: c.navBarShadow,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(12.w, 10.h, 12.w, 10.h),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: TextField(
                  controller: _input,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(
                    hintText: 'Nhắn tin với tài xế...',
                    hintStyle: TextStyle(color: c.onSurfaceMuted, fontSize: 14.sp),
                    filled: true,
                    fillColor: c.surfaceTint,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24.r),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 8.w),
              Material(
                color: c.primary,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: () => _send(),
                  customBorder: const CircleBorder(),
                  child: SizedBox(
                    width: 44.w,
                    height: 44.w,
                    child: Icon(Icons.send_rounded, color: Colors.white, size: 20.sp),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _time(DateTime dt) {
    final hour = dt.hour;
    final h = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    final ap = hour >= 12 ? 'PM' : 'AM';
    return '$h:${dt.minute.toString().padLeft(2, '0')} $ap';
  }
}

/// Header chat kiểu Grab — gọn, nền trắng, gọi điện.
class ChatHeaderBar extends StatelessWidget {
  const ChatHeaderBar({
    super.key,
    required this.conversation,
    this.showBack = false,
    this.onBack,
  });

  final ChatConversation conversation;
  final bool showBack;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Material(
      color: c.surface,
      child: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(4.w, 4.h, 8.w, 10.h),
              child: Row(
                children: [
                  if (showBack)
                    IconButton(
                      icon: Icon(Icons.arrow_back, size: 24.sp, color: c.onSurface),
                      onPressed: onBack,
                    )
                  else
                    SizedBox(width: 8.w),
                  CircleAvatar(
                    radius: 20.r,
                    backgroundImage: CachedNetworkImageProvider(conversation.providerAvatarUrl),
                  ),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          conversation.providerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16.sp, color: c.onSurface),
                        ),
                        Text(
                          conversation.isOnline ? 'Tài xế · Đang trực tuyến' : 'Tài xế',
                          style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.phone_in_talk_outlined, color: c.primary, size: 24.sp),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),
          Divider(height: 1, color: c.border),
        ],
      ),
    );
  }
}
