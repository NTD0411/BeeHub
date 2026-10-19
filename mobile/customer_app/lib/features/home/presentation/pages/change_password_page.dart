import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../auth/data/customer_auth_repository.dart';

/// POST /api/auth/change-password — đổi mật khẩu khi đã đăng nhập.
class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _repo = CustomerAuthRepository();
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _save(BuildContext shadContext) async {
    final current = _currentCtrl.text;
    final next = _newCtrl.text;
    final confirm = _confirmCtrl.text;

    if (current.isEmpty || next.isEmpty) {
      setState(() => _error = 'Vui lòng nhập đầy đủ mật khẩu.');
      return;
    }
    if (next.length < 8) {
      setState(() => _error = 'Mật khẩu mới cần ít nhất 8 ký tự.');
      return;
    }
    if (next != confirm) {
      setState(() => _error = 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await _repo.changePassword(currentPassword: current, newPassword: next);
      if (!shadContext.mounted) return;
      ShadToaster.of(shadContext).show(
        const ShadToast(title: Text('Đổi mật khẩu thành công')),
      );
      if (!mounted) return;
      context.pop();
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Đổi mật khẩu thất bại. Thử lại sau.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadToaster(
      child: Scaffold(
        backgroundColor: c.background,
        appBar: AppBar(
          backgroundColor: c.background,
          title: const Text('Đổi mật khẩu'),
        ),
        body: SafeArea(
          child: Builder(
            builder: (shadContext) => SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _label('Mật khẩu hiện tại'),
                  ShadInput(
                    controller: _currentCtrl,
                    obscureText: _obscureCurrent,
                    placeholder: const Text('Mật khẩu hiện tại'),
                    trailing: ShadIconButton.ghost(
                      width: 36,
                      height: 36,
                      icon: Icon(_obscureCurrent ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                      onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _label('Mật khẩu mới'),
                  ShadInput(
                    controller: _newCtrl,
                    obscureText: _obscureNew,
                    placeholder: const Text('Tối thiểu 8 ký tự'),
                    trailing: ShadIconButton.ghost(
                      width: 36,
                      height: 36,
                      icon: Icon(_obscureNew ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                      onPressed: () => setState(() => _obscureNew = !_obscureNew),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _label('Xác nhận mật khẩu mới'),
                  ShadInput(
                    controller: _confirmCtrl,
                    obscureText: _obscureNew,
                    placeholder: const Text('Nhập lại mật khẩu mới'),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    ShadAlert.destructive(
                      icon: const Icon(LucideIcons.circleAlert, size: 18),
                      title: const Text('Không thể đổi mật khẩu'),
                      description: Text(_error!),
                    ),
                  ],
                  const SizedBox(height: 24),
                  ShadButton(
                    size: ShadButtonSize.lg,
                    width: double.infinity,
                    enabled: !_loading,
                    onPressed: _loading ? null : () => _save(shadContext),
                    gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                    child: Text(
                      _loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu',
                      style: const TextStyle(
                        color: AppColors.onPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600)),
      );
}
