import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../data/auth_repository.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _nameCtrl = TextEditingController();
  final _businessCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _agreed = false;
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _passwordCtrl.addListener(_onPasswordChanged);
  }

  void _onPasswordChanged() => setState(() {});

  @override
  void dispose() {
    _passwordCtrl.removeListener(_onPasswordChanged);
    _nameCtrl.dispose();
    _businessCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  double get _passwordStrength {
    final p = _passwordCtrl.text;
    if (p.isEmpty) return 0;
    var score = 0.0;
    if (p.length >= 8) score += 0.35;
    if (p.length >= 10) score += 0.15;
    if (RegExp(r'[A-Z]').hasMatch(p)) score += 0.2;
    if (RegExp(r'[0-9]').hasMatch(p)) score += 0.15;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(p)) score += 0.15;
    return score.clamp(0.0, 1.0);
  }

  Future<void> _submit(BuildContext shadContext) async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim().toLowerCase();
    final password = _passwordCtrl.text;
    final confirm = _confirmCtrl.text;

    if (name.isEmpty) {
      setState(() => _error = 'Vui lòng nhập họ và tên.');
      return;
    }
    if (!email.contains('@') || !email.contains('.')) {
      setState(() => _error = 'Email không hợp lệ.');
      return;
    }
    if (password.length < 8) {
      setState(() => _error = 'Mật khẩu cần ít nhất 8 ký tự.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!_agreed) {
      setState(() => _error = 'Bạn cần đồng ý Điều khoản đối tác.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(authRepositoryProvider).signUp(
            email: email,
            password: password,
            fullName: name,
            businessName: _businessCtrl.text.trim(),
          );
      if (!shadContext.mounted) return;

      ShadToaster.of(shadContext).show(
        const ShadToast(
          title: Text('Đăng ký thành công!'),
          description: Text('Chờ admin duyệt hồ sơ đối tác.'),
        ),
      );
      await Future<void>.delayed(const Duration(milliseconds: 400));
      if (!mounted) return;
      context.go('/driver-registration');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Đăng ký thất bại. Thử lại sau.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _stagger(int index, Widget child) {
    final delay = (70 * index).ms;
    return child
        .animate()
        .fadeIn(duration: 480.ms, delay: delay, curve: Curves.easeOutCubic)
        .slideY(begin: 0.06, end: 0, duration: 520.ms, delay: delay, curve: Curves.easeOutCubic);
  }

  Widget _fieldLabel(ShadThemeData theme, String text) {
    return Text(
      text,
      style: theme.textTheme.small.copyWith(
        fontWeight: FontWeight.w600,
        color: theme.colorScheme.foreground,
      ),
    );
  }

  Widget _buildInput({
    required BuildContext shadContext,
    required TextEditingController controller,
    required String placeholder,
    required IconData leadingIcon,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    bool obscureText = false,
    Widget? trailing,
    ValueChanged<String>? onChanged,
  }) {
    return ShadInput(
      controller: controller,
      placeholder: Text(placeholder),
      leading: Icon(leadingIcon, size: 18),
      trailing: trailing,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      obscureText: obscureText,
      onChanged: onChanged,
      onSubmitted: (_) => FocusScope.of(shadContext).nextFocus(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final strength = _passwordStrength;

    return ShadScreenScope(
      builder: (shadContext, theme) {
        final c = UniMoveColors.of(shadContext);

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              const DarkGlassBackground(),
              Positioned.fill(
                child: SafeArea(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 440),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _stagger(
                              0,
                              Row(
                                children: [
                                  ShadIconButton.ghost(
                                    icon: const Icon(LucideIcons.arrowLeft, size: 20),
                                    onPressed: () => context.pop(),
                                  ),
                                  const Spacer(),
                                  ShadBadge.secondary(
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(LucideIcons.truck, size: 14, color: theme.colorScheme.primary),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Đối tác vận tải',
                                          style: theme.textTheme.small.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: theme.colorScheme.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            _stagger(
                              1,
                              Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                        colors: AppColors.gradientPrimary,
                                      ),
                                      borderRadius: BorderRadius.circular(14),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(alpha: 0.35),
                                          blurRadius: 16,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(LucideIcons.truck, color: AppColors.onPrimary, size: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'UniMove Partner',
                                    style: theme.textTheme.h2.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.5,
                                      fontSize: 22,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                            _stagger(
                              2,
                              ShadCard(
                                backgroundColor: c.glassCard,
                                radius: BorderRadius.circular(28),
                                border: ShadBorder.all(color: c.glassBorder, width: 1),
                                padding: const EdgeInsets.fromLTRB(26, 28, 26, 26),
                                title: Text(
                                  'Đăng ký đối tác',
                                  style: theme.textTheme.h3.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                description: Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'Tạo tài khoản để nhận đơn, theo dõi thu nhập và upload giấy tờ xác thực.',
                                    style: theme.textTheme.muted.copyWith(height: 1.45),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 20),
                                    _stagger(
                                      3,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _fieldLabel(theme, 'Họ và tên'),
                                          const SizedBox(height: 8),
                                          _buildInput(
                                            shadContext: shadContext,
                                            controller: _nameCtrl,
                                            placeholder: 'Nguyễn Văn A',
                                            leadingIcon: LucideIcons.user,
                                            textInputAction: TextInputAction.next,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    _stagger(
                                      4,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _fieldLabel(theme, 'Tên doanh nghiệp / xe'),
                                          const SizedBox(height: 8),
                                          _buildInput(
                                            shadContext: shadContext,
                                            controller: _businessCtrl,
                                            placeholder: 'UniMove Logistics',
                                            leadingIcon: LucideIcons.building2,
                                            textInputAction: TextInputAction.next,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    _stagger(
                                      5,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _fieldLabel(theme, 'Email'),
                                          const SizedBox(height: 8),
                                          _buildInput(
                                            shadContext: shadContext,
                                            controller: _emailCtrl,
                                            placeholder: 'partner@unimove.vn',
                                            leadingIcon: LucideIcons.mail,
                                            keyboardType: TextInputType.emailAddress,
                                            textInputAction: TextInputAction.next,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    _stagger(
                                      6,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _fieldLabel(theme, 'Mật khẩu'),
                                          const SizedBox(height: 8),
                                          _buildInput(
                                            shadContext: shadContext,
                                            controller: _passwordCtrl,
                                            placeholder: 'Tối thiểu 8 ký tự',
                                            leadingIcon: LucideIcons.lock,
                                            obscureText: _obscurePass,
                                            textInputAction: TextInputAction.next,
                                            onChanged: (_) => setState(() {}),
                                            trailing: ShadIconButton.ghost(
                                              width: 36,
                                              height: 36,
                                              icon: Icon(
                                                _obscurePass ? LucideIcons.eye : LucideIcons.eyeOff,
                                                size: 18,
                                              ),
                                              onPressed: () => setState(() => _obscurePass = !_obscurePass),
                                            ),
                                          ),
                                          if (_passwordCtrl.text.isNotEmpty) ...[
                                            const SizedBox(height: 10),
                                            ShadProgress(
                                              value: strength,
                                              minHeight: 5,
                                              color: Color.lerp(AppColors.error, AppColors.tertiary, strength),
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              strength < 0.4
                                                  ? 'Yếu — thêm chữ hoa, số hoặc ký tự đặc biệt'
                                                  : strength < 0.75
                                                      ? 'Khá tốt'
                                                      : 'Mật khẩu mạnh',
                                              style: theme.textTheme.small.copyWith(
                                                color: theme.colorScheme.mutedForeground,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    _stagger(
                                      7,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _fieldLabel(theme, 'Xác nhận mật khẩu'),
                                          const SizedBox(height: 8),
                                          _buildInput(
                                            shadContext: shadContext,
                                            controller: _confirmCtrl,
                                            placeholder: 'Nhập lại mật khẩu',
                                            leadingIcon: LucideIcons.lockKeyhole,
                                            obscureText: _obscureConfirm,
                                            textInputAction: TextInputAction.done,
                                            trailing: ShadIconButton.ghost(
                                              width: 36,
                                              height: 36,
                                              icon: Icon(
                                                _obscureConfirm ? LucideIcons.eye : LucideIcons.eyeOff,
                                                size: 18,
                                              ),
                                              onPressed: () =>
                                                  setState(() => _obscureConfirm = !_obscureConfirm),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (_error != null) ...[
                                      const SizedBox(height: 16),
                                      ShadAlert.destructive(
                                        icon: const Icon(LucideIcons.circleAlert, size: 18),
                                        title: const Text('Không thể đăng ký'),
                                        description: Text(_error!),
                                      ),
                                    ],
                                    const SizedBox(height: 18),
                                    _stagger(
                                      8,
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          ShadCheckbox(
                                            value: _agreed,
                                            onChanged: (v) => setState(() => _agreed = v),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: GestureDetector(
                                              onTap: () => setState(() => _agreed = !_agreed),
                                              child: RichText(
                                                text: TextSpan(
                                                  style: theme.textTheme.small.copyWith(
                                                    height: 1.45,
                                                    color: theme.colorScheme.mutedForeground,
                                                  ),
                                                  children: [
                                                    const TextSpan(text: 'Tôi đồng ý với '),
                                                    TextSpan(
                                                      text: 'Điều khoản đối tác',
                                                      style: theme.textTheme.small.copyWith(
                                                        color: theme.colorScheme.primary,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                    ),
                                                    const TextSpan(text: ' và '),
                                                    TextSpan(
                                                      text: 'Chính sách bảo mật',
                                                      style: theme.textTheme.small.copyWith(
                                                        color: theme.colorScheme.primary,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                    ),
                                                    const TextSpan(text: ' của UniMove.'),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                footer: Padding(
                                  padding: const EdgeInsets.only(top: 22),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      _stagger(
                                        9,
                                        ShadButton(
                                          size: ShadButtonSize.lg,
                                          width: double.infinity,
                                          enabled: !_loading,
                                          onPressed: _loading ? null : () => _submit(shadContext),
                                          gradient: const LinearGradient(
                                            begin: Alignment.centerLeft,
                                            end: Alignment.centerRight,
                                            colors: AppColors.gradientPrimary,
                                          ),
                                          shadows: [
                                            BoxShadow(
                                              color: AppColors.primary.withValues(alpha: 0.4),
                                              blurRadius: 20,
                                              offset: const Offset(0, 8),
                                            ),
                                          ],
                                          leading: _loading
                                              ? SizedBox(
                                                  width: 18,
                                                  height: 18,
                                                  child: CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    color: theme.colorScheme.primaryForeground,
                                                  ),
                                                )
                                              : null,
                                          child: Text(
                                            _loading ? 'Đang xử lý...' : 'Tạo tài khoản',
                                            style: theme.textTheme.p.copyWith(
                                              color: AppColors.onPrimary,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 16,
                                            ),
                                          ),
                                          trailing: _loading
                                              ? null
                                              : const Icon(
                                                  LucideIcons.arrowRight,
                                                  size: 20,
                                                  color: AppColors.onPrimary,
                                                ),
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                      _stagger(
                                        10,
                                        GestureDetector(
                                          onTap: () => context.pop(),
                                          child: Text.rich(
                                            TextSpan(
                                              style: theme.textTheme.p.copyWith(
                                                color: theme.colorScheme.mutedForeground,
                                              ),
                                              children: [
                                                const TextSpan(text: 'Đã có tài khoản? '),
                                                TextSpan(
                                                  text: 'Đăng nhập',
                                                  style: theme.textTheme.p.copyWith(
                                                    color: theme.colorScheme.primary,
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
