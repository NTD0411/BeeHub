import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../data/notifications_repository.dart';
import '../../domain/notification_models.dart';
import '../widgets/promo_date_separator.dart';
import '../widgets/promo_message_card.dart';

/// Kênh ưu đãi (Grab-style) hoặc chi tiết thông báo hệ thống.
class NotificationDetailPage extends StatefulWidget {
  const NotificationDetailPage({
    super.key,
    required this.notificationId,
  });

  final String notificationId;

  @override
  State<NotificationDetailPage> createState() => _NotificationDetailPageState();
}

class _NotificationDetailPageState extends State<NotificationDetailPage> {
  final _repo = NotificationsRepository();
  AppNotification? _focused;
  List<AppNotification> _promotions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    await _repo.markAsRead(widget.notificationId);
    final focused = await _repo.fetchById(widget.notificationId);
    final promos = await _repo.fetchPromotions();
    if (!mounted) return;
    setState(() {
      _focused = focused;
      _promotions = promos;
      _loading = false;
    });
  }

  Color _channelBackground(UniMoveColors c, BuildContext context) {
    return c.isLight(context) ? const Color(0xFFF3F4F6) : c.background;
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final focused = _focused;
    final isPromo = focused?.type == AppNotificationType.promotion;

    return Scaffold(
      backgroundColor: _channelBackground(c, context),
      appBar: AppBar(
        backgroundColor: c.surface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: isPromo
            ? const _PromoChannelAppBarTitle()
            : Text(
                'Thông báo',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: c.primary))
          : focused == null
              ? Center(
                  child: Text('Không tìm thấy thông báo', style: TextStyle(color: c.onSurfaceMuted)),
                )
              : Column(
                  children: [
                    Expanded(
                      child: isPromo
                          ? _PromoChannelFeed(promotions: _promotions, focused: focused)
                          : _SystemMessageBody(notification: focused),
                    ),
                    if (isPromo) _ChannelFooter(colors: c),
                  ],
                ),
    );
  }
}

class _PromoChannelAppBarTitle extends StatelessWidget {
  const _PromoChannelAppBarTitle();

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Row(
      children: [
        CircleAvatar(
          radius: 18.r,
          backgroundColor: AppColors.accentOrange.withValues(alpha: 0.2),
          child: Icon(Icons.local_offer_rounded, color: AppColors.accentOrange, size: 20.sp),
        ),
        SizedBox(width: 10.w),
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  'Ưu đãi UniMove',
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w700,
                    color: c.onSurface,
                  ),
                ),
              ),
              SizedBox(width: 4.w),
              Icon(Icons.verified, color: AppColors.primary, size: 18.sp),
            ],
          ),
        ),
      ],
    );
  }
}

class _PromoChannelFeed extends StatelessWidget {
  const _PromoChannelFeed({required this.promotions, required this.focused});

  final List<AppNotification> promotions;
  final AppNotification focused;

  @override
  Widget build(BuildContext context) {
    final items = promotions.isNotEmpty ? promotions : [focused];
    final sorted = List<AppNotification>.from(items)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final children = <Widget>[];
    DateTime? lastDay;

    for (final n in sorted) {
      final day = DateTime(n.createdAt.year, n.createdAt.month, n.createdAt.day);
      if (lastDay == null || lastDay != day) {
        children.add(PromoDateSeparator(date: n.createdAt));
        lastDay = day;
      }
      children.add(
        PromoMessageCard(
          notification: n,
          onCtaPressed: () {
            if (n.actionRoute != null) {
              AppRouter.router.push(n.actionRoute!);
            }
          },
        ),
      );
    }

    return ListView(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      padding: EdgeInsets.fromLTRB(12.w, 4.h, 12.w, 8.h),
      children: children,
    );
  }
}

class _SystemMessageBody extends StatelessWidget {
  const _SystemMessageBody({required this.notification});

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final n = notification;

    return ListView(
      padding: EdgeInsets.all(16.w),
      children: [
        Container(
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(14.r),
            border: Border.all(color: c.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(n.title, style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w700, color: c.onSurface)),
              SizedBox(height: 10.h),
              Text(n.body, style: TextStyle(fontSize: 15.sp, height: 1.5, color: c.onSurfaceMuted)),
            ],
          ),
        ),
      ],
    );
  }
}

class _ChannelFooter extends StatelessWidget {
  const _ChannelFooter({required this.colors});

  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 14.h),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: Text.rich(
        TextSpan(
          style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, height: 1.4),
          children: [
            const TextSpan(text: 'Chỉ '),
            TextSpan(
              text: 'UniMove',
              style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            const TextSpan(text: ' mới có thể gửi tin nhắn.'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
