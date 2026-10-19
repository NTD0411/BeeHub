import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/auth/auth_token_storage.dart';
import '../../../../core/mock/mock_auth_session.dart';
import '../../../../core/mock/mock_customer_data.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/theme_toggle_tile.dart';
import '../../../../core/widgets/uni_surface_card.dart';
import '../../../auth/data/customer_auth_repository.dart';

/// Hồ sơ — `GET /api/customers/me` (profiles + customer_profiles).
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _repo = CustomerAuthRepository();

  CustomerProfile? _profile;
  bool _loading = true;
  bool _signingOut = false;
  bool _uploadingAvatar = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (await MockAuthSession.isSignedIn()) {
      if (!mounted) return;
      setState(() {
        _profile = CustomerProfile(
          id: 'mock',
          email: MockCustomerData.email,
          fullName: MockCustomerData.fullName,
          phone: MockCustomerData.phone,
          avatarUrl: MockCustomerData.avatarUrl,
          studentId: MockCustomerData.studentId,
          university: MockCustomerData.university,
          status: 'active',
          gender: 'male',
          loyaltyPoints: MockCustomerData.loyaltyPoints,
          totalOrders: MockCustomerData.totalOrders,
          totalSpent: MockCustomerData.totalSpent.toDouble(),
        );
        _loading = false;
      });
      return;
    }

    final stored = await AuthTokenStorage.instance.loadUser();
    if (stored != null && mounted) {
      setState(() => _profile = CustomerProfile.fromJson(Map<String, dynamic>.from(stored)));
    }

    try {
      final user = await _repo.fetchMe();
      if (mounted) setState(() => _profile = user);
    } catch (_) {
      // giữ dữ liệu cache nếu API lỗi
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickAndUploadAvatar() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 85,
    );
    if (picked == null) return;

    setState(() => _uploadingAvatar = true);
    try {
      final url = await _repo.uploadAvatar(filePath: picked.path);
      if (!mounted) return;
      setState(() => _profile = _profile?.copyWith(avatarUrl: url));
      ShadToaster.of(context).show(
        const ShadToast(title: Text('Đã cập nhật ảnh đại diện')),
      );
    } on ApiException catch (e) {
      if (mounted) {
        ShadToaster.of(context).show(
          ShadToast.destructive(
            title: const Text('Lỗi tải ảnh'),
            description: Text(e.message),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _signOut() async {
    setState(() => _signingOut = true);
    try {
      await _repo.signOut();
      if (mounted) context.go('/login');
    } finally {
      if (mounted) setState(() => _signingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadToaster(
      child: Scaffold(
        backgroundColor: c.background,
        body: SafeArea(
          child: _loading && _profile == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.primary,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 32.h),
                    children: _stagger(c),
                  ),
                ),
        ),
      ),
    );
  }

  List<Widget> _stagger(UniMoveColors c) {
    final items = <Widget>[
      _header(c),
      SizedBox(height: 16.h),
      _identityCard(c),
      SizedBox(height: 16.h),
      _statsRow(c),
      SizedBox(height: 16.h),
      _studentSection(c),
      SizedBox(height: 16.h),
      _personalSection(c),
      SizedBox(height: 16.h),
      _accountSection(c),
      SizedBox(height: 16.h),
      const ThemeToggleTile(),
      SizedBox(height: 24.h),
      _signOutButton(),
    ];

    return [
      for (var i = 0; i < items.length; i++)
        items[i]
            .animate()
            .fadeIn(duration: 420.ms, delay: (60 * i).ms, curve: Curves.easeOut)
            .slideY(begin: 0.08, end: 0, duration: 460.ms, delay: (60 * i).ms, curve: Curves.easeOutCubic),
    ];
  }

  Widget _header(UniMoveColors c) {
    return Row(
      children: [
        if (context.canPop())
          IconButton(
            onPressed: () => context.pop(),
            icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        if (context.canPop()) SizedBox(width: 8.w),
        Expanded(
          child: Text(
            'Hồ sơ',
            style: TextStyle(fontSize: 24.sp, fontWeight: FontWeight.w800, color: c.onSurface),
          ),
        ),
        ShadButton.outline(
          size: ShadButtonSize.sm,
          leading: const Icon(LucideIcons.pencil, size: 15),
          onPressed: () async {
            await context.push('/profile/edit', extra: _profile);
            if (mounted) _load();
          },
          child: const Text('Chỉnh sửa'),
        ),
      ],
    );
  }

  Widget _identityCard(UniMoveColors c) {
    final p = _profile;
    final active = (p?.status ?? 'active') == 'active';
    return UniSurfaceCard(
      child: Column(
        children: [
          Row(
            children: [
              _avatar(p, c),
              SizedBox(width: 16.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p?.fullName.isNotEmpty == true ? p!.fullName : 'Sinh viên UniMove',
                      style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                    ),
                    SizedBox(height: 4.h),
                    Row(
                      children: [
                        Icon(LucideIcons.mail, size: 13, color: c.onSurfaceMuted),
                        SizedBox(width: 5.w),
                        Expanded(
                          child: Text(
                            p?.email ?? '',
                            style: TextStyle(fontSize: 12.5.sp, color: c.onSurfaceMuted),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8.h),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                      decoration: BoxDecoration(
                        color: (active ? AppColors.primary : c.onSurfaceMuted).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            active ? LucideIcons.circleCheck : LucideIcons.circleDashed,
                            size: 13,
                            color: active ? AppColors.primary : c.onSurfaceMuted,
                          ),
                          SizedBox(width: 5.w),
                          Text(
                            active ? 'Đang hoạt động' : (p?.status ?? '—'),
                            style: TextStyle(
                              fontSize: 11.5.sp,
                              fontWeight: FontWeight.w700,
                              color: active ? AppColors.primary : c.onSurfaceMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (p?.createdAt != null) ...[
            SizedBox(height: 14.h),
            Divider(height: 1, color: c.border),
            SizedBox(height: 10.h),
            Row(
              children: [
                Icon(LucideIcons.calendarClock, size: 14, color: c.onSurfaceMuted),
                SizedBox(width: 6.w),
                Text(
                  'Thành viên từ ${_formatDate(p!.createdAt!)}',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _avatar(CustomerProfile? p, UniMoveColors c) {
    final url = p?.avatarUrl;
    final hasUrl = url != null && url.isNotEmpty;
    return GestureDetector(
      onTap: _uploadingAvatar ? null : _pickAndUploadAvatar,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
            ),
            child: CircleAvatar(
              radius: 36.r,
              backgroundColor: AppColors.primary.withValues(alpha: 0.15),
              backgroundImage: hasUrl ? CachedNetworkImageProvider(url) : null,
              child: !hasUrl
                  ? Text(
                      p?.fullName.isNotEmpty == true ? p!.fullName[0].toUpperCase() : '?',
                      style: TextStyle(fontSize: 26.sp, fontWeight: FontWeight.bold, color: AppColors.primary),
                    )
                  : null,
            ),
          ),
          Positioned(
            right: -2,
            bottom: -2,
            child: Container(
              padding: EdgeInsets.all(6.r),
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(color: c.surface, width: 2),
              ),
              child: _uploadingAvatar
                  ? SizedBox(
                      width: 12.w,
                      height: 12.w,
                      child: const CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Icon(LucideIcons.camera, size: 13.r, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsRow(UniMoveColors c) {
    final p = _profile;
    return Row(
      children: [
        _statCard(c, LucideIcons.star, 'Điểm tích luỹ', '${p?.loyaltyPoints ?? 0}'),
        SizedBox(width: 12.w),
        _statCard(c, LucideIcons.package, 'Đơn hàng', '${p?.totalOrders ?? 0}'),
        SizedBox(width: 12.w),
        _statCard(c, LucideIcons.receipt, 'Đã chi', _formatCurrency(p?.totalSpent ?? 0)),
      ],
    );
  }

  Widget _statCard(UniMoveColors c, IconData icon, String label, String value) {
    return Expanded(
      child: UniSurfaceCard(
        padding: EdgeInsets.symmetric(vertical: 14.h, horizontal: 8.w),
        child: Column(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            SizedBox(height: 8.h),
            FittedBox(
              child: Text(
                value,
                style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w800, color: c.onSurface),
              ),
            ),
            SizedBox(height: 2.h),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10.5.sp, color: c.onSurfaceMuted),
            ),
          ],
        ),
      ),
    );
  }

  Widget _studentSection(UniMoveColors c) {
    final p = _profile;
    return _section(c, 'Thông tin sinh viên', [
      _infoRow(c, LucideIcons.idCard, 'Mã số sinh viên', p?.studentId),
      _infoRow(c, LucideIcons.graduationCap, 'Trường', p?.university),
      _infoRow(c, LucideIcons.gift, 'Mã giới thiệu', p?.referralCode),
    ]);
  }

  Widget _personalSection(UniMoveColors c) {
    final p = _profile;
    return _section(c, 'Thông tin cá nhân', [
      _infoRow(c, LucideIcons.phone, 'Số điện thoại', p?.phone),
      _infoRow(c, LucideIcons.user, 'Giới tính', _genderLabel(p?.gender)),
      _infoRow(c, LucideIcons.cake, 'Ngày sinh', p?.dateOfBirth == null ? null : _formatDate(p!.dateOfBirth!)),
      _infoRow(c, LucideIcons.creditCard, 'Thanh toán ưa dùng', _paymentLabel(p?.preferredPaymentMethod)),
    ]);
  }

  Widget _accountSection(UniMoveColors c) {
    return _section(c, 'Tài khoản', [
      _tappableRow(c, LucideIcons.lockKeyhole, 'Đổi mật khẩu', () => context.push('/change-password')),
    ]);
  }

  Widget _section(UniMoveColors c, String title, List<Widget> rows) {
    final children = <Widget>[];
    for (var i = 0; i < rows.length; i++) {
      children.add(rows[i]);
      if (i != rows.length - 1) {
        children.add(Divider(height: 1, color: c.border.withValues(alpha: 0.6)));
      }
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: 4.w, bottom: 8.h),
          child: Text(
            title,
            style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
          ),
        ),
        UniSurfaceCard(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 4.h),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _infoRow(UniMoveColors c, IconData icon, String label, String? value) {
    final shown = (value == null || value.isEmpty) ? 'Chưa cập nhật' : value;
    final muted = value == null || value.isEmpty;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 12.h),
      child: Row(
        children: [
          Icon(icon, size: 18, color: c.onSurfaceMuted),
          SizedBox(width: 12.w),
          Text(label, style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted)),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(
              shown,
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13.sp,
                fontWeight: muted ? FontWeight.w400 : FontWeight.w600,
                color: muted ? c.onSurfaceMuted.withValues(alpha: 0.7) : c.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tappableRow(UniMoveColors c, IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8.r),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 12.h),
        child: Row(
          children: [
            Icon(icon, size: 18, color: c.onSurfaceMuted),
            SizedBox(width: 12.w),
            Expanded(
              child: Text(label, style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.onSurface)),
            ),
            Icon(LucideIcons.chevronRight, size: 18, color: c.onSurfaceMuted),
          ],
        ),
      ),
    );
  }

  Widget _signOutButton() {
    return ShadButton.destructive(
      width: double.infinity,
      onPressed: _signingOut ? null : _signOut,
      leading: _signingOut
          ? SizedBox(width: 18.w, height: 18.w, child: const CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Icon(LucideIcons.logOut, size: 18),
      child: Text(_signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'),
    );
  }

  // ---- helpers ----

  String _genderLabel(String? g) {
    switch (g) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return '';
    }
  }

  String _paymentLabel(String? m) {
    switch (m) {
      case 'cash':
        return 'Tiền mặt';
      case 'momo':
        return 'MoMo';
      case 'payos':
        return 'PayOS';
      case 'wallet':
        return 'Chuyển khoản';
      default:
        return m ?? '';
    }
  }

  String _formatDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    return '$dd/$mm/${d.year}';
  }

  String _formatCurrency(double value) {
    final s = value.round().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf.toString()}₫';
  }
}
