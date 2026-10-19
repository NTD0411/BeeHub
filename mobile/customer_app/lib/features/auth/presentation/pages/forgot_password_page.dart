import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';
import '../../data/auth_password_helpers.dart';
import '../../data/customer_auth_repository.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  late final TextEditingController _emailCtrl;

  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailCtrl = TextEditingController(text: widget.initialEmail ?? '');
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit(BuildContext shadContext) async {
    final email = _emailCtrl.text.trim().toLowerCase();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Vui lòng nhập email hợp lệ.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final message = await CustomerAuthRepository().forgotPassword(email: email);
      if (!shadContext.mounted) return;

      ShadToaster.of(shadContext).show(
        ShadToast(
          title: const Text('Đã gửi mã xác nhận'),
          description: Text(message),
        ),
      );

      if (!mounted) return;
      context.push('/reset-password?email=${Uri.encodeComponent(email)}');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = friendlyPasswordApiError(e));
    } catch (_) {
      setState(() => _error = 'Không gửi được mã. Thử lại sau.');
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
                                  'Quên mật khẩu',
                                  style: theme.textTheme.h3.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                description: Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'Nhập email đã đăng ký. Chúng tôi gửi mã 6 số qua email để đặt lại mật khẩu.',
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
                                          _fieldLabel(theme, 'Email sinh viên'),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _emailCtrl,
                                            placeholder: const Text('ten@sinhvien.edu.vn'),
                                            leading: const Icon(LucideIcons.mail, size: 18),
                                            keyboardType: TextInputType.emailAddress,
                                            textInputAction: TextInputAction.done,
                                            onSubmitted: (_) => _submit(shadContext),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (_error != null) ...[
                                      const SizedBox(height: 16),
                                      ShadAlert.destructive(
                                        icon: const Icon(LucideIcons.circleAlert, size: 18),
                                        title: const Text('Không thể gửi mã'),
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
                                        3,
                                        ShadButton(
                                          size: ShadButtonSize.lg,
                                          width: double.infinity,
                                          enabled: !_loading,
                                          onPressed: _loading ? null : () => _submit(shadContext),
                                          gradient: const LinearGradient(
                                            colors: AppColors.gradientPrimary,
                                          ),
                                          shadows: [
                                            BoxShadow(
                                              color: AppColors.primary.withValues(alpha: 0.45),
                                              blurRadius: 20,
                                              offset: const Offset(0, 8),
                                            ),
                                          ],
                                          leading: _loading
                                              ? const SizedBox(
                                                  width: 18,
                                                  height: 18,
                                                  child: CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    color: AppColors.onPrimary,
                                                  ),
                                                )
                                              : null,
                                          trailing: _loading
                                              ? null
                                              : const Icon(
                                                  LucideIcons.arrowRight,
                                                  size: 20,
                                                  color: AppColors.onPrimary,
                                                ),
                                          child: Text(
                                            _loading ? 'Đang gửi...' : 'Gửi mã xác nhận',
                                            style: theme.textTheme.p.copyWith(
                                              color: AppColors.onPrimary,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      _stagger(
                                        4,
                                        GestureDetector(
                                          onTap: () {
                                            final email = _emailCtrl.text.trim();
                                            final q = email.isNotEmpty
                                                ? '?email=${Uri.encodeComponent(email)}'
                                                : '';
                                            context.push('/reset-password$q');
                                          },
                                          child: Text(
                                            'Đã có mã? Nhập mã xác nhận',
                                            textAlign: TextAlign.center,
                                            style: theme.textTheme.small.copyWith(
                                              color: theme.colorScheme.primary,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                      _stagger(
                                        5,
                                        GestureDetector(
                                          onTap: () => context.pop(),
                                          child: Text.rich(
                                            TextSpan(
                                              style: theme.textTheme.p.copyWith(
                                                color: theme.colorScheme.mutedForeground,
                                              ),
                                              children: [
                                                const TextSpan(text: 'Nhớ mật khẩu? '),
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
