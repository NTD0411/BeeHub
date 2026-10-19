import '../../../../core/location/geo_distance.dart';
import '../../domain/booking_models.dart';
import '../../domain/quote_models.dart';

class BookingFlowState {
  const BookingFlowState({
    this.serviceType = BookingServiceType.fullMove,
    this.pickup = '',
    this.pickupLat,
    this.pickupLng,
    this.destination = '',
    this.destinationLat,
    this.destinationLng,
    this.placeSuggestions = const [],
    this.loadingPlaceSuggestions = false,
    this.resolvingDestination = false,
    this.selectedTier = ServiceTier.standard,
    this.selectedPartnerId,
    this.selectedLaborProviderId,
    this.paymentMethod = PaymentMethod.payos,
    this.discountCode = '',
    this.discountApplied = false,
    this.loadingPlaces = false,
    this.loadingPickup = false,
    this.loadingPartners = false,
    this.loadingLaborQuotes = false,
    this.recentPlaces = const [],
    this.packages = const [],
    this.partners = const [],
    this.laborQuotes = const [],
    this.helperCount = 0,
    this.laborHours = 2,
    this.floorCount = 1,
    this.hasElevator = true,
    this.pickupFloor = 1,
    this.pickupHasElevator = true,
    this.pickupAlleyAccess = AlleyAccess.unknown,
    this.destinationAlleyAccess = AlleyAccess.unknown,
    this.cargoVolume = CargoVolume.medium,
    this.dormNote = '',
    this.dormPhotos = const {},
    this.dormImageUrls = const [],
    this.laborNote = '',
    this.linkedOrderId,
    this.linkedOrderNumber,
    this.linkedProviderName,
    this.quickCompareEntry = false,
    this.passItemDelivery = false,
    this.passItemId,
    this.isComboBooking = false,
    this.isQuoteBooking = false,
    this.quoteReferenceId,
    this.quoteProviderName,
    this.quoteBasePrice = 0,
    this.quoteSurcharges = const [],
    this.selectedComboLaborCount = 0,
    this.wantsRetailLabor = false,
    this.wantsTransportLabor = false,
    this.transportLaborHelpers = 2,
    this.transportLaborHours = 2,
    this.insurancePlans = const [],
    this.selectedInsurancePlanId,
    this.loadingInsurancePlans = false,
    this.scheduledPickupAt,
    this.comboFlowHint,
    this.quoteFlowHint,
    this.mapPreviewUrl,
  });

  static const defaultComboFlowHint =
      'Combo — giá niêm yết, không chờ báo giá. Bước sau: mô tả trọ → chọn ngày giờ → chọn gói.';

  static const defaultQuoteFlowHint = QuoteFlowHint(
    title: 'Báo giá minh bạch',
    subtitle: 'Bước tiếp: mô tả trọ → chọn giờ → nhà xe báo giá theo khung đó.',
  );

  final BookingServiceType serviceType;
  final String pickup;
  final double? pickupLat;
  final double? pickupLng;
  final String destination;
  final double? destinationLat;
  final double? destinationLng;
  final List<PlaceSuggestion> placeSuggestions;
  final bool loadingPlaceSuggestions;
  final bool resolvingDestination;
  final ServiceTier selectedTier;
  final String? selectedPartnerId;
  final String? selectedLaborProviderId;
  final PaymentMethod paymentMethod;
  final String discountCode;
  final bool discountApplied;
  final bool loadingPlaces;
  final bool loadingPickup;
  final bool loadingPartners;
  final bool loadingLaborQuotes;
  final List<RecentPlace> recentPlaces;
  final List<ServicePackage> packages;
  final List<PartnerOffer> partners;
  final List<LaborProviderQuote> laborQuotes;
  final int helperCount;
  final int laborHours;
  final int floorCount;
  final bool hasElevator;
  final int pickupFloor;
  final bool pickupHasElevator;
  final AlleyAccess pickupAlleyAccess;
  final AlleyAccess destinationAlleyAccess;
  final CargoVolume cargoVolume;
  final String dormNote;
  final Map<DormPhotoSection, List<String>> dormPhotos;

  /// URL sau khi upload (khi gửi yêu cầu báo giá).
  final List<String> dormImageUrls;

  List<String> get dormImagePaths =>
      dormPhotos.values.expand((paths) => paths).toList(growable: false);

  int get dormImageCount => dormImagePaths.length;

  Iterable<String> get activeDormImagePaths sync* {
    for (final section in DormPhotoSection.values) {
      if (section.isVisible(
        pickupHasElevator: pickupHasElevator,
        pickupAlley: pickupAlleyAccess,
        destinationHasElevator: hasElevator,
        destinationAlley: destinationAlleyAccess,
        cargoVolume: cargoVolume,
      )) {
        yield* dormPhotos[section] ?? const [];
      }
    }
  }
  final String laborNote;
  final String? linkedOrderId;
  final String? linkedOrderNumber;
  final String? linkedProviderName;

  /// Vào từ "So sánh báo giá" trên Home — đã có địa điểm mẫu, bỏ qua bước chọn điểm.
  final bool quickCompareEntry;

  /// Đặt xe lấy đồ từ tin pass đồ — điểm lấy đã là khu vực người bán.
  final bool passItemDelivery;

  /// Tin pass đồ liên kết (khóa huỷ chốt khi khách đã đặt xe).
  final String? passItemId;

  /// Đặt qua combo niêm yết (xe+km cố định, nhà xe chỉ đặt giá khuân vác).
  final bool isComboBooking;

  /// Đặt chuyến linh hoạt qua luồng báo giá (đã chốt nhà xe, chờ đặt cọc).
  final bool isQuoteBooking;
  final String? quoteReferenceId;
  final String? quoteProviderName;
  final int quoteBasePrice;
  final List<QuoteSurchargeLine> quoteSurcharges;

  /// Số người khuân vác trong combo (0 = dùng [ServicePackage.laborSuggested]).
  final int selectedComboLaborCount;

  /// Khách chọn thuê thêm khuân vác riêng (giá retail, đối tác báo giá).
  final bool wantsRetailLabor;

  /// Đặt chuyến thường — muốn nhà xe báo giá kèm khuân vác ngay từ đầu.
  final bool wantsTransportLabor;
  final int transportLaborHelpers;
  final int transportLaborHours;

  final List<CargoInsurancePlan> insurancePlans;
  final String? selectedInsurancePlanId;
  final bool loadingInsurancePlans;

  /// Thời điểm nhà xe bắt đầu lấy đồ — vận chuyển chỉ diễn ra từ khung giờ này.
  final DateTime? scheduledPickupAt;
  final String? comboFlowHint;
  final QuoteFlowHint? quoteFlowHint;
  final String? mapPreviewUrl;

  bool get hasScheduledPickup => scheduledPickupAt != null;

  /// Khoảng cách ước lượng điểm lấy → điểm giao (km), khi đủ tọa độ.
  double? get routeDistanceKm {
    if (pickupLat == null || pickupLng == null || destinationLat == null || destinationLng == null) {
      return null;
    }
    return haversineKm(pickupLat!, pickupLng!, destinationLat!, destinationLng!);
  }

  /// Gợi ý loại đặt xe cho luồng pass đồ.
  String get passItemTransportHint {
    final km = routeDistanceKm;
    if (km == null) {
      return 'Nhập địa chỉ nhận để xem khoảng cách và chọn combo hay chuyến thường.';
    }
    final label = km.toStringAsFixed(1);
    if (km <= 8) {
      return 'Khoảng $label km — combo thường rẻ và gọn cho đồ lẻ trong thành phố.';
    }
    if (km <= 15) {
      return 'Khoảng $label km — combo hoặc chuyến thường đều phù hợp, tùy ngân sách.';
    }
    return 'Khoảng $label km — nên đặt chuyến thường để nhà xe báo giá linh hoạt theo km.';
  }

  bool get passItemPrefersCombo {
    final km = routeDistanceKm;
    return km != null && km <= 10;
  }

  bool get isLaborOnly => serviceType == BookingServiceType.laborOnly;

  bool get isLaborAddon => serviceType == BookingServiceType.laborAddon;

  bool get isLaborService => isLaborOnly || isLaborAddon;

  bool get requiresHelpers => isLaborService;

  ServicePackage? get selectedPackage {
    for (final p in packages) {
      if (p.tier == selectedTier) return p;
    }
    return null;
  }

  PartnerOffer? get selectedPartner {
    if (selectedPartnerId == null) return null;
    for (final p in partners) {
      if (p.id == selectedPartnerId) return p;
    }
    return null;
  }

  LaborProviderQuote? get selectedLaborProvider {
    if (selectedLaborProviderId == null) return null;
    for (final q in laborQuotes) {
      if (q.id == selectedLaborProviderId) return q;
    }
    return null;
  }

  int get effectiveComboLaborCount {
    final pkg = selectedPackage;
    if (pkg == null) return 0;
    if (selectedComboLaborCount > 0) return selectedComboLaborCount;
    return pkg.laborSuggested;
  }

  int get baseLaborFee =>
      isLaborService ? helperCount * laborHours * LaborPricing.perHelperPerHour : 0;

  /// Tạm tính trước khi chọn đối tác (chưa gồm markup marketplace).
  int get laborFee => baseLaborFee;

  int get floorFee => isLaborService && !hasElevator && floorCount > 0
      ? floorCount * LaborPricing.perFloorNoElevator
      : 0;

  String get pickupAccessSummary =>
      'Tầng $pickupFloor · ${pickupHasElevator ? 'có thang máy' : 'không thang máy'} · ${pickupAlleyAccess.label}';

  String get destinationAccessSummary =>
      'Tầng $floorCount · ${hasElevator ? 'có thang máy' : 'không thang máy'} · ${destinationAlleyAccess.label}';

  String get dormDetailsSummary {
    final buf = StringBuffer()
      ..writeln('Trọ cũ: $pickupAccessSummary')
      ..writeln('Trọ mới: $destinationAccessSummary')
      ..writeln('Đồ: ${cargoVolume.label} (${cargoVolume.examples})');
    if (wantsTransportLabor && !isComboBooking) {
      buf.writeln('Khuân vác: $transportLaborHelpers người · $transportLaborHours giờ (nhà xe báo giá)');
    }
    if (dormNote.trim().isNotEmpty) {
      buf.writeln('Ghi chú: ${dormNote.trim()}');
    }
    if (dormImageCount > 0) {
      final labels = DormPhotoSection.values
          .where((s) => (dormPhotos[s] ?? []).isNotEmpty)
          .map((s) => '${s.label} (${dormPhotos[s]!.length})')
          .join(', ');
      buf.write('Ảnh: $labels');
    }
    return buf.toString().trim();
  }

  /// Giá khuân vác từ đối tác đã chọn (marketplace).
  int get laborQuotedPrice =>
      selectedLaborProvider?.price ?? (baseLaborFee + floorFee);

  /// Giá xe + km niêm yết (cố định theo combo app).
  int get movePackagePrice =>
      isLaborService ? 0 : (selectedPackage?.transportBasePrice ?? 300000);

  /// Đơn giá khuân vác/người — nhà xe combo đặt; mặc định lấy từ catalog app.
  int get effectiveComboLaborUnitPrice {
    final pkg = selectedPackage;
    if (pkg == null) return 0;
    if (isComboBooking && selectedPartner?.comboLaborUnitPrice != null) {
      return selectedPartner!.comboLaborUnitPrice!;
    }
    return pkg.extraLaborComboPrice;
  }

  /// Khuân vác trong combo theo số người khách chọn.
  int get comboLaborFee {
    if (isLaborService) return 0;
    return effectiveComboLaborCount * effectiveComboLaborUnitPrice;
  }

  /// Tổng combo niêm yết với 1 nhà xe (xe/km cố định + khuân vác nhà xe).
  int comboTotalForPartner(PartnerOffer partner) {
    final pkg = selectedPackage;
    if (pkg == null) return 0;
    final laborUnit = partner.comboLaborUnitPrice ?? pkg.extraLaborComboPrice;
    return pkg.transportBasePrice + effectiveComboLaborCount * laborUnit;
  }

  /// Khuân vác riêng thêm vào chuyến fullMove — giá retail do đối tác báo.
  int get retailLaborFee {
    if (!wantsRetailLabor || isLaborService) return 0;
    return selectedLaborProvider?.price ?? 0;
  }

  CargoInsurancePlan? get selectedInsurancePlan {
    if (selectedInsurancePlanId == null) return null;
    for (final p in insurancePlans) {
      if (p.id == selectedInsurancePlanId) return p;
    }
    return null;
  }

  bool get hasInsuranceCoverage {
    final plan = selectedInsurancePlan;
    return plan != null && !plan.isNoCoverage;
  }

  int get insuranceFee {
    if (isLaborService) return 0;
    final plan = selectedInsurancePlan;
    if (plan == null || plan.isNoCoverage) return 0;
    return plan.price;
  }

  /// Giá vận chuyển do nhà xe báo (đặt chuyến linh hoạt — không qua combo).
  int get partnerTransportPrice {
    if (isLaborService || isComboBooking) return 0;
    return selectedPartner?.price ?? 0;
  }

  int get quoteSurchargeTotal => quoteSurcharges.fold(0, (sum, s) => sum + s.amount);

  int get quoteQuotedTotal => quoteBasePrice + quoteSurchargeTotal;

  int get subtotal {
    if (isQuoteBooking) return quoteQuotedTotal;
    if (isLaborService) return laborQuotedPrice;
    if (isComboBooking) {
      return movePackagePrice + comboLaborFee + retailLaborFee + insuranceFee;
    }
    return partnerTransportPrice + retailLaborFee + insuranceFee;
  }

  int get discount => discountApplied ? 35000 : 0;

  int get serviceFee => 0;

  int get total => subtotal - discount + serviceFee;

  String get scheduledPickupLabel {
    final dt = scheduledPickupAt;
    if (dt == null) return 'Chưa chọn';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final pickedDay = DateTime(dt.year, dt.month, dt.day);
    final dayLabel = pickedDay == today
        ? 'Hôm nay'
        : pickedDay == today.add(const Duration(days: 1))
            ? 'Ngày mai'
            : '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$dayLabel · $h:$m';
  }

  BookingFlowState copyWith({
    BookingServiceType? serviceType,
    String? pickup,
    double? pickupLat,
    double? pickupLng,
    String? destination,
    bool clearPickupCoords = false,
    double? destinationLat,
    double? destinationLng,
    List<PlaceSuggestion>? placeSuggestions,
    bool? loadingPlaceSuggestions,
    bool? resolvingDestination,
    bool clearDestinationCoords = false,
    bool clearPlaceSuggestions = false,
    ServiceTier? selectedTier,
    String? selectedPartnerId,
    String? selectedLaborProviderId,
    PaymentMethod? paymentMethod,
    String? discountCode,
    bool? discountApplied,
    bool? loadingPlaces,
    bool? loadingPickup,
    bool? loadingPartners,
    bool? loadingLaborQuotes,
    List<RecentPlace>? recentPlaces,
    List<ServicePackage>? packages,
    List<PartnerOffer>? partners,
    List<LaborProviderQuote>? laborQuotes,
    int? helperCount,
    int? laborHours,
    int? floorCount,
    bool? hasElevator,
    int? pickupFloor,
    bool? pickupHasElevator,
    AlleyAccess? pickupAlleyAccess,
    AlleyAccess? destinationAlleyAccess,
    CargoVolume? cargoVolume,
    String? dormNote,
    Map<DormPhotoSection, List<String>>? dormPhotos,
    List<String>? dormImageUrls,
    String? laborNote,
    String? linkedOrderId,
    String? linkedOrderNumber,
    String? linkedProviderName,
    bool? quickCompareEntry,
    bool? passItemDelivery,
    String? passItemId,
    bool? isComboBooking,
    bool? isQuoteBooking,
    String? quoteReferenceId,
    String? quoteProviderName,
    int? quoteBasePrice,
    List<QuoteSurchargeLine>? quoteSurcharges,
    bool clearQuoteBooking = false,
    int? selectedComboLaborCount,
    bool? wantsRetailLabor,
    bool? wantsTransportLabor,
    int? transportLaborHelpers,
    int? transportLaborHours,
    bool clearPassItemId = false,
    List<CargoInsurancePlan>? insurancePlans,
    String? selectedInsurancePlanId,
    bool? loadingInsurancePlans,
    DateTime? scheduledPickupAt,
    String? comboFlowHint,
    QuoteFlowHint? quoteFlowHint,
    String? mapPreviewUrl,
    bool clearScheduledPickup = false,
    bool clearLinkedOrder = false,
    bool clearLaborProvider = false,
    bool clearLaborQuotes = false,
  }) {
    return BookingFlowState(
      serviceType: serviceType ?? this.serviceType,
      pickup: pickup ?? this.pickup,
      pickupLat: clearPickupCoords ? null : (pickupLat ?? this.pickupLat),
      pickupLng: clearPickupCoords ? null : (pickupLng ?? this.pickupLng),
      destination: destination ?? this.destination,
      destinationLat: clearDestinationCoords ? null : (destinationLat ?? this.destinationLat),
      destinationLng: clearDestinationCoords ? null : (destinationLng ?? this.destinationLng),
      placeSuggestions:
          clearPlaceSuggestions ? const [] : (placeSuggestions ?? this.placeSuggestions),
      loadingPlaceSuggestions: loadingPlaceSuggestions ?? this.loadingPlaceSuggestions,
      resolvingDestination: resolvingDestination ?? this.resolvingDestination,
      selectedTier: selectedTier ?? this.selectedTier,
      selectedPartnerId: selectedPartnerId ?? this.selectedPartnerId,
      selectedLaborProviderId: clearLaborProvider
          ? null
          : (selectedLaborProviderId ?? this.selectedLaborProviderId),
      paymentMethod: paymentMethod ?? this.paymentMethod,
      discountCode: discountCode ?? this.discountCode,
      discountApplied: discountApplied ?? this.discountApplied,
      loadingPlaces: loadingPlaces ?? this.loadingPlaces,
      loadingPickup: loadingPickup ?? this.loadingPickup,
      loadingPartners: loadingPartners ?? this.loadingPartners,
      loadingLaborQuotes: loadingLaborQuotes ?? this.loadingLaborQuotes,
      recentPlaces: recentPlaces ?? this.recentPlaces,
      packages: packages ?? this.packages,
      partners: partners ?? this.partners,
      laborQuotes: clearLaborQuotes ? const [] : (laborQuotes ?? this.laborQuotes),
      helperCount: helperCount ?? this.helperCount,
      laborHours: laborHours ?? this.laborHours,
      floorCount: floorCount ?? this.floorCount,
      hasElevator: hasElevator ?? this.hasElevator,
      pickupFloor: pickupFloor ?? this.pickupFloor,
      pickupHasElevator: pickupHasElevator ?? this.pickupHasElevator,
      pickupAlleyAccess: pickupAlleyAccess ?? this.pickupAlleyAccess,
      destinationAlleyAccess: destinationAlleyAccess ?? this.destinationAlleyAccess,
      cargoVolume: cargoVolume ?? this.cargoVolume,
      dormNote: dormNote ?? this.dormNote,
      dormPhotos: dormPhotos ?? this.dormPhotos,
      dormImageUrls: dormImageUrls ?? this.dormImageUrls,
      laborNote: laborNote ?? this.laborNote,
      linkedOrderId: clearLinkedOrder ? null : (linkedOrderId ?? this.linkedOrderId),
      linkedOrderNumber:
          clearLinkedOrder ? null : (linkedOrderNumber ?? this.linkedOrderNumber),
      linkedProviderName:
          clearLinkedOrder ? null : (linkedProviderName ?? this.linkedProviderName),
      quickCompareEntry: quickCompareEntry ?? this.quickCompareEntry,
      passItemDelivery: passItemDelivery ?? this.passItemDelivery,
      passItemId: clearPassItemId ? null : (passItemId ?? this.passItemId),
      isComboBooking: isComboBooking ?? this.isComboBooking,
      isQuoteBooking: clearQuoteBooking ? false : (isQuoteBooking ?? this.isQuoteBooking),
      quoteReferenceId:
          clearQuoteBooking ? null : (quoteReferenceId ?? this.quoteReferenceId),
      quoteProviderName:
          clearQuoteBooking ? null : (quoteProviderName ?? this.quoteProviderName),
      quoteBasePrice: clearQuoteBooking ? 0 : (quoteBasePrice ?? this.quoteBasePrice),
      quoteSurcharges:
          clearQuoteBooking ? const [] : (quoteSurcharges ?? this.quoteSurcharges),
      selectedComboLaborCount: selectedComboLaborCount ?? this.selectedComboLaborCount,
      wantsRetailLabor: wantsRetailLabor ?? this.wantsRetailLabor,
      wantsTransportLabor: wantsTransportLabor ?? this.wantsTransportLabor,
      transportLaborHelpers: transportLaborHelpers ?? this.transportLaborHelpers,
      transportLaborHours: transportLaborHours ?? this.transportLaborHours,
      insurancePlans: insurancePlans ?? this.insurancePlans,
      selectedInsurancePlanId: selectedInsurancePlanId ?? this.selectedInsurancePlanId,
      loadingInsurancePlans: loadingInsurancePlans ?? this.loadingInsurancePlans,
      scheduledPickupAt:
          clearScheduledPickup ? null : (scheduledPickupAt ?? this.scheduledPickupAt),
      comboFlowHint: comboFlowHint ?? this.comboFlowHint,
      quoteFlowHint: quoteFlowHint ?? this.quoteFlowHint,
      mapPreviewUrl: mapPreviewUrl ?? this.mapPreviewUrl,
    );
  }
}
