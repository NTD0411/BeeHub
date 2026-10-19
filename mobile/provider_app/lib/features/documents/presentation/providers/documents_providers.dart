import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/provider_documents_repository.dart';
import '../../domain/provider_document_models.dart';

final providerDocumentsRepositoryProvider = Provider((ref) => ProviderDocumentsRepository());

final providerVerificationProvider = FutureProvider<ProviderVerificationState>((ref) async {
  return ref.read(providerDocumentsRepositoryProvider).load();
});
