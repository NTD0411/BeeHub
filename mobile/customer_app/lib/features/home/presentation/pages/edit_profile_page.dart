import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../auth/data/customer_auth_repository.dart';

/// PATCH /api/customers/me — chỉnh sửa hồ sơ sinh viên.
class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key, this.initial});

  final CustomerProfile? initial;

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _repo = CustomerAuthRepository();

  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _studentIdCtrl;
  late final TextEditingController _universityCtrl;

  String? _gender;
  DateTime? _dob;

  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final p = widget.initial;
    _nameCtrl = TextEditingController(text: p?.fullName ?? '');
    _phoneCtrl = TextEditingController(text: _localPhone(p?.phone));
    _studentIdCtrl = TextEditingController(text: p?.studentId ?? '');
    _universityCtrl = TextEditingController(text: p?.university ?? '');
    _gender = p?.gender;
    _dob = p?.dateOfBirth == null ? null : DateTime.tryParse(p!.dateOfBirth!);
  }

  /// Bỏ +84 để hiển thị dạng 0xxx cho dễ sửa.
  String _localPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '';
    var p = phone.trim();
    if (p.startsWith('+84')) p = '0${p.substring(3)}';
    return p;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _studentIdCtrl.dispose();
    _universityCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDob(BuildContext context) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 20),
      firstDate: DateTime(1950),
      lastDate: now,
      helpText: 'Chọn ngày sinh',
    );
    if (picked != null) setState(() => _dob = picked);
  }

  String _isoDate(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _save(BuildContext shadContext) async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Vui lòng nhập họ và tên.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final updated = await _repo.updateProfile(
        fullName: name,
        phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        studentId: _studentIdCtrl.text.trim().isEmpty ? null : _studentIdCtrl.text.trim(),
        university: _universityCtrl.text.trim().isEmpty ? null : _universityCtrl.text.trim(),
        dateOfBirth: _dob == null ? null : _isoDate(_dob!),
        gender: _gender,
      );
      if (!shadContext.mounted) return;
      ShadToaster.of(shadContext).show(
        const ShadToast(title: Text('Đã lưu hồ sơ')),
      );
      if (!mounted) return;
      context.pop(updated);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Lưu hồ sơ thất bại. Thử lại sau.');
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
          title: const Text('Chỉnh sửa hồ sơ'),
        ),
        body: SafeArea(
          child: Builder(
            builder: (shadContext) => SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _label('Họ và tên'),
                  ShadInput(controller: _nameCtrl, placeholder: const Text('Nguyễn Văn A')),
                  const SizedBox(height: 16),
                  _label('Số điện thoại'),
                  ShadInput(
                    controller: _phoneCtrl,
                    placeholder: const Text('0901234567'),
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(11),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _label('Giới tính'),
                  ShadSelect<String>(
                    placeholder: const Text('Chọn giới tính'),
                    initialValue: _gender,
                    options: const [
                      ShadOption(value: 'male', child: Text('Nam')),
                      ShadOption(value: 'female', child: Text('Nữ')),
                      ShadOption(value: 'other', child: Text('Khác')),
                    ],
                    selectedOptionBuilder: (context, value) => Text(switch (value) {
                      'male' => 'Nam',
                      'female' => 'Nữ',
                      _ => 'Khác',
                    }),
                    onChanged: (v) => setState(() => _gender = v),
                  ),
                  const SizedBox(height: 16),
                  _label('Ngày sinh'),
                  GestureDetector(
                    onTap: () => _pickDob(context),
                    child: AbsorbPointer(
                      child: ShadInput(
                        placeholder: const Text('Chọn ngày sinh'),
                        controller: TextEditingController(
                          text: _dob == null
                              ? ''
                              : '${_dob!.day.toString().padLeft(2, '0')}/${_dob!.month.toString().padLeft(2, '0')}/${_dob!.year}',
                        ),
                        trailing: const Icon(LucideIcons.calendar, size: 18),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _label('Mã số sinh viên'),
                  ShadInput(controller: _studentIdCtrl, placeholder: const Text('20216045')),
                  const SizedBox(height: 16),
                  _label('Trường'),
                  ShadInput(controller: _universityCtrl, placeholder: const Text('ĐHQG-HCM')),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    ShadAlert.destructive(
                      icon: const Icon(LucideIcons.circleAlert, size: 18),
                      title: const Text('Không thể lưu'),
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
                      _loading ? 'Đang lưu...' : 'Lưu thay đổi',
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
