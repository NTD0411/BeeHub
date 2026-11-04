import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/auth/auth_token_storage.dart';
import '../../../core/network/api_client.dart';
import '../domain/provider_document_models.dart';

class ProviderDocumentsRepository {
  ProviderDocumentsRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  static const _storageKey = 'provider_documents_kyc_v2';
  final ApiClient _api;

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
    if (!await AuthTokenStorage.instance.isMockSession()) {
      final envelope = await _api.guard(() => _api.get('/providers/me/verification'));
      final data = Map<String, dynamic>.from(envelope['data'] as Map);
      final rawDocuments = (data['documents'] as List?) ?? const [];
      final docsByType = <String, Map<String, dynamic>>{
        for (final raw in rawDocuments)
          if (raw is Map) (raw['document_type'] as String? ?? ''): Map<String, dynamic>.from(raw),
      };
      final legacyIdCard = docsByType['id_card'];
      if (legacyIdCard != null) {
        docsByType.putIfAbsent('id_card_front', () => legacyIdCard);
        docsByType.putIfAbsent('id_card_back', () => legacyIdCard);
      }

      final statusValue = data['verification_status'] as String? ?? data['status'] as String? ?? 'incomplete';
      final kycStatus = switch (statusValue) {
        'approved' => ProviderKycStatus.approved,
        'pending' => ProviderKycStatus.pendingReview,
        'rejected' => ProviderKycStatus.rejected,
        _ => ProviderKycStatus.incomplete,
      };
      final documents = ProviderDocumentType.values.map((type) {
        final raw = docsByType[type.id];
        if (raw == null) return ProviderDocumentRecord(type: type, status: DocumentReviewStatus.notUploaded);
        final note = raw['notes'] as String?;
        final isVerified = raw['is_verified'] as bool? ?? false;
        final reviewStatus = isVerified
            ? DocumentReviewStatus.approved
            : (kycStatus == ProviderKycStatus.rejected || (note?.isNotEmpty ?? false))
                ? DocumentReviewStatus.rejected
                : kycStatus == ProviderKycStatus.pendingReview
                    ? DocumentReviewStatus.pending
                    : DocumentReviewStatus.uploaded;
        final url = raw['document_url'] as String?;
        return ProviderDocumentRecord(
          type: type,
          status: reviewStatus,
          documentNumber: raw['document_number'] as String?,
          expiryDate: raw['expiry_date'] != null ? DateTime.tryParse(raw['expiry_date'] as String) : null,
          uploadedAt: raw['created_at'] != null ? DateTime.tryParse(raw['created_at'] as String) : null,
          rejectionReason: note ?? (kycStatus == ProviderKycStatus.rejected ? data['verification_notes'] as String? : null),
          previewLabel: raw['file_name'] as String? ?? url?.split('/').last,
          documentUrl: url,
        );
      }).toList();

      return ProviderVerificationState(
        documents: documents,
        kycStatus: kycStatus,
        reviewNote: data['verification_notes'] as String?,
      );
    }

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
    required XFile file,
    String? documentNumber,
    DateTime? expiryDate,
    String previewLabel = 'Đã chọn ảnh',
  }) async {
    if (!await AuthTokenStorage.instance.isMockSession()) {
      final bytes = await file.readAsBytes();
      final form = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: file.name),
        'document_type': type.id,
        if (documentNumber != null && documentNumber.trim().isNotEmpty)
          'document_number': documentNumber.trim(),
        if (expiryDate != null) 'expiry_date': expiryDate.toIso8601String().split('T').first,
      });
      await _api.guard(() => _api.postMultipart('/providers/me/documents', form));
      return load();
    }

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
        documentUrl: null,
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
    if (!await AuthTokenStorage.instance.isMockSession()) {
      await _api.guard(() => _api.post('/providers/me/request-verification'));
      return load();
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
