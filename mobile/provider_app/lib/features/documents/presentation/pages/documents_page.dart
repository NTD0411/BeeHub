import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/provider_document_models.dart';
import '../providers/documents_providers.dart';
import '../widgets/document_upload_sheet.dart';

class DocumentsPage extends ConsumerStatefulWidget {
  const DocumentsPage({super.key});

  @override
  ConsumerState<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends ConsumerState<DocumentsPage> {
  bool _submitting = false;

  Future<void> _openUpload(ProviderDocumentRecord record) async {
    if (record.status == DocumentReviewStatus.pending ||
        record.status == DocumentReviewStatus.approved) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            record.status == DocumentReviewStatus.approved
                ? 'Giấy tờ đã được duyệt'
                : 'Giấy tờ đang chờ duyệt — không thể thay đổi',
          ),
        ),
      );
      return;
    }

    final result = await showModalBottomSheet<({
      String? documentNumber,
      DateTime? expiryDate,
      String previewLabel,
    })>(
      context: context,
      isScrollControlled: true,
      backgroundColor: UniMoveColors.of(context).surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DocumentUploadSheet(record: record),
    );

    if (result == null || !mounted) return;

    final repo = ref.read(providerDocumentsRepositoryProvider);
    await repo.uploadDocument(
      type: record.type,
      documentNumber: result.documentNumber,
      expiryDate: result.expiryDate,
      previewLabel: result.previewLabel,
    );
    ref.invalidate(providerVerificationProvider);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã gửi giấy tờ — chờ admin duyệt')),
      );
    }
  }

  Future<void> _submitProfile() async {
    setState(() => _submitting = true);
    try {
      final repo = ref.read(providerDocumentsRepositoryProvider);
      await repo.submitForReview();
      ref.invalidate(providerVerificationProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi hồ sơ xác thực. Thường duyệt trong 24–48 giờ.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Bad state: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final verificationAsync = ref.watch(providerVerificationProvider);
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: ShadIconButton.ghost(
              icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
              onPressed: () => context.pop(),
            ),
            title: Text(
              'Giấy tờ & xác thực',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
            ),
          ),
          body: verificationAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Lỗi: $e', style: TextStyle(color: c.onSurface))),
            data: (state) {
              final progress = (state.requiredProgress * 100).round();
              final canSubmitReview = state.allRequiredUploaded &&
                  state.kycStatus != ProviderKycStatus.pendingReview &&
                  state.kycStatus != ProviderKycStatus.approved;

              return Column(
                children: [
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: () async => ref.invalidate(providerVerificationProvider),
                      color: c.primary,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                        children: [
                          _progressHero(theme, c, state, progress),
                          const SizedBox(height: 16),
                          _statusBanner(theme, c, state),
                          const SizedBox(height: 24),
                          _sectionTitle(theme, c, 'Quy trình'),
                          const SizedBox(height: 10),
                          _stepsCard(theme, c, state),
                          const SizedBox(height: 24),
                          _sectionTitle(theme, c, 'Giấy tờ bắt buộc'),
                          const SizedBox(height: 4),
                          Text(
                            'Hoàn thành ${state.approvedRequiredCount}/${state.requiredCount} để được nhận đơn',
                            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                          ),
                          const SizedBox(height: 12),
                          ...state.requiredDocs.map((d) => _DocumentTile(
                                record: d,
                                onAction: () => _openUpload(d),
                              )),
                          if (state.optionalDocs.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            _sectionTitle(theme, c, 'Giấy tờ bổ sung'),
                            const SizedBox(height: 12),
                            ...state.optionalDocs.map((d) => _DocumentTile(
                                  record: d,
                                  onAction: () => _openUpload(d),
                                )),
                          ],
                          const SizedBox(height: 16),
                          GlassCard(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(LucideIcons.helpCircle, size: 18, color: c.primaryLight),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'Ảnh phải rõ, không lóa, không cắt góc. Thông tin trùng với hồ sơ đăng ký. Sai sót sẽ bị từ chối và yêu cầu nộp lại.',
                                    style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.4),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ),
                  if (canSubmitReview)
                    _bottomBar(theme, c, submitting: _submitting, onSubmit: _submitProfile),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Widget _sectionTitle(ShadThemeData theme, UniMoveColors c, String text) {
    return Text(text, style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface));
  }

  Widget _progressHero(ShadThemeData theme, UniMoveColors c, ProviderVerificationState state, int progress) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [c.primary, c.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            height: 72,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: state.requiredProgress,
                  strokeWidth: 6,
                  backgroundColor: Colors.white24,
                  color: Colors.white,
                ),
                Text(
                  '$progress%',
                  style: theme.textTheme.p.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tiến độ xác thực',
                  style: theme.textTheme.small.copyWith(color: Colors.white70, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Text(
                  state.kycStatus.label,
                  style: theme.textTheme.h4.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  '${state.approvedRequiredCount} giấy tờ bắt buộc đã duyệt',
                  style: theme.textTheme.small.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBanner(ShadThemeData theme, UniMoveColors c, ProviderVerificationState state) {
    final (Color bg, Color fg, IconData icon, String title, String body) = switch (state.kycStatus) {
      ProviderKycStatus.approved => (
          c.success.withValues(alpha: 0.12),
          c.success,
          LucideIcons.circleCheck,
          'Đã xác thực đầy đủ',
          'Bạn có thể bật trạng thái online và nhận đơn mới.',
        ),
      ProviderKycStatus.pendingReview => (
          Colors.orange.withValues(alpha: 0.12),
          Colors.orange.shade800,
          LucideIcons.clock,
          'Hồ sơ đang chờ duyệt',
          'Đội vận hành đang kiểm tra giấy tờ. Bạn chưa thể nhận đơn mới.',
        ),
      ProviderKycStatus.rejected => (
          AppColors.error.withValues(alpha: 0.12),
          AppColors.error,
          LucideIcons.circleAlert,
          'Hồ sơ bị từ chối',
          state.reviewNote ?? 'Vui lòng nộp lại giấy tờ bị từ chối bên dưới.',
        ),
      ProviderKycStatus.incomplete => (
          c.primary.withValues(alpha: 0.1),
          c.primaryLight,
          LucideIcons.fileWarning,
          'Chưa đủ hồ sơ',
          'Nộp đủ giấy tờ bắt buộc và gửi duyệt để được kích hoạt tài khoản tài xế.',
        ),
    };

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: fg, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
                const SizedBox(height: 4),
                Text(body, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepsCard(ShadThemeData theme, UniMoveColors c, ProviderVerificationState state) {
    final steps = [
      ('1', 'Tải giấy tờ', state.allRequiredUploaded),
      ('2', 'Gửi duyệt', state.kycStatus == ProviderKycStatus.pendingReview ||
          state.kycStatus == ProviderKycStatus.approved),
      ('3', 'Nhận đơn', state.canGoOnline),
    ];

    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: Row(
        children: [
          for (var i = 0; i < steps.length; i++) ...[
            if (i > 0)
              Expanded(
                child: Container(
                  height: 2,
                  margin: const EdgeInsets.only(bottom: 20),
                  color: steps[i - 1].$3 ? c.primaryLight : c.glassBorder,
                ),
              ),
            Expanded(
              child: Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: steps[i].$3 ? c.primary : c.iconBgTertiary,
                    ),
                    child: Text(
                      steps[i].$1,
                      style: theme.textTheme.small.copyWith(
                        color: steps[i].$3 ? Colors.white : c.onSurfaceMuted,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    steps[i].$2,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.small.copyWith(
                      color: steps[i].$3 ? c.onSurface : c.onSurfaceMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _bottomBar(
    ShadThemeData theme,
    UniMoveColors c, {
    required bool submitting,
    required VoidCallback onSubmit,
  }) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.glassBorder)),
      ),
      child: ShadButton(
        width: double.infinity,
        onPressed: submitting ? null : onSubmit,
        child: submitting
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : const Text('Gửi hồ sơ xác thực'),
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({required this.record, required this.onAction});

  final ProviderDocumentRecord record;
  final VoidCallback onAction;

  IconData get _icon => switch (record.type) {
        ProviderDocumentType.idCardFront || ProviderDocumentType.idCardBack => LucideIcons.idCard,
        ProviderDocumentType.license => LucideIcons.car,
        ProviderDocumentType.vehicleRegistration => LucideIcons.fileText,
        ProviderDocumentType.vehiclePhoto => LucideIcons.camera,
        ProviderDocumentType.insurance => LucideIcons.shield,
        ProviderDocumentType.businessLicense => LucideIcons.building2,
      };

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        final (Color chipBg, Color chipFg) = switch (record.status) {
          DocumentReviewStatus.approved => (c.success.withValues(alpha: 0.12), c.success),
          DocumentReviewStatus.pending => (Colors.orange.withValues(alpha: 0.12), Colors.orange.shade800),
          DocumentReviewStatus.rejected => (AppColors.error.withValues(alpha: 0.12), AppColors.error),
          DocumentReviewStatus.notUploaded => (c.iconBgTertiary, c.onSurfaceMuted),
        };

        final actionLabel = switch (record.status) {
          DocumentReviewStatus.notUploaded => 'Tải lên',
          DocumentReviewStatus.rejected => 'Nộp lại',
          DocumentReviewStatus.pending => 'Đã gửi',
          DocumentReviewStatus.approved => 'Đã duyệt',
        };

        final canTap = record.status == DocumentReviewStatus.notUploaded ||
            record.status == DocumentReviewStatus.rejected;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: c.iconBgTertiary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(_icon, color: c.primaryLight, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            record.type.label,
                            style: theme.textTheme.p.copyWith(
                              fontWeight: FontWeight.w800,
                              color: c.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: chipBg,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  record.status.label,
                                  style: theme.textTheme.small.copyWith(
                                    color: chipFg,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                              if (record.type.required)
                                Text(
                                  'Bắt buộc',
                                  style: theme.textTheme.small.copyWith(
                                    color: c.onSurfaceMuted,
                                    fontSize: 10,
                                  ),
                                ),
                            ],
                          ),
                          if (record.documentNumber != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Số: ${record.documentNumber}',
                              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                            ),
                          ],
                          if (record.expiryDate != null) ...[
                            Text(
                              'Hết hạn: ${record.expiryDate!.day}/${record.expiryDate!.month}/${record.expiryDate!.year}',
                              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                if (record.status == DocumentReviewStatus.rejected &&
                    (record.rejectionReason ?? '').isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    record.rejectionReason!,
                    style: theme.textTheme.small.copyWith(color: AppColors.error, height: 1.3),
                  ),
                ],
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: ShadButton.outline(
                    size: ShadButtonSize.sm,
                    onPressed: canTap ? onAction : null,
                    child: Text(actionLabel),
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
