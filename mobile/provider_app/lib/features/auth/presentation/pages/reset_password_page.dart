import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';
import '../../data/auth_password_helpers.dart';
import '../../data/auth_repository.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  late final TextEditingController _emailCtrl;
  final _otpCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  bool _resending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailCtrl = TextEditingController(text: widget.initialEmail ?? '');
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _resendOtp(BuildContext shadContext) async {
    final email = _emailCtrl.text.trim().toLowerCase();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Nhập email trước khi gửi lại mã.');
      return;
    }

    setState(() {
      _resending = true;
      _error = null;
    });

    try {
      final message = await ref.read(authRepositoryProvider).forgotPassword(email: email);
      if (!shadContext.mounted) return;
      ShadToaster.of(shadContext).show(
        ShadToast(
          title: const Text('Đã gửi lại mã'),
          description: Text(message),
        ),
      );
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = friendlyPasswordApiError(e));
    } catch (_) {
      setState(() => _error = 'Không gửi lại được mã.');
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _submit(BuildContext shadContext) async {
    final email = _emailCtrl.text.trim().toLowerCase();
    final otp = _otpCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirm = _confirmCtrl.text;

    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Email không hợp lệ.');
      return;
    }
    if (otp.length != 6 || int.tryParse(otp) == null) {
      setState(() => _error = 'Mã xác nhận gồm 6 chữ số.');
      return;
    }
    if (password.length < 8) {
      setState(() => _error = 'Mật khẩu mới cần ít nhất 8 ký tự.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final message = await ref.read(authRepositoryProvider).resetPassword(
        email: email,
        otp: otp,
        newPassword: password,
      );
      if (!shadContext.mounted) return;

      ShadToaster.of(shadContext).show(
        ShadToast(
          title: const Text('Đặt lại mật khẩu thành công'),
          description: Text(message),
        ),
      );

      if (!mounted) return;
      context.go('/login');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = friendlyPasswordApiError(e));
    } catch (_) {
      setState(() => _error = 'Mã không hợp lệ hoặc đã hết hạn.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _stagger(int index, Widget child) {
    final delay = (65 * index).ms;
    return child
        .animate()
        .fadeIn(duration: 460.ms, delay: delay, curve: Curves.easeOutCubic)
        .slideY(begin: 0.06, end: 0, duration: 500.ms, delay: delay, curve: Curves.easeOutCubic);
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

  @override
  Widget build(BuildContext context) {
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
                                  const UniMoveLogoAccent(fontSize: 22),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            _stagger(
                              1,
                              ShadCard(
                                backgroundColor: c.glassCard,
                                radius: BorderRadius.circular(28),
                                border: ShadBorder.all(color: c.glassBorder, width: 1),
                                padding: const EdgeInsets.fromLTRB(26, 28, 26, 26),
                                title: Text(
                                  'Đặt lại mật khẩu',
                                  style: theme.textTheme.h3.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                description: Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'Nhập mã 6 số từ email và mật khẩu mới.',
                                    style: theme.textTheme.muted.copyWith(height: 1.45),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 20),
                                    _stagger(
                                      2,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _fieldLabel(theme, 'Email'),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _emailCtrl,
                                            placeholder: const Text('provider@company.com'),
                                            leading: const Icon(LucideIcons.mail, size: 18),
                                            keyboardType: TextInputType.emailAddress,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    _stagger(
                                      3,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              _fieldLabel(theme, 'Mã xác nhận (6 số)'),
                                              const Spacer(),
                                              ShadButton.link(
                                                enabled: !_resending,
                                                onPressed: _resending
                                                    ? null
                                                    : () => _resendOtp(shadContext),
                                                child: Text(
                                                  _resending ? 'Đang gửi...' : 'Gửi lại mã',
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _otpCtrl,
                                            placeholder: const Text('123456'),
                                            leading: const Icon(LucideIcons.keyRound, size: 18),
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [
                                              FilteringTextInputFormatter.digitsOnly,
                                              LengthLimitingTextInputFormatter(6),
                                            ],
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
                                          _fieldLabel(theme, 'Mật khẩu mới'),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _passwordCtrl,
                                            placeholder: const Text('Tối thiểu 8 ký tự'),
                                            leading: const Icon(LucideIcons.lock, size: 18),
                                            obscureText: _obscurePass,
                                            trailing: ShadIconButton.ghost(
                                              width: 36,
                                              height: 36,
                                              icon: Icon(
                                                _obscurePass
                                                    ? LucideIcons.eye
                                                    : LucideIcons.eyeOff,
                                                size: 18,
                                              ),
                                              onPressed: () =>
                                                  setState(() => _obscurePass = !_obscurePass),
                                            ),
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
                                          _fieldLabel(theme, 'Xác nhận mật khẩu'),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _confirmCtrl,
                                            placeholder: const Text('Nhập lại mật khẩu'),
                                            leading: const Icon(LucideIcons.lockKeyhole, size: 18),
                                            obscureText: _obscureConfirm,
                                            textInputAction: TextInputAction.done,
                                            onSubmitted: (_) => _submit(shadContext),
                                            trailing: ShadIconButton.ghost(
                                              width: 36,
                                              height: 36,
                                              icon: Icon(
                                                _obscureConfirm
                                                    ? LucideIcons.eye
                                                    : LucideIcons.eyeOff,
                                                size: 18,
                                              ),
                                              onPressed: () => setState(
                                                () => _obscureConfirm = !_obscureConfirm,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (_error != null) ...[
                                      const SizedBox(height: 16),
                                      ShadAlert.destructive(
                                        icon: const Icon(LucideIcons.circleAlert, size: 18),
                                        title: const Text('Không thể đặt lại'),
                                        description: Text(_error!),
                                      ),
                                    ],
                                  ],
                                ),
                                footer: Padding(
                                  padding: const EdgeInsets.only(top: 22),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      _stagger(
                                        6,
                                        ShadButton(
                                          size: ShadButtonSize.lg,
                                          width: double.infinity,
                                          enabled: !_loading,
                                          onPressed: _loading ? null : () => _submit(shadContext),
                                          gradient: const LinearGradient(
                                            colors: AppColors.gradientPrimary,
                                          ),
                                          child: Text(
                                            _loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu',
                                            style: theme.textTheme.p.copyWith(
                                              color: AppColors.onPrimary,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                      _stagger(
                                        7,
                                        GestureDetector(
                                          onTap: () => context.go('/login'),
                                          child: Text.rich(
                                            TextSpan(
                                              style: theme.textTheme.p.copyWith(
                                                color: theme.colorScheme.mutedForeground,
                                              ),
                                              children: [
                                                const TextSpan(text: 'Quay lại '),
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
