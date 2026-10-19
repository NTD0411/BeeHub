import '../../../core/mock/mock_provider_data.dart';
import '../domain/provider_payout_models.dart';

enum AccountLookupStatus { idle, loading, success, failed }

class AccountLookupResult {
  const AccountLookupResult._({required this.status, this.accountName, this.message});

  final AccountLookupStatus status;
  final String? accountName;
  final String? message;

  factory AccountLookupResult.idle() => const AccountLookupResult._(status: AccountLookupStatus.idle);

  factory AccountLookupResult.loading() => const AccountLookupResult._(status: AccountLookupStatus.loading);

  factory AccountLookupResult.success(String name) =>
      AccountLookupResult._(status: AccountLookupStatus.success, accountName: name);

  factory AccountLookupResult.failed(String message) =>
      AccountLookupResult._(status: AccountLookupStatus.failed, message: message);
}

/// Tra cứu tên chủ TK — mock; thay bằng `POST /api/providers/me/payout-accounts/lookup` khi có backend.
class ProviderPayoutLookupService {
  const ProviderPayoutLookupService();

  static const demoFailAccountSuffix = '0000';

  Future<AccountLookupResult> lookup({
    required ProviderPayoutKind kind,
    String? bankCode,
    required String accountNumber,
  }) async {
    final digits = accountNumber.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 8) {
      return AccountLookupResult.idle();
    }

    await Future<void>.delayed(const Duration(milliseconds: 850));

    if (digits.endsWith(demoFailAccountSuffix) || digits == '00000000') {
      return AccountLookupResult.failed('Không tra được tên chủ tài khoản — kiểm tra lại số TK');
    }

    final profileName = (MockProviderData.userJson['bank_account_name'] as String? ??
            MockProviderData.userJson['full_name'] as String? ??
            'NGUYEN VAN A')
        .toUpperCase();

    return switch (kind) {
      ProviderPayoutKind.bank => AccountLookupResult.success(profileName),
      ProviderPayoutKind.momo || ProviderPayoutKind.zalopay => AccountLookupResult.success(profileName),
    };
  }
}
