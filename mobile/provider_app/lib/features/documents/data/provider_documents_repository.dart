import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/provider_document_models.dart';

class ProviderDocumentsRepository {
  static const _storageKey = 'provider_documents_kyc_v2';

  /// Provider demo đã nộp và được duyệt đủ giấy tờ.
  static ProviderVerificationState fullyVerifiedDemoState() {
    final submitted = DateTime(2026, 5, 12);
    final docs = ProviderDocumentType.values.map((t) {
      final (String? number, DateTime? expiry) = switch (t) {
        ProviderDocumentType.license => ('B2-123456', DateTime(2030, 8, 1)),
        ProviderDocumentType.vehicleRegistration => ('51C-12345', null),
        ProviderDocumentType.insurance => ('BH-2026-88421', DateTime(2027, 1, 1)),
        ProviderDocumentType.businessLicense => ('GPKD-0312789456', DateTime(2028, 12, 31)),
        _ => (null, null),
      };
      return ProviderDocumentRecord(
        type: t,
        status: DocumentReviewStatus.approved,
        previewLabel: '${t.id}.jpg',
        documentNumber: number,
        expiryDate: expiry,
        uploadedAt: submitted,
      );
    }).toList();

    return ProviderVerificationState(
      documents: docs,
      kycStatus: ProviderKycStatus.approved,
      submittedAt: submitted,
      reviewNote: null,
    );
  }

  /// Ghi trạng thái KYC đầy đủ cho tài khoản demo (gọi khi đăng nhập mock).
  Future<void> seedVerifiedDemoProvider() => save(fullyVerifiedDemoState());

  Future<ProviderVerificationState> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return _defaultState();
    final map = jsonDecode(raw) as Map<String, dynamic>;
    final docs = (map['documents'] as List<dynamic>)
        .map((e) => ProviderDocumentRecord.fromJson(e as Map<String, dynamic>))
        .toList();
    return ProviderVerificationState(
      documents: _mergeWithTemplate(docs),
      kycStatus: ProviderKycStatus.values.firstWhere(
        (s) => s.name == map['kyc_status'],
        orElse: () => ProviderKycStatus.incomplete,
      ),
      submittedAt: map['submitted_at'] != null
          ? DateTime.tryParse(map['submitted_at'] as String)
          : null,
      reviewNote: map['review_note'] as String?,
    );
  }

  Future<void> save(ProviderVerificationState state) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _storageKey,
      jsonEncode({
        'kyc_status': state.kycStatus.name,
        'submitted_at': state.submittedAt?.toIso8601String(),
        'review_note': state.reviewNote,
        'documents': state.documents.map((d) => d.toJson()).toList(),
      }),
    );
  }

  Future<ProviderVerificationState> uploadDocument({
    required ProviderDocumentType type,
    String? documentNumber,
    DateTime? expiryDate,
    String previewLabel = 'Đã chọn ảnh',
  }) async {
    final state = await load();
    final updated = state.documents.map((d) {
      if (d.type != type) return d;
      return d.copyWith(
        status: DocumentReviewStatus.pending,
        documentNumber: documentNumber,
        expiryDate: expiryDate,
        uploadedAt: DateTime.now(),
        rejectionReason: null,
        previewLabel: previewLabel,
      );
    }).toList();

    final newState = _recomputeKyc(state.copyWith(documents: updated));
    await save(newState);
    return newState;
  }

  Future<ProviderVerificationState> submitForReview() async {
    final state = await load();
    if (!state.allRequiredUploaded) {
      throw StateError('Chưa đủ giấy tờ bắt buộc');
    }
    final newState = state.copyWith(
      kycStatus: ProviderKycStatus.pendingReview,
      submittedAt: DateTime.now(),
      reviewNote: null,
    );
    await save(newState);
    return newState;
  }

  ProviderVerificationState _recomputeKyc(ProviderVerificationState state) {
    final required = state.requiredDocs;
    final allApproved = required.every((d) => d.status == DocumentReviewStatus.approved);
    final anyRejected = state.hasRejected;
    final allUploaded = state.allRequiredUploaded;
    final anyPending = required.any((d) => d.status == DocumentReviewStatus.pending);

    ProviderKycStatus kyc;
    if (anyRejected) {
      kyc = ProviderKycStatus.rejected;
    } else if (allApproved) {
      kyc = ProviderKycStatus.approved;
    } else if (allUploaded && (anyPending || state.kycStatus == ProviderKycStatus.pendingReview)) {
      kyc = ProviderKycStatus.pendingReview;
    } else {
      kyc = ProviderKycStatus.incomplete;
    }

    return state.copyWith(kycStatus: kyc);
  }

  ProviderVerificationState _defaultState() => fullyVerifiedDemoState();

  List<ProviderDocumentRecord> _mergeWithTemplate(List<ProviderDocumentRecord> saved) {
    return ProviderDocumentType.values.map((t) {
      final hit = saved.where((d) => d.type == t);
      return hit.isEmpty
          ? ProviderDocumentRecord(type: t, status: DocumentReviewStatus.notUploaded)
          : hit.first;
    }).toList();
  }
}

extension on ProviderVerificationState {
  ProviderVerificationState copyWith({
    List<ProviderDocumentRecord>? documents,
    ProviderKycStatus? kycStatus,
    DateTime? submittedAt,
    String? reviewNote,
  }) {
    return ProviderVerificationState(
      documents: documents ?? this.documents,
      kycStatus: kycStatus ?? this.kycStatus,
      submittedAt: submittedAt ?? this.submittedAt,
      reviewNote: reviewNote,
    );
  }
}
