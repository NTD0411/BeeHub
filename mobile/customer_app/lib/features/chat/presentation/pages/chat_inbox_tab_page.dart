import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../data/chat_repository.dart';
import '../../domain/chat_models.dart';
import '../widgets/chat_empty_state.dart';

/// Tab Tin nhắn — danh sách cuộc trò chuyện (Grab-style inbox).
class ChatInboxTabPage extends StatefulWidget {
  const ChatInboxTabPage({super.key});

  @override
  State<ChatInboxTabPage> createState() => _ChatInboxTabPageState();
}

class _ChatInboxTabPageState extends State<ChatInboxTabPage> {
  final _repo = ChatRepository();
  List<ChatInboxEntry> _inbox = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final inbox = await _repo.fetchInbox();
    if (mounted) {
      setState(() {
        _inbox = inbox;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    if (_loading) {
      return Center(child: CircularProgressIndicator(color: c.primary));
    }

    if (_inbox.isEmpty) {
      return const ChatEmptyState(variant: ChatEmptyVariant.noActiveOrder);
    }

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 8.h),
            child: Text(
              'Tin nhắn',
              style: theme.textTheme.h2.copyWith(fontWeight: FontWeight.w800),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: c.primary,
              onRefresh: _load,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: EdgeInsets.fromLTRB(12.w, 0, 12.w, 120.h),
                itemCount: _inbox.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: c.glassBorder),
                itemBuilder: (context, i) {
                  final entry = _inbox[i];
                  return _ChatInboxTile(
                    entry: entry,
                    onTap: () => context.push('/chat/${entry.conversation.id}'),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatInboxTile extends StatelessWidget {
  const _ChatInboxTile({required this.entry, required this.onTap});

  final ChatInboxEntry entry;
  final VoidCallback onTap;

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (now.difference(dt).inDays == 0) {
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (now.difference(dt).inDays < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[dt.weekday % 7];
    }
    return '${dt.day}/${dt.month}';
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final conv = entry.conversation;
    final muted = !entry.isActive;
    final titleColor = muted ? c.onSurfaceMuted : c.onSurface;
    final subtitleColor = muted ? c.onSurfaceMuted.withValues(alpha: 0.7) : c.onSurfaceMuted;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 14.h),
          child: Row(
            children: [
              Opacity(
                opacity: muted ? 0.45 : 1,
                child: CircleAvatar(
                  radius: 26.r,
                  backgroundColor: c.surfaceTint,
                  backgroundImage: conv.providerAvatarUrl.isNotEmpty
                      ? CachedNetworkImageProvider(conv.providerAvatarUrl)
                      : null,
                  child: conv.providerAvatarUrl.isEmpty
                      ? Icon(Icons.person, color: c.primary)
                      : null,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${conv.providerName} · #${conv.orderNumber}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                        color: titleColor,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      conv.lastMessagePreview,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.sp, color: subtitleColor),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 8.w),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatTime(conv.lastMessageAt),
                    style: TextStyle(fontSize: 12.sp, color: subtitleColor),
                  ),
                  if (conv.unreadCount > 0 && entry.isActive) ...[
                    SizedBox(height: 6.h),
                    Container(
                      constraints: BoxConstraints(minWidth: 20.w),
                      height: 20.w,
                      alignment: Alignment.center,
                      padding: EdgeInsets.symmetric(horizontal: 6.w),
                      decoration: BoxDecoration(
                        color: c.primary,
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      child: Text(
                        '${conv.unreadCount}',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
