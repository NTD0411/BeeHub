import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/mock/mock_provider_data.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../auth/data/auth_repository.dart';
import '../../data/provider_payout_lookup_service.dart';
import '../../data/provider_payout_repository.dart';
import '../../data/vietnam_banks.dart';
import '../../domain/provider_payout_models.dart';
import '../widgets/payout_form_widgets.dart';

class AddProviderPayoutMethodPage extends ConsumerStatefulWidget {
  const AddProviderPayoutMethodPage({super.key});

  @override
  ConsumerState<AddProviderPayoutMethodPage> createState() => _AddProviderPayoutMethodPageState();
}

class _AddProviderPayoutMethodPageState extends ConsumerState<AddProviderPayoutMethodPage> {
  final _repo = ProviderPayoutRepository();
  final _lookup = const ProviderPayoutLookupService();
  final _formKey = GlobalKey<FormState>();

  ProviderPayoutKind _kind = ProviderPayoutKind.bank;
  VietnamBank? _bank = VietnamBanks.all.first;

  final _accountNumber = TextEditingController();
  final _accountName = TextEditingController();
  final _branch = TextEditingController();
  final _displayName = TextEditingController();
  final _idNumber = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _businessName = TextEditingController();
  final _taxCode = TextEditingController();
  final _otp = TextEditingController();

  bool _setDefault = true;
  bool _acceptedTerms = false;
  bool _saving = false;
  bool _prefilled = false;

  AccountLookupStatus _lookupStatus = AccountLookupStatus.idle;
  String? _lookupError;
  Timer? _lookupDebounce;
  int _lookupGeneration = 0;

  bool get _accountResolved => _lookupStatus == AccountLookupStatus.success && _accountName.text.trim().isNotEmpty;

  bool get _canSubmit =>
      _acceptedTerms &&
      !_saving &&
      _lookupStatus != AccountLookupStatus.loading &&
      (_kind != ProviderPayoutKind.bank || _accountResolved);

  @override
  void initState() {
    super.initState();
    _accountNumber.addListener(_onAccountNumberChanged);
  }

  @override
  void dispose() {
    _lookupDebounce?.cancel();
    _accountNumber.removeListener(_onAccountNumberChanged);
    _accountNumber.dispose();
    _accountName.dispose();
    _branch.dispose();
    _displayName.dispose();
    _idNumber.dispose();
    _phone.dispose();
    _email.dispose();
    _businessName.dispose();
    _taxCode.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _prefillFromProfile() {
    if (_prefilled) return;
    _prefilled = true;

    final profile = ref.read(providerProfileProvider).asData?.value;
    final mock = MockProviderData.userJson;

    _businessName.text = profile?.businessName ?? mock['business_name'] as String? ?? '';
    _phone.text = (profile?.phone ?? mock['phone'] as String? ?? '').replaceAll(' ', '');
    _email.text = profile?.email ?? mock['email'] as String? ?? '';
    _taxCode.text = mock['tax_code'] as String? ?? '';

    final bankName = mock['bank_name'] as String?;
    if (bankName != null) {
      _bank = VietnamBanks.byShortName(bankName) ?? _bank;
    }

    if (_kind == ProviderPayoutKind.bank) {
      _accountNumber.text = mock['bank_account_number'] as String? ?? '';
      WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleAccountLookup());
    }
  }

  void _onAccountNumberChanged() => _scheduleAccountLookup();

  void _resetLookup() {
    _lookupDebounce?.cancel();
    setState(() {
      _lookupStatus = AccountLookupStatus.idle;
      _lookupError = null;
      _accountName.clear();
    });
  }

  void _scheduleAccountLookup() {
    _lookupDebounce?.cancel();
    _lookupDebounce = Timer(const Duration(milliseconds: 600), _runAccountLookup);
  }

  Future<void> _runAccountLookup() async {
    final digits = _accountNumber.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 8) {
      if (mounted) {
        setState(() {
          _lookupStatus = AccountLookupStatus.idle;
          _lookupError = null;
          _accountName.clear();
        });
      }
      return;
    }

    final gen = ++_lookupGeneration;
    setState(() {
      _lookupStatus = AccountLookupStatus.loading;
      _lookupError = null;
      _accountName.clear();
    });

    final result = await _lookup.lookup(
      kind: _kind,
      bankCode: _bank?.payosCode,
      accountNumber: digits,
    );

    if (!mounted || gen != _lookupGeneration) return;

    setState(() {
      _lookupStatus = result.status;
      _lookupError = result.message;
      if (result.accountName != null) {
        _accountName.text = result.accountName!;
      }
    });
  }

  void _onKindChanged(ProviderPayoutKind kind) {
    setState(() {
      _kind = kind;
      _resetLookup();
    });
    if (kind == ProviderPayoutKind.bank && _accountNumber.text.replaceAll(RegExp(r'\D'), '').length >= 8) {
      _scheduleAccountLookup();
    }
  }

  String? _required(String? v, {String msg = 'Trường bắt buộc'}) {
    if (v == null || v.trim().isEmpty) return msg;
    return null;
  }

  String? _validatePhone(String? v) {
    final err = _required(v, msg: 'Nhập số điện thoại');
    if (err != null) return err;
    final digits = v!.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 9 || digits.length > 11) return 'Số điện thoại không hợp lệ';
    return null;
  }

  String? _validateEmail(String? v) {
    final err = _required(v, msg: 'Nhập email');
    if (err != null) return err;
    if (!v!.contains('@')) return 'Email không hợp lệ';
    return null;
  }

  String? _validateIdNumber(String? v) {
    final err = _required(v, msg: 'Nhập số CCCD/CMND');
    if (err != null) return err;
    final digits = v!.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 12 && digits.length != 9) return 'CCCD 12 số hoặc CMND 9 số';
    return null;
  }

  Future<bool> _showPayOsOtpSheet() async {
    _otp.clear();
    final c = UniMoveColors.of(context);

    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return ShadScreenScope(
          builder: (_, theme) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: c.onSurfaceMuted.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.smartphone, color: Color(0xFF2563EB)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Xác minh PayOS',
                              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                            ),
                            Text(
                              'Mã OTP đã gửi tới ${_phone.text}',
                              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ShadInput(
                    controller: _otp,
                    placeholder: const Text('Nhập mã OTP 6 số'),
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    leading: const Icon(LucideIcons.keyRound, size: 18),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Demo: nhập 123456 để hoàn tất xác minh',
                    style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11),
                  ),
                  const SizedBox(height: 20),
                  ShadButton(
                    width: double.infinity,
                    onPressed: () {
                      if (_otp.text.trim() == '123456') {
                        Navigator.pop(ctx, true);
                      } else {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Mã OTP không đúng (demo: 123456)')),
                        );
                      }
                    },
                    child: const Text('Xác nhận OTP'),
                  ),
                ],
              ),
            );
          },
        );
      },
    ).then((v) => v ?? false);
  }

  Future<void> _submit() async {
    if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đồng ý điều khoản xác minh PayOS')),
      );
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (_kind == ProviderPayoutKind.bank && !_accountResolved) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chờ hệ thống xác minh tên chủ tài khoản')),
      );
      return;
    }

    if (_kind == ProviderPayoutKind.bank && _bank == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Chọn ngân hàng thụ hưởng')));
      return;
    }

    final otpOk = await _showPayOsOtpSheet();
    if (!otpOk || !mounted) return;

    setState(() => _saving = true);
    try {
      final name = _accountName.text.trim().toUpperCase();
      final number = _accountNumber.text.trim();
      final display = _displayName.text.trim().isNotEmpty
          ? _displayName.text.trim()
          : switch (_kind) {
              ProviderPayoutKind.bank => _bank!.shortName,
              ProviderPayoutKind.momo => 'Ví MoMo',
              ProviderPayoutKind.zalopay => 'ZaloPay',
            };

      await _repo.addMethod(
        ProviderPayoutMethod(
          id: '',
          kind: _kind,
          displayName: display,
          accountName: name,
          accountNumber: number,
          bankName: _kind == ProviderPayoutKind.bank ? _bank!.shortName : null,
          bankCode: _kind == ProviderPayoutKind.bank ? _bank!.payosCode : null,
          bankBin: _kind == ProviderPayoutKind.bank ? _bank!.binCode : null,
          branchName: _branch.text.trim().isEmpty ? null : _branch.text.trim(),
          phone: _phone.text.trim(),
          email: _email.text.trim(),
          idNumber: _idNumber.text.trim(),
          taxCode: _taxCode.text.trim().isEmpty ? null : _taxCode.text.trim(),
          businessName: _businessName.text.trim(),
          isDefault: _setDefault,
          isVerified: true,
          verificationStatus: PayoutVerificationStatus.verified,
        ),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã xác minh và lưu phương thức nhận tiền qua PayOS')),
      );
      Navigator.pop(context, true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _input({
    required BuildContext shadContext,
    required TextEditingController controller,
    required String placeholder,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int? maxLength,
    bool obscureText = false,
    TextCapitalization capitalization = TextCapitalization.none,
  }) {
    return FormField<String>(
      initialValue: controller.text,
      validator: validator,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      builder: (state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ShadInput(
              controller: controller,
              placeholder: Text(placeholder),
              leading: Icon(icon, size: 18),
              keyboardType: keyboardType,
              maxLength: maxLength,
              obscureText: obscureText,
              inputFormatters: inputFormatters,
              textCapitalization: capitalization,
              onChanged: (v) {
                state.didChange(v);
                state.validate();
              },
              onSubmitted: (_) => FocusScope.of(shadContext).nextFocus(),
            ),
            if (state.hasError) ...[
              const SizedBox(height: 6),
              Text(
                state.errorText!,
                style: TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _lookupHint(ShadThemeData theme, UniMoveColors c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.info, size: 16, color: c.primaryLight),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _kind == ProviderPayoutKind.bank
                  ? 'Tên chủ tài khoản sẽ được xác minh tự động sau khi nhập đủ ngân hàng và số TK.'
                  : 'Tên chủ ví sẽ được xác minh tự động sau khi nhập đủ số ví.',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  Widget? _lookupTrailing(UniMoveColors c) {
    return switch (_lookupStatus) {
      AccountLookupStatus.loading => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: c.primaryLight),
          ),
        ),
      AccountLookupStatus.success => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Icon(LucideIcons.circleCheck, color: c.success, size: 20),
        ),
      AccountLookupStatus.failed => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Icon(LucideIcons.circleAlert, color: AppColors.error, size: 20),
        ),
      _ => null,
    };
  }

  Widget _accountNameField(BuildContext shadContext, ShadThemeData theme, UniMoveColors c) {
    final isAutoLookup = _kind == ProviderPayoutKind.bank;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PayoutFieldLabel(
          label: 'Tên chủ tài khoản',
          required: true,
          hint: isAutoLookup ? 'Tự động sau khi xác minh số TK' : 'Tự động sau khi xác minh số ví',
        ),
        ShadInput(
          controller: _accountName,
          placeholder: Text(
            _lookupStatus == AccountLookupStatus.loading
                ? 'Đang kiểm tra…'
                : 'Chờ xác minh tên chủ tài khoản',
          ),
          leading: const Icon(LucideIcons.user, size: 18),
          readOnly: true,
          trailing: _lookupTrailing(c),
        ),
        if (_lookupStatus == AccountLookupStatus.failed && _lookupError != null) ...[
          const SizedBox(height: 6),
          Text(
            _lookupError!,
            style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ] else if (_accountResolved) ...[
          const SizedBox(height: 6),
          Text(
            'Đã xác minh tên chủ tài khoản',
            style: theme.textTheme.small.copyWith(color: c.success, fontWeight: FontWeight.w600),
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    _prefillFromProfile();
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (shadContext, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: ShadIconButton.ghost(
              icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              'Liên kết nhận tiền',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
            ),
          ),
          body: Form(
            key: _formKey,
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    children: [
                      PayoutFormSection(
                        title: 'Loại phương thức',
                        subtitle: 'Chọn kênh giải ngân thu nhập từ UniMove',
                        child: Column(
                          children: [
                            PayoutMethodTypeCard(
                              kind: ProviderPayoutKind.bank,
                              selected: _kind == ProviderPayoutKind.bank,
                              icon: LucideIcons.landmark,
                              description: 'Chuyển khoản qua PayOS · khuyến nghị',
                              onTap: () => _onKindChanged(ProviderPayoutKind.bank),
                            ),
                            const SizedBox(height: 10),
                            PayoutMethodTypeCard(
                              kind: ProviderPayoutKind.momo,
                              selected: _kind == ProviderPayoutKind.momo,
                              icon: LucideIcons.smartphone,
                              description: 'Số ví MoMo đăng ký đúng tên chủ',
                              onTap: () => _onKindChanged(ProviderPayoutKind.momo),
                            ),
                            const SizedBox(height: 10),
                            PayoutMethodTypeCard(
                              kind: ProviderPayoutKind.zalopay,
                              selected: _kind == ProviderPayoutKind.zalopay,
                              icon: LucideIcons.wallet,
                              description: 'Số ví ZaloPay liên kết SĐT',
                              onTap: () => _onKindChanged(ProviderPayoutKind.zalopay),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      PayoutFormSection(
                        title: 'Thông tin tài khoản',
                        subtitle: _kind == ProviderPayoutKind.bank
                            ? 'Khớp với tên trên thẻ ngân hàng / sổ tiết kiệm'
                            : 'Số ví trùng SĐT đăng ký ví điện tử',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (_kind == ProviderPayoutKind.bank) ...[
                              const PayoutFieldLabel(label: 'Ngân hàng thụ hưởng', required: true),
                              Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(12),
                                  onTap: () async {
                                    final picked = await showBankPickerSheet(context, _bank);
                                    if (picked != null) {
                                      setState(() => _bank = picked);
                                      _scheduleAccountLookup();
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: c.glassBorder),
                                      borderRadius: BorderRadius.circular(12),
                                      color: c.surface,
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 40,
                                          height: 40,
                                          alignment: Alignment.center,
                                          decoration: BoxDecoration(
                                            color: c.iconBgTertiary,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            _bank?.payosCode ?? '—',
                                            style: theme.textTheme.small.copyWith(
                                              fontWeight: FontWeight.w800,
                                              color: c.primaryLight,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                _bank?.shortName ?? 'Chọn ngân hàng',
                                                style: theme.textTheme.p.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                  color: c.onSurface,
                                                ),
                                              ),
                                              if (_bank != null)
                                                Text(
                                                  'Mã BIN ${_bank!.binCode} · PayOS ${_bank!.payosCode}',
                                                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                                                ),
                                            ],
                                          ),
                                        ),
                                        Icon(LucideIcons.chevronDown, color: c.onSurfaceMuted, size: 20),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              const PayoutFieldLabel(
                                label: 'Chi nhánh',
                                hint: 'Tuỳ chọn — giúp đối soát nhanh hơn',
                              ),
                              ShadInput(
                                controller: _branch,
                                placeholder: const Text('VD: CN Quận 7, TP.HCM'),
                                leading: const Icon(LucideIcons.building2, size: 18),
                              ),
                              const SizedBox(height: 16),
                            ],
                            _lookupHint(theme, c),
                            const PayoutFieldLabel(
                              label: 'Số tài khoản / ví',
                              required: true,
                              hint: 'Chỉ nhập số, không dấu cách (tối thiểu 8 số)',
                            ),
                            _input(
                              shadContext: shadContext,
                              controller: _accountNumber,
                              placeholder: _kind == ProviderPayoutKind.bank
                                  ? 'VD: 0123456789'
                                  : 'VD: 0903123456',
                              icon: LucideIcons.hash,
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              validator: (v) {
                                final err = _required(v, msg: 'Nhập số tài khoản');
                                if (err != null) return err;
                                if (v!.length < 6) return 'Số tài khoản quá ngắn';
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            _accountNameField(shadContext, theme, c),
                            const SizedBox(height: 16),
                            const PayoutFieldLabel(label: 'Tên gợi nhớ', hint: 'Hiển thị trong danh sách của bạn'),
                            ShadInput(
                              controller: _displayName,
                              placeholder: const Text('VD: TK chính Vietcombank'),
                              leading: const Icon(LucideIcons.tag, size: 18),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      PayoutFormSection(
                        title: 'Xác minh danh tính (PayOS)',
                        subtitle: 'Bắt buộc để chống rửa tiền và đảm bảo giải ngân đúng chủ',
                        trailing: ShadBadge.secondary(child: Text('KYC', style: theme.textTheme.small)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const PayoutFieldLabel(label: 'Số CCCD / CMND', required: true),
                            _input(
                              shadContext: shadContext,
                              controller: _idNumber,
                              placeholder: '12 số trên thẻ CCCD',
                              icon: LucideIcons.idCard,
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              maxLength: 12,
                              validator: _validateIdNumber,
                            ),
                            const SizedBox(height: 16),
                            const PayoutFieldLabel(label: 'Số điện thoại nhận OTP', required: true),
                            _input(
                              shadContext: shadContext,
                              controller: _phone,
                              placeholder: 'SĐT đăng ký PayOS / ví',
                              icon: LucideIcons.phone,
                              keyboardType: TextInputType.phone,
                              validator: _validatePhone,
                            ),
                            const SizedBox(height: 16),
                            const PayoutFieldLabel(label: 'Email liên hệ', required: true),
                            _input(
                              shadContext: shadContext,
                              controller: _email,
                              placeholder: 'partner@unimove.vn',
                              icon: LucideIcons.mail,
                              keyboardType: TextInputType.emailAddress,
                              validator: _validateEmail,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      PayoutFormSection(
                        title: 'Thông tin nhà xe',
                        subtitle: 'Khớp hồ sơ provider đã duyệt trên UniMove',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const PayoutFieldLabel(label: 'Tên nhà xe / doanh nghiệp', required: true),
                            _input(
                              shadContext: shadContext,
                              controller: _businessName,
                              placeholder: 'VD: Nhà xe Minh Quân',
                              icon: LucideIcons.building2,
                              validator: (v) => _required(v, msg: 'Nhập tên nhà xe'),
                            ),
                            const SizedBox(height: 16),
                            const PayoutFieldLabel(
                              label: 'Mã số thuế (MST)',
                              hint: 'Bắt buộc nếu nhà xe có đăng ký kinh doanh',
                            ),
                            _input(
                              shadContext: shadContext,
                              controller: _taxCode,
                              placeholder: 'VD: 0312345678',
                              icon: LucideIcons.fileText,
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      GlassCard(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                        child: CheckboxListTile(
                          value: _acceptedTerms,
                          onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
                          activeColor: c.primary,
                          controlAffinity: ListTileControlAffinity.leading,
                          title: Text(
                            'Tôi xác nhận thông tin chính xác và đồng ý UniMove / PayOS xác minh tài khoản trước khi giải ngân.',
                            style: theme.textTheme.small.copyWith(color: c.onSurface, height: 1.4),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Tiền chỉ chuyển sau khi khách xác nhận hoàn tất đơn. Sai tên chủ tài khoản có thể bị từ chối.',
                              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        value: _setDefault,
                        activeThumbColor: c.primary,
                        onChanged: (v) => setState(() => _setDefault = v),
                        title: Text(
                          'Đặt làm phương thức mặc định',
                          style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
                        ),
                        subtitle: Text(
                          'Ưu tiên giải ngân vào tài khoản này',
                          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                        ),
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.paddingOf(context).bottom),
                  decoration: BoxDecoration(
                    color: c.surface,
                    border: Border(top: BorderSide(color: c.glassBorder)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 12,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ShadButton(
                        width: double.infinity,
                        onPressed: _canSubmit ? _submit : null,
                        child: _saving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(LucideIcons.shieldCheck, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Xác minh & lưu qua PayOS',
                                    style: theme.textTheme.p.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.onPrimary,
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
          ),
        );
      },
    );
  }
}
