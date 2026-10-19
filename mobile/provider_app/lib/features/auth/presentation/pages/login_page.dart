import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/config/dev_config.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';
import '../../data/auth_repository.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _remember = true;
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit(BuildContext shadContext) async {
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (!email.contains('@')) {
      setState(() => _error = 'Email không hợp lệ.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(authRepositoryProvider).signIn(email: email, password: password);
      if (!mounted) return;
      context.go('/home');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Đăng nhập thất bại. Kiểm tra email/mật khẩu.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _demoLogin() async {
    setState(() {
      _loading = true;
      _error = null;
      _emailCtrl.text = DevConfig.demoEmail;
      _passwordCtrl.text = DevConfig.demoPassword;
    });
    try {
      await ref.read(authRepositoryProvider).signIn(
            email: DevConfig.demoEmail,
            password: DevConfig.demoPassword,
          );
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString());
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
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
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
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                                      borderRadius: BorderRadius.circular(14),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(alpha: 0.4),
                                          blurRadius: 16,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(LucideIcons.truck, color: AppColors.onPrimary, size: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  const UniMoveLogoAccent(fontSize: 26),
                                  const Spacer(),
                                  ShadBadge.secondary(
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(LucideIcons.badgeCheck, size: 14, color: theme.colorScheme.primary),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Partner',
                                          style: theme.textTheme.small.copyWith(
                                            fontWeight: FontWeight.w700,
                                            color: theme.colorScheme.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 28),
                            _stagger(
                              1,
                              ShadCard(
                                backgroundColor: c.glassCard,
                                radius: BorderRadius.circular(28),
                                border: ShadBorder.all(color: c.glassBorder, width: 1),
                                padding: const EdgeInsets.fromLTRB(26, 28, 26, 26),
                                title: Text(
                                  'Chào đối tác 👋',
                                  style: theme.textTheme.h3.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                description: Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'Quản lý đơn hàng, thu nhập và hồ sơ vận tải trên một nền tảng.',
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
                                          _fieldLabel(theme, 'Email đối tác'),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _emailCtrl,
                                            placeholder: const Text('partner@unimove.vn'),
                                            leading: const Icon(LucideIcons.mail, size: 18),
                                            keyboardType: TextInputType.emailAddress,
                                            textInputAction: TextInputAction.next,
                                            autofillHints: const [AutofillHints.email],
                                            onSubmitted: (_) => FocusScope.of(shadContext).nextFocus(),
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
                                          _fieldLabel(theme, 'Mật khẩu'),
                                          const SizedBox(height: 8),
                                          ShadInput(
                                            controller: _passwordCtrl,
                                            placeholder: const Text('Ít nhất 8 ký tự'),
                                            leading: const Icon(LucideIcons.lock, size: 18),
                                            obscureText: _obscure,
                                            autofillHints: const [AutofillHints.password],
                                            textInputAction: TextInputAction.done,
                                            onSubmitted: (_) => _submit(shadContext),
                                            trailing: ShadIconButton.ghost(
                                              width: 36,
                                              height: 36,
                                              icon: Icon(_obscure ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                                              onPressed: () => setState(() => _obscure = !_obscure),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (_error != null) ...[
                                      const SizedBox(height: 16),
                                      ShadAlert.destructive(
                                        icon: const Icon(LucideIcons.circleAlert, size: 18),
                                        title: const Text('Đăng nhập thất bại'),
                                        description: Text(_error!),
                                      ),
                                    ],
                                    const SizedBox(height: 16),
                                    _stagger(
                                      4,
                                      Row(
                                        children: [
                                          ShadCheckbox(
                                            value: _remember,
                                            onChanged: (v) => setState(() => _remember = v),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Ghi nhớ tôi',
                                            style: theme.textTheme.small.copyWith(
                                              color: theme.colorScheme.mutedForeground,
                                            ),
                                          ),
                                          const Spacer(),
                                          ShadButton.link(
                                            onPressed: () {},
                                            child: const Text('Quên mật khẩu?'),
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
                                        5,
                                        ShadButton(
                                          size: ShadButtonSize.lg,
                                          width: double.infinity,
                                          enabled: !_loading,
                                          onPressed: _loading ? null : () => _submit(shadContext),
                                          gradient: const LinearGradient(colors: AppColors.gradientPrimary),
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
                                            _loading ? 'Đang xử lý...' : 'Đăng nhập',
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
                                        6,
                                        Row(
                                          children: [
                                            Expanded(child: ShadSeparator.horizontal()),
                                            Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 12),
                                              child: Text(
                                                'HOẶC',
                                                style: theme.textTheme.small.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ),
                                            Expanded(child: ShadSeparator.horizontal()),
                                          ],
                                        ),
                                      ),
                                      if (DevConfig.useMockAuth) ...[
                                        const SizedBox(height: 12),
                                        _stagger(
                                          7,
                                          ShadButton.outline(
                                            size: ShadButtonSize.lg,
                                            width: double.infinity,
                                            enabled: !_loading,
                                            onPressed: _loading ? null : _demoLogin,
                                            child: const Text('Đăng nhập demo (không cần API)'),
                                          ),
                                        ),
                                      ],
                                      const SizedBox(height: 16),
                                      _stagger(
                                        8,
                                        GestureDetector(
                                          onTap: () => context.push('/register'),
                                          child: Text.rich(
                                            TextSpan(
                                              style: theme.textTheme.p.copyWith(
                                                color: theme.colorScheme.mutedForeground,
                                              ),
                                              children: [
                                                const TextSpan(text: 'Chưa có tài khoản đối tác? '),
                                                TextSpan(
                                                  text: 'Đăng ký ngay',
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
                                      const SizedBox(height: 14),
                                      Text(
                                        'Bằng việc tiếp tục, bạn đồng ý với Điều khoản đối tác và Chính sách bảo mật của UniMove.',
                                        textAlign: TextAlign.center,
                                        style: theme.textTheme.small.copyWith(
                                          color: theme.colorScheme.mutedForeground.withValues(alpha: 0.85),
                                          height: 1.4,
                                          fontSize: 11,
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
