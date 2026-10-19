import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import '../domain/provider_payout_models.dart';

class ProviderPayoutRepository {
  static const _methodsKey = 'provider_payout_methods_v1';

  Future<List<ProviderPayoutMethod>> fetchMethods() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_methodsKey);
    if (raw == null || raw.isEmpty) return _defaultMethods();
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) => ProviderPayoutMethod.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> saveMethods(List<ProviderPayoutMethod> methods) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _methodsKey,
      jsonEncode(methods.map((m) => m.toJson()).toList()),
    );
  }

  Future<ProviderPayoutMethod> addMethod(ProviderPayoutMethod draft) async {
    final methods = await fetchMethods();
    final id = draft.id.isNotEmpty ? draft.id : 'pm-${DateTime.now().millisecondsSinceEpoch}';
    final method = _copy(
      draft,
      id: id,
      isDefault: methods.isEmpty || draft.isDefault,
      isVerified: draft.verificationStatus == PayoutVerificationStatus.verified,
    );

    if (method.isDefault) {
      for (var i = 0; i < methods.length; i++) {
        methods[i] = _copy(methods[i], isDefault: false);
      }
    }

    methods.add(method);
    await saveMethods(methods);
    return method;
  }

  Future<void> setDefault(String methodId) async {
    final methods = await fetchMethods();
    final updated = methods.map((m) => _copy(m, isDefault: m.id == methodId)).toList();
    await saveMethods(updated);
  }

  Future<void> removeMethod(String methodId) async {
    final methods = await fetchMethods()..removeWhere((m) => m.id == methodId);
    if (methods.isNotEmpty && !methods.any((m) => m.isDefault)) {
      methods[0] = _copy(methods[0], isDefault: true);
    }
    await saveMethods(methods);
  }

  ProviderPayoutMethod _copy(
    ProviderPayoutMethod m, {
    String? id,
    bool? isDefault,
    bool? isVerified,
    PayoutVerificationStatus? verificationStatus,
  }) {
    return ProviderPayoutMethod(
      id: id ?? m.id,
      kind: m.kind,
      displayName: m.displayName,
      accountName: m.accountName,
      accountNumber: m.accountNumber,
      bankName: m.bankName,
      bankCode: m.bankCode,
      bankBin: m.bankBin,
      branchName: m.branchName,
      phone: m.phone,
      email: m.email,
      idNumber: m.idNumber,
      taxCode: m.taxCode,
      businessName: m.businessName,
      isDefault: isDefault ?? m.isDefault,
      isVerified: isVerified ?? m.isVerified,
      verificationStatus: verificationStatus ?? m.verificationStatus,
    );
  }

  ProviderWalletBalance walletFromCompletedEarnings(int netMonth, int pendingOrders) {
    return ProviderWalletBalance(
      available: (netMonth * 0.72).round(),
      pending: pendingOrders,
      totalEarned: netMonth + 12450000,
    );
  }

  List<ProviderPayoutTransfer> mockTransfers() {
    return [
      ProviderPayoutTransfer(
        id: 't1',
        amount: 2450000,
        status: PayoutTransferStatus.completed,
        methodLabel: 'Vietcombank ·••• 7890',
        createdAt: DateTime(2026, 6, 1, 9, 0),
        reference: 'UM-PAY-240601',
      ),
      ProviderPayoutTransfer(
        id: 't2',
        amount: 1820000,
        status: PayoutTransferStatus.completed,
        methodLabel: 'MoMo ·••• 4567',
        createdAt: DateTime(2026, 5, 28, 14, 30),
        reference: 'UM-PAY-240528',
      ),
      ProviderPayoutTransfer(
        id: 't3',
        amount: 980000,
        status: PayoutTransferStatus.pending,
        methodLabel: 'Vietcombank ·••• 7890',
        createdAt: DateTime(2026, 6, 3, 8, 0),
      ),
    ];
  }

  List<ProviderPayoutMethod> _defaultMethods() {
    return const [
      ProviderPayoutMethod(
        id: 'default-bank',
        kind: ProviderPayoutKind.bank,
        displayName: 'Tài khoản chính',
        accountName: 'MINH QUAN',
        accountNumber: '0123456789',
        bankName: 'Vietcombank',
        bankCode: 'VCB',
        bankBin: '970436',
        isDefault: true,
        isVerified: true,
        verificationStatus: PayoutVerificationStatus.verified,
      ),
      ProviderPayoutMethod(
        id: 'default-momo',
        kind: ProviderPayoutKind.momo,
        displayName: 'Ví MoMo',
        accountName: 'MINH QUAN',
        accountNumber: '0903456789',
        isDefault: false,
        isVerified: true,
      ),
    ];
  }
}
