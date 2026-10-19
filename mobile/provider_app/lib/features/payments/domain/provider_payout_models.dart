/// Trạng thái xác minh PayOS khi liên kết tài khoản nhận tiền.
enum PayoutVerificationStatus {
  pending('Chờ xác minh'),
  verified('Đã xác minh'),
  failed('Xác minh thất bại');

  const PayoutVerificationStatus(this.label);
  final String label;
}

/// Phương thức nhận tiền của nhà xe — khớp `provider_profiles.bank_*` + ví điện tử.
enum ProviderPayoutKind {
  bank('Ngân hàng'),
  momo('Ví MoMo'),
  zalopay('ZaloPay');

  const ProviderPayoutKind(this.label);
  final String label;

  String get id => name;
}

class ProviderPayoutMethod {
  const ProviderPayoutMethod({
    required this.id,
    required this.kind,
    required this.displayName,
    required this.accountName,
    required this.accountNumber,
    this.bankName,
    this.bankCode,
    this.bankBin,
    this.branchName,
    this.phone,
    this.email,
    this.idNumber,
    this.taxCode,
    this.businessName,
    this.isDefault = false,
    this.isVerified = false,
    this.verificationStatus = PayoutVerificationStatus.verified,
  });

  final String id;
  final ProviderPayoutKind kind;
  final String displayName;
  final String accountName;
  final String accountNumber;
  final String? bankName;
  final String? bankCode;
  final String? bankBin;
  final String? branchName;
  final String? phone;
  final String? email;
  final String? idNumber;
  final String? taxCode;
  final String? businessName;
  final bool isDefault;
  final bool isVerified;
  final PayoutVerificationStatus verificationStatus;

  String get maskedAccount {
    final n = accountNumber.replaceAll(RegExp(r'\s'), '');
    if (n.length <= 4) return n;
    return '•••• ${n.substring(n.length - 4)}';
  }

  String get subtitle => switch (kind) {
        ProviderPayoutKind.bank => '${bankName ?? 'Ngân hàng'} · $maskedAccount',
        ProviderPayoutKind.momo => 'MoMo · $maskedAccount',
        ProviderPayoutKind.zalopay => 'ZaloPay · $maskedAccount',
      };

  Map<String, dynamic> toJson() => {
        'id': id,
        'kind': kind.name,
        'display_name': displayName,
        'account_name': accountName,
        'account_number': accountNumber,
        'bank_name': bankName,
        'bank_code': bankCode,
        'bank_bin': bankBin,
        'branch_name': branchName,
        'phone': phone,
        'email': email,
        'id_number': idNumber,
        'tax_code': taxCode,
        'business_name': businessName,
        'is_default': isDefault,
        'is_verified': isVerified,
        'verification_status': verificationStatus.name,
      };

  factory ProviderPayoutMethod.fromJson(Map<String, dynamic> json) {
    return ProviderPayoutMethod(
      id: json['id'] as String,
      kind: ProviderPayoutKind.values.firstWhere(
        (k) => k.name == json['kind'],
        orElse: () => ProviderPayoutKind.bank,
      ),
      displayName: json['display_name'] as String? ?? '',
      accountName: json['account_name'] as String? ?? '',
      accountNumber: json['account_number'] as String? ?? '',
      bankName: json['bank_name'] as String?,
      bankCode: json['bank_code'] as String?,
      bankBin: json['bank_bin'] as String?,
      branchName: json['branch_name'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      idNumber: json['id_number'] as String?,
      taxCode: json['tax_code'] as String?,
      businessName: json['business_name'] as String?,
      isDefault: json['is_default'] as bool? ?? false,
      isVerified: json['is_verified'] as bool? ?? false,
      verificationStatus: PayoutVerificationStatus.values.firstWhere(
        (s) => s.name == json['verification_status'],
        orElse: () => (json['is_verified'] as bool? ?? false)
            ? PayoutVerificationStatus.verified
            : PayoutVerificationStatus.pending,
      ),
    );
  }
}

/// Số dư ví nhà xe (demo).
class ProviderWalletBalance {
  const ProviderWalletBalance({
    required this.available,
    required this.pending,
    required this.totalEarned,
  });

  final int available;
  final int pending;
  final int totalEarned;
}

enum PayoutTransferStatus {
  pending('Đang xử lý'),
  completed('Đã chuyển'),
  failed('Thất bại');

  const PayoutTransferStatus(this.label);
  final String label;
}

class ProviderPayoutTransfer {
  const ProviderPayoutTransfer({
    required this.id,
    required this.amount,
    required this.status,
    required this.methodLabel,
    required this.createdAt,
    this.reference,
  });

  final String id;
  final int amount;
  final PayoutTransferStatus status;
  final String methodLabel;
  final DateTime createdAt;
  final String? reference;
}
