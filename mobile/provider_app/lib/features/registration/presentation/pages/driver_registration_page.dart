import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/auth/auth_token_storage.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';

enum _VehicleType { motorbike, pickup, truck }

class DriverRegistrationPage extends StatefulWidget {
  const DriverRegistrationPage({super.key});

  @override
  State<DriverRegistrationPage> createState() => _DriverRegistrationPageState();
}

class _DriverRegistrationPageState extends State<DriverRegistrationPage> {
  static const _stepLabels = ['Thông tin cá nhân', 'Chi tiết phương tiện', 'Tải lên hồ sơ', 'Hoàn tất'];

  int _step = 0;

  // Step 1
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();

  // Step 2
  _VehicleType? _vehicle;
  final _plateCtrl = TextEditingController();
  bool _vehiclePhoto = false;

  // Step 3
  bool _idFront = false;
  bool _licenseFront = false;
  bool _licenseBack = false;
  bool _registration = false;

  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _plateCtrl.dispose();
    super.dispose();
  }

  bool get _isLastInputStep => _step == 2;

  void _next() {
    setState(() => _error = null);
    if (_step == 0) {
      if (_nameCtrl.text.trim().isEmpty || _phoneCtrl.text.trim().isEmpty) {
        setState(() => _error = 'Vui lòng nhập họ tên và số điện thoại.');
        return;
      }
    } else if (_step == 1) {
      if (_vehicle == null) {
        setState(() => _error = 'Vui lòng chọn loại xe.');
        return;
      }
      if (_plateCtrl.text.trim().isEmpty) {
        setState(() => _error = 'Vui lòng nhập biển số xe.');
        return;
      }
    } else if (_step == 2) {
      if (!_idFront || !_licenseFront || !_licenseBack) {
        setState(() => _error = 'Cần tải lên CCCD và bằng lái (2 mặt).');
        return;
      }
    }
    setState(() => _step += 1);
  }

  void _back() {
    if (_step == 0) {
      context.pop();
    } else {
      setState(() {
        _error = null;
        _step -= 1;
      });
    }
  }

  void _goHome() {
    final hasSession = AuthTokenStorage.instance.cachedToken?.isNotEmpty == true;
    context.go(hasSession ? '/home' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              const DarkGlassBackground(variant: DarkGlassVariant.subtle),
              SafeArea(
                child: _step == 3
                    ? _PendingView(onCheck: _onCheckStatus, onHome: _goHome)
                    : Column(
                        children: [
                          _header(theme, c),
                          _progress(theme, c),
                          Expanded(
                            child: ListView(
                              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                              children: [
                                if (_step == 0) ..._personalStep(theme, c),
                                if (_step == 1) ..._vehicleStep(theme, c),
                                if (_step == 2) ..._documentsStep(theme, c),
                                if (_error != null) ...[
                                  const SizedBox(height: 16),
                                  _errorBox(theme, c, _error!),
                                ],
                              ],
                            ),
                          ),
                          _bottomBar(theme, c),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _header(ShadThemeData theme, UniMoveColors c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 6, 16, 0),
      child: Row(
        children: [
          ShadIconButton.ghost(
            icon: Icon(LucideIcons.arrowLeft, size: 20, color: c.onSurface),
            onPressed: _back,
          ),
          const SizedBox(width: 4),
          Text(
            'Đăng ký tài xế',
            style: theme.textTheme.h4.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
          ),
        ],
      ),
    );
  }

  void _onCheckStatus() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Hồ sơ đang được xét duyệt (24–48 giờ)')),
    );
  }

  // ---------- Progress ----------
  Widget _progress(ShadThemeData theme, UniMoveColors c) {
    final pct = (_step + 1) / 4;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'BƯỚC ${_step + 1} TRÊN 4',
                style: theme.textTheme.small.copyWith(
                  color: c.onSurfaceMuted,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
              const Spacer(),
              Text(
                '${(pct * 100).round()}% Hoàn tất',
                style: theme.textTheme.small.copyWith(color: c.primaryLight, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _stepLabels[_step],
            style: theme.textTheme.h3.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 6,
              backgroundColor: c.border,
              valueColor: AlwaysStoppedAnimation(c.primary),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- Step 1: personal ----------
  List<Widget> _personalStep(ShadThemeData theme, UniMoveColors c) {
    return [
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [c.primary, c.primaryLight],
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Bắt đầu hành trình của bạn',
                      style: theme.textTheme.p.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(
                    'Cung cấp thông tin cơ bản để chúng tôi xác thực hồ sơ tài xế.',
                    style: theme.textTheme.small.copyWith(color: Colors.white70, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(LucideIcons.contact, color: Colors.white, size: 28),
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      _field(theme, c, 'Họ và tên', _nameCtrl, 'Nguyễn Văn A', LucideIcons.user),
      const SizedBox(height: 16),
      _field(theme, c, 'Số điện thoại', _phoneCtrl, '0901 234 567', LucideIcons.phone,
          keyboard: TextInputType.phone),
      const SizedBox(height: 16),
      _field(theme, c, 'Địa chỉ Email', _emailCtrl, 'email@vi-du.com', LucideIcons.mail,
          keyboard: TextInputType.emailAddress),
      const SizedBox(height: 16),
      _field(theme, c, 'Địa chỉ thường trú', _addressCtrl, 'Số nhà, đường, Quận/Huyện, Tỉnh/TP',
          LucideIcons.mapPin, maxLines: 2),
      const SizedBox(height: 20),
      _securityNote(theme, c),
    ];
  }

  Widget _securityNote(ShadThemeData theme, UniMoveColors c) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surfaceHigh,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.shieldCheck, color: c.success, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cam kết bảo mật',
                    style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
                const SizedBox(height: 2),
                Text(
                  'Thông tin được mã hoá theo tiêu chuẩn, chỉ dùng cho mục đích xác thực đối tác.',
                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------- Step 2: vehicle ----------
  List<Widget> _vehicleStep(ShadThemeData theme, UniMoveColors c) {
    return [
      Text('Chọn loại xe', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
      const SizedBox(height: 10),
      _vehicleOption(theme, c, _VehicleType.motorbike, LucideIcons.bike, 'Xe máy', 'Linh hoạt & nhanh'),
      const SizedBox(height: 10),
      _vehicleOption(theme, c, _VehicleType.pickup, LucideIcons.truck, 'Xe bán tải', 'Chở hàng đa năng'),
      const SizedBox(height: 10),
      _vehicleOption(theme, c, _VehicleType.truck, LucideIcons.truck, 'Xe tải', 'Tải trọng lớn'),
      const SizedBox(height: 20),
      Text('Biển số xe', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
      const SizedBox(height: 10),
      _field(theme, c, '', _plateCtrl, 'VD: 59A-123.45', LucideIcons.idCard),
      const SizedBox(height: 8),
      Text('Nhập chính xác biển số hiển thị trên giấy tờ xe.',
          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
      const SizedBox(height: 20),
      Text('Hình ảnh xe', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
      const SizedBox(height: 10),
      _uploadBox(theme, c, 'Tải lên ảnh xe', 'Chụp rõ biển số và thân xe (tối đa 5MB)', _vehiclePhoto,
          () => setState(() => _vehiclePhoto = !_vehiclePhoto)),
    ];
  }

  Widget _vehicleOption(
      ShadThemeData theme, UniMoveColors c, _VehicleType type, IconData icon, String title, String subtitle) {
    final selected = _vehicle == type;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => setState(() => _vehicle = type),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected ? c.primary : c.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? c.primary : c.border, width: selected ? 2 : 1),
          ),
          child: Row(
            children: [
              Icon(icon, color: selected ? Colors.white : c.primary, size: 26),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: theme.textTheme.p.copyWith(
                            fontWeight: FontWeight.w700, color: selected ? Colors.white : c.onSurface)),
                    Text(subtitle,
                        style: theme.textTheme.small
                            .copyWith(color: selected ? Colors.white70 : c.onSurfaceMuted)),
                  ],
                ),
              ),
              if (selected) const Icon(LucideIcons.circleCheck, color: Colors.white, size: 22),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- Step 3: documents ----------
  List<Widget> _documentsStep(ShadThemeData theme, UniMoveColors c) {
    return [
      Text('Căn cước công dân (CCCD)',
          style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
      const SizedBox(height: 6),
      Text('Tải ảnh chụp mặt trước rõ nét của CCCD/CMND còn hiệu lực.',
          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
      const SizedBox(height: 10),
      _uploadBox(theme, c, 'Tải lên mặt trước CCCD', 'Định dạng JPG, PNG (tối đa 5MB)', _idFront,
          () => setState(() => _idFront = !_idFront)),
      const SizedBox(height: 20),
      Text('Bằng lái xe', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
      const SizedBox(height: 6),
      Text('Chụp cả hai mặt của giấy phép lái xe để hệ thống xác thực hạng bằng.',
          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
      const SizedBox(height: 10),
      _uploadBox(theme, c, 'Mặt trước bằng lái', 'JPG, PNG', _licenseFront,
          () => setState(() => _licenseFront = !_licenseFront)),
      const SizedBox(height: 10),
      _uploadBox(theme, c, 'Mặt sau bằng lái', 'JPG, PNG', _licenseBack,
          () => setState(() => _licenseBack = !_licenseBack)),
      const SizedBox(height: 20),
      Text('Đăng ký xe (Cà vẹt)',
          style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
      const SizedBox(height: 10),
      _uploadBox(theme, c, 'Giấy đăng ký xe', 'Bản gốc hoặc bản sao công chứng', _registration,
          () => setState(() => _registration = !_registration)),
    ];
  }

  Widget _uploadBox(
      ShadThemeData theme, UniMoveColors c, String title, String subtitle, bool done, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: done ? c.iconBgTertiary : c.surfaceHigh,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: done ? c.success : c.glassBorderStrong,
              width: 1.4,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: done ? c.success : c.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(done ? LucideIcons.check : LucideIcons.camera, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(done ? '$title — đã chọn' : title,
                        style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
                    Text(subtitle, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                  ],
                ),
              ),
              Icon(done ? LucideIcons.circleCheck : LucideIcons.upload,
                  color: done ? c.success : c.onSurfaceMuted, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- Shared ----------
  Widget _field(ShadThemeData theme, UniMoveColors c, String label, TextEditingController ctrl,
      String hint, IconData icon,
      {TextInputType? keyboard, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Text(label, style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w600, color: c.onSurface)),
          const SizedBox(height: 8),
        ],
        ShadInput(
          controller: ctrl,
          placeholder: Text(hint),
          leading: Icon(icon, size: 18),
          keyboardType: keyboard,
          maxLines: maxLines,
        ),
      ],
    );
  }

  Widget _errorBox(ShadThemeData theme, UniMoveColors c, String msg) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.circleAlert, color: Color(0xFFDC2626), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(msg, style: theme.textTheme.small.copyWith(color: const Color(0xFF991B1B))),
          ),
        ],
      ),
    );
  }

  Widget _bottomBar(ShadThemeData theme, UniMoveColors c) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      decoration: BoxDecoration(
        color: c.glassCard,
        border: Border(top: BorderSide(color: c.glassBorder)),
      ),
      child: Row(
        children: [
          if (_step > 0) ...[
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: c.onSurface,
                  side: BorderSide(color: c.border),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _back,
                child: const Text('Quay lại'),
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            flex: 2,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: c.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _next,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_isLastInputStep ? 'Hoàn tất đăng ký' : 'Tiếp tục',
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.arrowRight, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingView extends StatelessWidget {
  const _PendingView({required this.onCheck, required this.onHome});

  final VoidCallback onCheck;
  final VoidCallback onHome;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      children: [
        const SizedBox(height: 8),
        Center(
          child: Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [c.primary, c.primaryLight]),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: c.primary.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10)),
              ],
            ),
            child: const Icon(LucideIcons.clock, color: Colors.white, size: 44),
          ),
        ),
        const SizedBox(height: 24),
        Text('Đang chờ phê duyệt',
            textAlign: TextAlign.center,
            style: theme.textTheme.h2.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
        const SizedBox(height: 10),
        Text(
          'Cảm ơn bạn đã hoàn thành đăng ký! UniMove đang kiểm tra hồ sơ của bạn.',
          textAlign: TextAlign.center,
          style: theme.textTheme.p.copyWith(color: c.onSurfaceMuted, height: 1.5),
        ),
        const SizedBox(height: 28),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: c.surfaceHigh,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: c.border),
          ),
          child: Column(
            children: [
              _infoRow(theme, c, c.primary, LucideIcons.clock, 'Thời gian dự kiến',
                  'Chúng tôi sẽ xác minh tài liệu trong vòng 24–48 giờ tới.'),
              const SizedBox(height: 18),
              _infoRow(theme, c, c.success, LucideIcons.bellRing, 'Thông báo phê duyệt',
                  'Bạn sẽ nhận thông báo qua Email và ứng dụng ngay khi hồ sơ được duyệt.'),
            ],
          ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: c.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: onCheck,
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.refreshCw, size: 18),
                SizedBox(width: 8),
                Text('Kiểm tra trạng thái', style: TextStyle(fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            style: TextButton.styleFrom(
              foregroundColor: c.onSurface,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              backgroundColor: c.surfaceHigh,
            ),
            onPressed: onHome,
            child: const Text('Về trang chủ', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }

  Widget _infoRow(ShadThemeData theme, UniMoveColors c, Color tint, IconData icon, String title, String body) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
              const SizedBox(height: 2),
              Text(body, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.45)),
            ],
          ),
        ),
      ],
    );
  }
}
