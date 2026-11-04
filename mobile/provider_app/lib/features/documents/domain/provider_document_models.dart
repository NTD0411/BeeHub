/// Loại giấy tờ — khớp `provider_documents.document_type`.
enum ProviderDocumentType {
  idCardFront('id_card_front', 'CCCD / CMND — Mặt trước', true),
  idCardBack('id_card_back', 'CCCD / CMND — Mặt sau', true),
  license('license', 'Giấy phép lái xe', true),
  vehicleRegistration('vehicle_registration', 'Đăng ký phương tiện', true),
  vehiclePhoto('vehicle_photo', 'Ảnh xe (ngoại thất)', false),
  insurance('insurance', 'Bảo hiểm vận chuyển', false),
  businessLicense('business_license', 'Giấy phép kinh doanh vận tải', false);

  const ProviderDocumentType(this.id, this.label, this.required);

  final String id;
  final String label;
  final bool required;
}

enum DocumentReviewStatus {
  notUploaded('Chưa nộp'),
  uploaded('Đã tải lên'),
  pending('Chờ duyệt'),
  approved('Đã duyệt'),
  rejected('Từ chối');

  const DocumentReviewStatus(this.label);
  final String label;
}

enum ProviderKycStatus {
  incomplete('Chưa đủ hồ sơ'),
  pendingReview('Đang chờ duyệt'),
  approved('Đã xác thực'),
  rejected('Bị từ chối');

  const ProviderKycStatus(this.label);
  final String label;
}

class ProviderDocumentRecord {
  const ProviderDocumentRecord({
    required this.type,
    required this.status,
    this.documentNumber,
    this.expiryDate,
    this.uploadedAt,
    this.rejectionReason,
    this.previewLabel,
    this.documentUrl,
  });

  final ProviderDocumentType type;
  final DocumentReviewStatus status;
  final String? documentNumber;
  final DateTime? expiryDate;
  final DateTime? uploadedAt;
  final String? rejectionReason;
  final String? previewLabel;
  final String? documentUrl;

  bool get isComplete => status == DocumentReviewStatus.approved;

  Map<String, dynamic> toJson() => {
        'type': type.id,
        'status': status.name,
        'document_number': documentNumber,
        'expiry_date': expiryDate?.toIso8601String(),
        'uploaded_at': uploadedAt?.toIso8601String(),
        'rejection_reason': rejectionReason,
        'preview_label': previewLabel,
        'document_url': documentUrl,
      };

  factory ProviderDocumentRecord.fromJson(Map<String, dynamic> json) {
    return ProviderDocumentRecord(
      type: ProviderDocumentType.values.firstWhere((t) => t.id == json['type']),
      status: DocumentReviewStatus.values.firstWhere((s) => s.name == json['status']),
      documentNumber: json['document_number'] as String?,
      expiryDate: json['expiry_date'] != null ? DateTime.tryParse(json['expiry_date'] as String) : null,
      uploadedAt: json['uploaded_at'] != null ? DateTime.tryParse(json['uploaded_at'] as String) : null,
      rejectionReason: json['rejection_reason'] as String?,
      previewLabel: json['preview_label'] as String?,
      documentUrl: json['document_url'] as String?,
    );
  }

  ProviderDocumentRecord copyWith({
    DocumentReviewStatus? status,
    String? documentNumber,
    DateTime? expiryDate,
    DateTime? uploadedAt,
    String? rejectionReason,
    String? previewLabel,
    String? documentUrl,
  }) {
    return ProviderDocumentRecord(
      type: type,
      status: status ?? this.status,
      documentNumber: documentNumber ?? this.documentNumber,
      expiryDate: expiryDate ?? this.expiryDate,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      previewLabel: previewLabel ?? this.previewLabel,
      documentUrl: documentUrl ?? this.documentUrl,
    );
  }
}

class ProviderVerificationState {
  const ProviderVerificationState({
    required this.documents,
    required this.kycStatus,
    this.submittedAt,
    this.reviewNote,
  });

  final List<ProviderDocumentRecord> documents;
  final ProviderKycStatus kycStatus;
  final DateTime? submittedAt;
  final String? reviewNote;

  List<ProviderDocumentRecord> get requiredDocs =>
      documents.where((d) => d.type.required).toList();

  List<ProviderDocumentRecord> get optionalDocs =>
      documents.where((d) => !d.type.required).toList();

  int get approvedRequiredCount => requiredDocs.where((d) => d.isComplete).length;

  int get uploadedRequiredCount =>
      requiredDocs.where((d) => d.status != DocumentReviewStatus.notUploaded).length;

  int get requiredCount => requiredDocs.length;

  double get requiredProgress => requiredCount == 0 ? 0 : uploadedRequiredCount / requiredCount;

  bool get allRequiredUploaded =>
      requiredDocs.every((d) => d.status != DocumentReviewStatus.notUploaded);

  bool get canGoOnline => kycStatus == ProviderKycStatus.approved;

  bool get hasRejected =>
      documents.any((d) => d.status == DocumentReviewStatus.rejected);
}
