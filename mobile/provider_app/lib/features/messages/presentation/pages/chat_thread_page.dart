import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/chat_models.dart';
import '../providers/messages_providers.dart';

class ChatThreadPage extends ConsumerStatefulWidget {
  const ChatThreadPage({super.key, required this.threadId});

  final String threadId;

  @override
  ConsumerState<ChatThreadPage> createState() => _ChatThreadPageState();
}

class _ChatThreadPageState extends ConsumerState<ChatThreadPage> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;

  static const _quickReplies = [
    'Em đang trên đường',
    'Gọi em khi xuống nhé',
    'Đợi em 5 phút ạ',
  ];

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  ProviderChatThread? _findThread(List<ProviderChatThread> threads) {
    try {
      return threads.firstWhere((t) => t.id == widget.threadId);
    } catch (_) {
      return null;
    }
  }

  Future<void> _send(ProviderChatThread thread, [String? preset]) async {
    if (!thread.canSendMessages || _sending) return;
    final text = (preset ?? _input.text).trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    _input.clear();
    try {
      await ref.read(providerChatRepositoryProvider).sendMessage(
            threadId: widget.threadId,
            content: text,
            canSend: thread.canSendMessages,
          );
      ref.invalidate(providerChatMessagesProvider(widget.threadId));
      ref.invalidate(providerChatThreadsProvider);
      _scrollToEnd();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final threadsAsync = ref.watch(providerChatThreadsProvider);
    final messagesAsync = ref.watch(providerChatMessagesProvider(widget.threadId));
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        final thread = threadsAsync.asData?.value != null
            ? _findThread(threadsAsync.asData!.value)
            : null;
        final readOnly = thread != null && !thread.canSendMessages;

        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
              onPressed: () => context.pop(),
            ),
            title: thread == null
                ? Text('Chat', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700))
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        thread.customerName,
                        style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                      Text(
                        '#${thread.orderNumber} · ${thread.orderStatus}',
                        style: TextStyle(color: c.onSurfaceMuted, fontSize: 12),
                      ),
                    ],
                  ),
            actions: [
              if (thread != null)
                IconButton(
                  icon: Icon(LucideIcons.package, color: c.onSurface),
                  onPressed: () => context.push('/orders/${thread.orderId}'),
                ),
            ],
          ),
          body: Column(
            children: [
              if (readOnly)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  color: c.chipBg,
                  child: Row(
                    children: [
                      Icon(LucideIcons.lock, size: 16, color: c.onSurfaceMuted),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Đơn đã kết thúc — chỉ xem lại tin nhắn, không gửi mới.',
                          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: messagesAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('$e', style: TextStyle(color: c.onSurface))),
                  data: (messages) {
                    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToEnd());
                    return ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      itemCount: messages.length,
                      itemBuilder: (_, i) => _Bubble(message: messages[i], theme: theme, c: c),
                    );
                  },
                ),
              ),
              if (!readOnly && thread != null) ...[
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _quickReplies.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) {
                      final q = _quickReplies[i];
                      return ActionChip(
                        label: Text(q, style: TextStyle(fontSize: 12, color: c.primary)),
                        backgroundColor: c.iconBgSecondary,
                        side: BorderSide(color: c.border),
                        onPressed: _sending ? null : () => _send(thread, q),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: EdgeInsets.fromLTRB(12, 4, 12, 12 + MediaQuery.paddingOf(context).bottom),
                  child: Row(
                    children: [
                      Expanded(
                        child: ShadInput(
                          controller: _input,
                          placeholder: const Text('Nhắn tin cho khách...'),
                          onSubmitted: (_) => _send(thread),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ShadButton(
                        onPressed: _sending ? null : () => _send(thread),
                        child: _sending
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(LucideIcons.send, size: 18),
                      ),
                    ],
                  ),
                ),
              ] else if (readOnly)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: ShadButton.outline(
                    width: double.infinity,
                    onPressed: () => context.pop(),
                    child: const Text('Quay lại'),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.theme, required this.c});

  final ProviderChatMessage message;
  final ShadThemeData theme;
  final UniMoveColors c;

  @override
  Widget build(BuildContext context) {
    if (message.isSystem) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: c.chipBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              message.content,
              textAlign: TextAlign.center,
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.3),
            ),
          ),
        ),
      );
    }

    final mine = message.isMine;
    final bg = mine ? c.primary : c.surface;
    final fg = mine ? Colors.white : c.onSurface;

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(mine ? 16 : 4),
            bottomRight: Radius.circular(mine ? 4 : 16),
          ),
          border: mine ? null : Border.all(color: c.border),
          boxShadow: [
            if (!mine)
              BoxShadow(
                color: c.navBarShadow.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Text(message.content, style: TextStyle(color: fg, height: 1.35, fontSize: 14)),
      ),
    );
  }
}
