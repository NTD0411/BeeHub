import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/auth/api_session_mode.dart';
import '../../../../core/location/device_location_service.dart';
import '../../../../core/location/places_repository.dart';

import '../../../orders/domain/checkout_models.dart';
import '../../../orders/domain/order_models.dart';
import '../../data/booking_media_repository.dart';
import '../../data/booking_mock_repository.dart';
import '../../data/quote_progress_repository.dart';
import '../../data/labor_repository.dart';
import '../../data/providers_repository.dart';
import '../../../orders/data/customer_orders_repository.dart';
import '../../domain/booking_models.dart';
import '../../domain/quote_models.dart';
import 'booking_flow_state.dart';

class BookingFlowCubit extends Cubit<BookingFlowState> {
  BookingFlowCubit({
    BookingMockRepository? repository,
    LaborRepository? laborRepository,
    ProvidersRepository? providersRepository,
    CustomerOrdersRepository? ordersRepository,
    BookingMediaRepository? mediaRepository,
    QuoteProgressRepository? quoteProgressRepository,
    PlacesRepository? placesRepository,
  })  : _repo = repository ?? BookingMockRepository(),
        _laborRepo = laborRepository ?? LaborRepository(),
        _providersRepo = providersRepository ?? ProvidersRepository(),
        _ordersRepo = ordersRepository ?? CustomerOrdersRepository(),
        _mediaRepo = mediaRepository ?? BookingMediaRepository(),
        _quoteRepo = quoteProgressRepository ?? QuoteProgressRepository.instance,
        _placesRepo = placesRepository ?? PlacesRepository(),
        super(const BookingFlowState());

  final BookingMockRepository _repo;
  final PlacesRepository _placesRepo;
  Timer? _destinationSearchDebounce;
  Timer? _destinationResolveDebounce;
  final LaborRepository _laborRepo;
  final ProvidersRepository _providersRepo;
  final CustomerOrdersRepository _ordersRepo;
  final BookingMediaRepository _mediaRepo;
  final QuoteProgressRepository _quoteRepo;

  Future<void> loadPlaces() async {
    if (state.loadingPlaces) return;

    final keepExistingPickup = state.passItemDelivery ||
        state.isLaborAddon ||
        (state.pickup.trim().isNotEmpty && state.quickCompareEntry);

    emit(state.copyWith(loadingPlaces: true));
    final payload = await _repo.fetchBookingLocations();
    var pickup = payload.defaultPickup?.trim();
    var pickupLat = payload.defaultPickupLat;
    var pickupLng = payload.defaultPickupLng;
    var recentPlaces = payload.recentPlaces;

    if (!keepExistingPickup && (pickup == null || pickup.isEmpty)) {
      emit(state.copyWith(loadingPickup: true));
      final current = await DeviceLocationService.instance.getCurrentAddress();
      if (current != null) {
        pickup = current.address;
        pickupLat = current.latitude;
        pickupLng = current.longitude;
        recentPlaces = _prependCurrentPlace(
          recentPlaces,
          current.address,
          lat: current.latitude,
          lng: current.longitude,
        );
        unawaited(_repo.saveDefaultPickup(current.address));
      }
    }

    emit(state.copyWith(
      loadingPlaces: false,
      loadingPickup: false,
      recentPlaces: recentPlaces,
      comboFlowHint: payload.comboFlowHint,
      quoteFlowHint: payload.quoteFlowHint,
      mapPreviewUrl: payload.mapPreviewUrl,
      pickup: pickup != null && pickup.isNotEmpty
          ? pickup
          : (keepExistingPickup ? state.pickup : ''),
      pickupLat: pickupLat ?? state.pickupLat,
      pickupLng: pickupLng ?? state.pickupLng,
    ));
  }

  List<RecentPlace> _prependCurrentPlace(
    List<RecentPlace> places,
    String address, {
    double? lat,
    double? lng,
  }) {
    final trimmed = address.trim();
    if (trimmed.isEmpty) return places;
    final exists = places.any(
      (p) => p.subtitle.trim() == trimmed || p.title.trim() == trimmed,
    );
    if (exists) return places;
    final title = trimmed.split(',').first.trim();
    return [
      RecentPlace(
        id: 'current-location',
        title: title.isEmpty ? trimmed : title,
        subtitle: trimmed,
        icon: Icons.my_location,
        lat: lat,
        lng: lng,
      ),
      ...places,
    ];
  }

  PlacesSearchBias get _placesBias => PlacesSearchBias(
        lat: state.pickupLat,
        lng: state.pickupLng,
        pickupAddress: state.pickup,
      );

  Future<void> clearRecentPlaces() async {
    await _repo.clearRecentPlaces();
    emit(state.copyWith(recentPlaces: []));
  }

  Future<void> loadPackages() async {
    if (state.packages.isNotEmpty) return;
    final packages = await _repo.fetchPackages();
    emit(state.copyWith(packages: packages));
  }

  Future<void> loadInsurancePlans() async {
    if (state.insurancePlans.isNotEmpty) return;
    emit(state.copyWith(loadingInsurancePlans: true));
    final plans = await _repo.fetchInsurancePlans();
    emit(state.copyWith(
      loadingInsurancePlans: false,
      insurancePlans: plans,
      selectedInsurancePlanId: state.selectedInsurancePlanId ?? 'standard',
    ));
  }

  void selectInsurancePlan(String planId) {
    emit(state.copyWith(selectedInsurancePlanId: planId));
  }

  Future<void> loadPartners() async {
    if (state.partners.isNotEmpty && !state.isComboBooking) return;
    if (state.isComboBooking && state.partners.isNotEmpty) {
      final tier = state.selectedTier;
      final filtered = state.partners.where((p) => p.offersCombo(tier)).toList();
      if (filtered.isNotEmpty) {
        emit(state.copyWith(
          partners: filtered,
          selectedPartnerId:
              state.selectedPartnerId ?? (filtered.isNotEmpty ? filtered.first.id : null),
        ));
        return;
      }
    }
    emit(state.copyWith(loadingPartners: true));
    List<PartnerOffer> partners;
    if (state.isComboBooking) {
      partners = await _repo.fetchComboPartners(state.selectedTier);
    } else {
      try {
        partners = await _providersRepo.browse(city: 'Đà Nẵng');
      } catch (_) {
        partners = [];
      }
    }
    if (state.isComboBooking) {
      partners.sort((a, b) => state.comboTotalForPartner(a).compareTo(state.comboTotalForPartner(b)));
    }
    emit(state.copyWith(
      loadingPartners: false,
      partners: partners,
      selectedPartnerId: state.selectedPartnerId ?? (partners.isNotEmpty ? partners.first.id : null),
    ));
  }

  void refreshComboPartners() {
    emit(state.copyWith(partners: [], selectedPartnerId: null));
    unawaited(loadPartners());
  }

  Future<CheckoutResult> checkout() => _ordersRepo.createFromBooking(state);

  Future<void> loadLaborQuotes() async {
    emit(state.copyWith(loadingLaborQuotes: true, laborQuotes: []));
    final helpers = state.helperCount < 1 ? 1 : state.helperCount;

    if (state.isLaborAddon) {
      final quote = await _laborRepo.fetchTransportProviderLaborQuote(
        providerId: state.selectedPartnerId,
        providerName: state.linkedProviderName ?? 'Nhà xe vận chuyển',
        helperCount: helpers,
        laborHours: state.laborHours,
        floorFee: state.floorFee,
      );
      emit(state.copyWith(
        loadingLaborQuotes: false,
        laborQuotes: [quote],
        selectedLaborProviderId: quote.id,
      ));
      return;
    }

    final quotes = await _laborRepo.fetchLaborQuotes(
      helperCount: helpers,
      laborHours: state.laborHours,
      floorFee: state.floorFee,
      forExistingOrder: false,
    );
    emit(state.copyWith(
      loadingLaborQuotes: false,
      laborQuotes: quotes,
      selectedLaborProviderId:
          state.selectedLaborProviderId ?? (quotes.isNotEmpty ? quotes.first.id : null),
    ));
  }

  void onDestinationChanged(String value) {
    _destinationSearchDebounce?.cancel();
    _destinationResolveDebounce?.cancel();
    emit(state.copyWith(
      destination: value,
      clearDestinationCoords: true,
      clearPlaceSuggestions: value.trim().length < 2,
      resolvingDestination: false,
    ));

    final q = value.trim();
    if (q.length < 2) {
      emit(state.copyWith(loadingPlaceSuggestions: false));
      return;
    }

    emit(state.copyWith(loadingPlaceSuggestions: true));
    _destinationSearchDebounce = Timer(const Duration(milliseconds: 350), () async {
      final suggestions = await _placesRepo.autocomplete(q, bias: _placesBias);
      if (isClosed) return;
      if (state.destination.trim() != q) return;
      emit(state.copyWith(
        placeSuggestions: suggestions,
        loadingPlaceSuggestions: false,
      ));
    });

    _destinationResolveDebounce = Timer(const Duration(milliseconds: 850), () {
      if (state.destination.trim() == q) {
        unawaited(_tryResolveDestination(q));
      }
    });
  }

  Future<void> resolveDestinationNow() async {
    _destinationResolveDebounce?.cancel();
    final q = state.destination.trim();
    if (q.length < 2) return;
    await _tryResolveDestination(q);
  }

  Future<void> _tryResolveDestination(String q) async {
    emit(state.copyWith(resolvingDestination: true));

    final resolved = await _placesRepo.resolveAddress(q, bias: _placesBias);
    if (isClosed) return;
    if (state.destination.trim() != q) {
      emit(state.copyWith(resolvingDestination: false));
      return;
    }

    if (resolved?.lat != null && resolved?.lng != null) {
      applyResolvedDestination(resolved!);
      emit(state.copyWith(resolvingDestination: false));
      return;
    }

    if (state.placeSuggestions.isNotEmpty) {
      await selectPlaceSuggestion(state.placeSuggestions.first, typedInput: q);
      if (!isClosed) emit(state.copyWith(resolvingDestination: false));
      return;
    }

    emit(state.copyWith(resolvingDestination: false));
  }

  Future<void> selectPlaceSuggestion(
    PlaceSuggestion suggestion, {
    String? typedInput,
  }) async {
    _destinationSearchDebounce?.cancel();
    final typed = (typedInput ?? state.destination).trim();
    emit(state.copyWith(
      loadingPlaceSuggestions: true,
      clearPlaceSuggestions: true,
    ));

    PlaceDetails details;
    final typedHasHouse = RegExp(r'^(\d+|số\s*\d+)', caseSensitive: false).hasMatch(typed);
    final suggestionHasHouse = RegExp(r'^\d+').hasMatch(suggestion.mainText.trim());

    if (typedHasHouse && !suggestionHasHouse && typed.length >= 3) {
      final resolved = await _placesRepo.resolveAddress(typed, bias: _placesBias);
      if (resolved != null && resolved.lat != null && resolved.lng != null) {
        details = resolved;
      } else if (suggestion.lat != null && suggestion.lng != null) {
        final short = typed.split(',').first.trim();
        details = PlaceDetails(
          placeId: suggestion.placeId,
          title: short,
          address: '$short, ${suggestion.secondaryText}',
          lat: suggestion.lat,
          lng: suggestion.lng,
        );
      } else {
        details = await _placesRepo.getDetails(
          placeId: suggestion.placeId,
          fallbackAddress: typed.isNotEmpty ? typed : suggestion.displayAddress,
        );
      }
    } else if (suggestion.lat != null && suggestion.lng != null) {
      details = PlaceDetails(
        placeId: suggestion.placeId,
        title: typed.isNotEmpty ? typed.split(',').first.trim() : suggestion.mainText,
        address: typed.isNotEmpty && !suggestion.displayAddress.toLowerCase().contains(typed.toLowerCase())
            ? '$typed, ${suggestion.secondaryText}'
            : suggestion.displayAddress,
        lat: suggestion.lat,
        lng: suggestion.lng,
      );
    } else {
      details = await _placesRepo.getDetails(
        placeId: suggestion.placeId,
        fallbackAddress: typed.isNotEmpty ? typed : suggestion.displayAddress,
      );
    }

    final saved = await _repo.saveRecentPlace(
      address: details.address,
      title: details.title,
      lat: details.lat,
      lng: details.lng,
    );

    emit(state.copyWith(
      destination: details.address,
      destinationLat: details.lat,
      destinationLng: details.lng,
      loadingPlaceSuggestions: false,
      recentPlaces: saved != null
          ? _prependSavedPlace(state.recentPlaces, saved)
          : state.recentPlaces,
    ));
  }

  List<RecentPlace> _prependSavedPlace(List<RecentPlace> places, RecentPlace saved) {
    final filtered = places
        .where((p) => p.subtitle.trim() != saved.subtitle.trim())
        .toList();
    return [saved, ...filtered];
  }

  void selectPlace(RecentPlace place) {
    final address = place.subtitle.trim().isNotEmpty ? place.subtitle.trim() : place.title;
    emit(state.copyWith(
      destination: address,
      destinationLat: place.lat,
      destinationLng: place.lng,
      clearPlaceSuggestions: true,
    ));
  }

  @override
  Future<void> close() {
    _destinationSearchDebounce?.cancel();
    _destinationResolveDebounce?.cancel();
    return super.close();
  }

  void selectTier(ServiceTier tier) {
    ServicePackage? pkg;
    for (final p in state.packages) {
      if (p.tier == tier) {
        pkg = p;
        break;
      }
    }
    emit(state.copyWith(
      selectedTier: tier,
      selectedComboLaborCount: pkg?.laborSuggested ?? 1,
      wantsRetailLabor: false,
      partners: state.isComboBooking ? const [] : state.partners,
      selectedPartnerId: state.isComboBooking ? null : state.selectedPartnerId,
      clearLaborProvider: true,
      clearLaborQuotes: true,
    ));
    if (state.isComboBooking) {
      unawaited(loadPartners());
    }
  }

  void setComboLaborCount(int count) {
    final max = state.selectedPackage?.maxLaborCount ?? 3;
    var next = state.copyWith(selectedComboLaborCount: count.clamp(1, max));
    if (next.isComboBooking && next.partners.isNotEmpty) {
      final sorted = [...next.partners]
        ..sort((a, b) => next.comboTotalForPartner(a).compareTo(next.comboTotalForPartner(b)));
      next = next.copyWith(partners: sorted);
    }
    emit(next);
  }

  void skipRetailLabor() {
    emit(state.copyWith(
      wantsRetailLabor: false,
      clearLaborProvider: true,
      clearLaborQuotes: true,
    ));
  }

  void confirmRetailLabor() {
    if (state.selectedLaborProviderId == null) return;
    emit(state.copyWith(wantsRetailLabor: true));
  }

  Future<void> loadRetailLaborQuotes() async {
    emit(state.copyWith(loadingLaborQuotes: true, laborQuotes: []));
    final helpers = state.helperCount < 1 ? 2 : state.helperCount;
    final pkg = state.selectedPackage;
    final quotes = await _laborRepo.fetchLaborQuotes(
      helperCount: helpers,
      laborHours: state.laborHours,
      floorFee: state.floorFee,
      retailMode: true,
      comboLaborUnitPrice: pkg?.extraLaborComboPrice,
    );
    final combinable = quotes.where((q) => q.canCombineWithTransport).toList();
    final display = combinable.isNotEmpty ? combinable : quotes;
    emit(state.copyWith(
      loadingLaborQuotes: false,
      laborQuotes: display,
      helperCount: helpers,
      selectedLaborProviderId:
          state.selectedLaborProviderId ?? (display.isNotEmpty ? display.first.id : null),
    ));
  }

  void selectPartner(String id) => emit(state.copyWith(selectedPartnerId: id));

  void selectLaborProvider(String id) => emit(state.copyWith(selectedLaborProviderId: id));

  void selectPayment(PaymentMethod method) => emit(state.copyWith(paymentMethod: method));

  void setDiscountCode(String code) => emit(state.copyWith(discountCode: code));

  void applyDiscount() {
    if (state.discountCode.trim().toUpperCase() == 'UNIMOVE50') {
      emit(state.copyWith(discountApplied: true));
    }
  }

  /// Khuân vác độc lập — không cần đơn chuyển xe.
  void startLaborOnlyBooking() {
    emit(
      const BookingFlowState(
        serviceType: BookingServiceType.laborOnly,
        helperCount: 2,
        laborHours: 2,
        floorCount: 0,
        hasElevator: true,
        destination: '',
      ),
    );
  }

  /// Thêm khuân vác vào đơn chuyển trọ đã có.
  void startLaborAddonFromOrder(CustomerOrder order) {
    emit(
      BookingFlowState(
        serviceType: BookingServiceType.laborAddon,
        linkedOrderId: order.id,
        linkedOrderNumber: order.orderNumber,
        linkedProviderName: order.providerName,
        pickup: order.pickupAddress,
        destination: order.deliveryAddress,
        helperCount: 2,
        laborHours: 2,
        floorCount: 0,
        hasElevator: true,
        selectedPartnerId: order.providerId,
      ),
    );
  }

  void resetToFullMove() {
    emit(const BookingFlowState());
  }

  /// Đặt chuyến thường — nhà xe báo giá tự do.
  void startFullMoveBooking() {
    emit(const BookingFlowState(isComboBooking: false));
  }

  /// Combo niêm yết — khai báo địa điểm như đặt chuyến, giá xe/km cố định trên app.
  void startComboBooking() {
    emit(const BookingFlowState(isComboBooking: true));
  }

  /// Chuyển từ combo sang đặt chuyến linh hoạt — giữ địa điểm đã nhập.
  void switchToCustomTrip() {
    emit(state.copyWith(
      isComboBooking: false,
      partners: const [],
      selectedPartnerId: null,
      wantsRetailLabor: false,
      clearLaborProvider: true,
      clearLaborQuotes: true,
    ));
    unawaited(loadPartners());
  }

  /// Đặt vận chuyển pass đồ — geocode điểm lấy, khách chọn combo/chuyến thường sau.
  Future<void> preparePassItemDelivery({
    required String pickup,
    required String passItemId,
  }) async {
    emit(BookingFlowState(
      pickup: pickup,
      destination: '',
      passItemDelivery: true,
      passItemId: passItemId,
      isComboBooking: false,
      loadingPickup: true,
    ));

    final resolved = await _placesRepo.resolveAddress(
      pickup.trim(),
      bias: PlacesSearchBias(pickupAddress: pickup.trim()),
    );
    if (isClosed) return;
    if (resolved?.lat != null && resolved?.lng != null) {
      emit(state.copyWith(
        pickup: resolved!.address,
        pickupLat: resolved.lat,
        pickupLng: resolved.lng,
        loadingPickup: false,
      ));
    } else {
      emit(state.copyWith(loadingPickup: false));
    }
  }

  Future<void> ensurePickupCoordinates() async {
    if (state.pickupLat != null && state.pickupLng != null) return;
    final pickup = state.pickup.trim();
    if (pickup.isEmpty) return;

    emit(state.copyWith(loadingPickup: true));
    final resolved = await _placesRepo.resolveAddress(
      pickup,
      bias: PlacesSearchBias(pickupAddress: pickup),
    );
    if (isClosed) return;
    if (resolved?.lat != null && resolved?.lng != null) {
      emit(state.copyWith(
        pickup: resolved!.address,
        pickupLat: resolved.lat,
        pickupLng: resolved.lng,
        loadingPickup: false,
      ));
    } else {
      emit(state.copyWith(loadingPickup: false));
    }
  }

  void applyResolvedDestination(PlaceDetails details) {
    emit(state.copyWith(
      destination: details.address,
      destinationLat: details.lat,
      destinationLng: details.lng,
      clearPlaceSuggestions: true,
    ));
  }

  Future<bool> ensureDestinationCoordinates() async {
    if (state.destinationLat != null && state.destinationLng != null) return true;
    final q = state.destination.trim();
    if (q.length < 2) return false;

    await _tryResolveDestination(q);
    return state.destinationLat != null && state.destinationLng != null;
  }

  void selectPassItemComboMode() {
    emit(state.copyWith(isComboBooking: true, partners: const [], selectedPartnerId: null));
    unawaited(loadPackages());
  }

  void selectPassItemNormalMode() {
    emit(state.copyWith(
      isComboBooking: false,
      partners: const [],
      selectedPartnerId: null,
      wantsRetailLabor: false,
      clearLaborProvider: true,
      clearLaborQuotes: true,
    ));
  }

  /// Đặt chuyến linh hoạt — so sánh báo giá nhà xe (không qua combo niêm yết).
  void startCompareQuotesFlow() {
    emit(
      const BookingFlowState(
        isComboBooking: false,
        destination: '152 Nguyễn Văn Cừ, Quận 5',
        quickCompareEntry: true,
      ),
    );
  }

  void clearQuickCompareEntry() {
    if (state.quickCompareEntry) {
      emit(state.copyWith(quickCompareEntry: false));
    }
  }

  void setHelperCount(int count) {
    emit(state.copyWith(helperCount: count.clamp(1, 6), clearLaborProvider: true));
    _reloadLaborQuotesAfterConfigChange();
  }

  void setLaborHours(int hours) {
    emit(state.copyWith(laborHours: hours.clamp(1, 12), clearLaborProvider: true));
    _reloadLaborQuotesAfterConfigChange();
  }

  void setFloorCount(int floors) {
    emit(state.copyWith(floorCount: floors.clamp(0, 20), clearLaborProvider: true));
    _reloadLaborQuotesAfterConfigChange();
  }

  void setHasElevator(bool value) {
    emit(state.copyWith(hasElevator: value, clearLaborProvider: true));
    _reloadLaborQuotesAfterConfigChange();
  }

  void _reloadLaborQuotesAfterConfigChange() {
    if (state.isLaborService) {
      unawaited(loadLaborQuotes());
    }
  }

  void setLaborNote(String note) => emit(state.copyWith(laborNote: note));

  void setPickupFloor(int floor) => emit(state.copyWith(pickupFloor: floor.clamp(0, 30)));

  void setPickupHasElevator(bool value) => emit(state.copyWith(pickupHasElevator: value));

  void setPickupAlley(AlleyAccess access) => emit(state.copyWith(pickupAlleyAccess: access));

  void setDestinationAlley(AlleyAccess access) =>
      emit(state.copyWith(destinationAlleyAccess: access));

  void setCargoVolume(CargoVolume volume) => emit(state.copyWith(cargoVolume: volume));

  void setDormNote(String note) => emit(state.copyWith(dormNote: note));

  void setWantsTransportLabor(bool value) => emit(state.copyWith(wantsTransportLabor: value));

  void setTransportLaborHelpers(int count) =>
      emit(state.copyWith(transportLaborHelpers: count.clamp(1, 6)));

  void setTransportLaborHours(int hours) =>
      emit(state.copyWith(transportLaborHours: hours.clamp(1, 12)));

  void setScheduledPickup(DateTime value) => emit(state.copyWith(scheduledPickupAt: value));

  /// Khung giờ lấy đồ hợp lệ — tối thiểu 2 giờ kể từ bây giờ.
  static bool isValidPickupTime(DateTime value) {
    return value.isAfter(DateTime.now().add(const Duration(hours: 2)));
  }

  static DateTime defaultPickupSuggestion() {
    final now = DateTime.now().add(const Duration(hours: 2));
    final day = DateTime(now.year, now.month, now.day);
    var hour = now.hour;
    if (now.minute > 0) hour += 1;
    if (hour < 7) return DateTime(day.year, day.month, day.day, 8);
    if (hour >= 18) return DateTime(day.year, day.month, day.day + 1, 8);
    return DateTime(day.year, day.month, day.day, hour);
  }

  static const maxPhotosPerSection = 3;

  void addDormPhoto(DormPhotoSection section, String path) {
    final current = state.dormPhotos[section] ?? [];
    if (current.length >= maxPhotosPerSection) return;
    final next = Map<DormPhotoSection, List<String>>.from(state.dormPhotos);
    next[section] = [...current, path];
    emit(state.copyWith(dormPhotos: next));
  }

  void removeDormPhoto(DormPhotoSection section, int index) {
    final current = state.dormPhotos[section];
    if (current == null || index < 0 || index >= current.length) return;
    final next = Map<DormPhotoSection, List<String>>.from(state.dormPhotos);
    final updated = [...current]..removeAt(index);
    if (updated.isEmpty) {
      next.remove(section);
    } else {
      next[section] = updated;
    }
    emit(state.copyWith(dormPhotos: next));
  }

  /// Gửi yêu cầu báo giá — upload ảnh (nếu có) rồi trả mã tham chiếu.
  Future<QuoteSubmitResult> submitQuoteRequest() async {
    final urls = <String>[];
    var photoUploadFailed = false;

    for (final path in state.activeDormImagePaths) {
      try {
        urls.add(await _mediaRepo.uploadDormPhoto(filePath: path));
      } catch (_) {
        photoUploadFailed = true;
      }
    }

    if (urls.isNotEmpty) {
      emit(state.copyWith(dormImageUrls: urls));
    }
    if (state.activeDormImagePaths.isNotEmpty && urls.isEmpty) {
      photoUploadFailed = true;
    }

    final ref = 'QR-${DateTime.now().millisecondsSinceEpoch.remainder(1000000)}';

    String? orderId;
    if (await ApiSessionMode.hasRealSession()) {
      orderId = await _ordersRepo.createQuoteRequestOrder(state, ref);
    } else if (!await ApiSessionMode.useMockQuotes()) {
      throw Exception(
        'Cần đăng nhập API: test.customer@unimove.test / Test1234! '
        '(không dùng demo@unimove.local)',
      );
    }

    await _quoteRepo.createFromBooking(
      referenceId: ref,
      state: state,
      imageUrls: urls,
      orderId: orderId,
    );
    return QuoteSubmitResult(referenceId: ref, photoUploadFailed: photoUploadFailed);
  }

  /// Chuẩn bị state thanh toán cho chuyến báo giá đã chốt nhà xe.
  void prepareQuoteDepositPayment(QuoteRequestSnapshot snap) {
    final quote = snap.confirmedQuote;
    if (quote == null) {
      throw Exception('Chưa chốt nhà xe để đặt cọc');
    }

    emit(
      state.copyWith(
        isQuoteBooking: true,
        isComboBooking: false,
        quoteReferenceId: snap.id,
        pickup: snap.pickup,
        destination: snap.destination,
        scheduledPickupAt: snap.scheduledPickupAt,
        dormNote: snap.dormNote,
        quoteProviderName: quote.providerName,
        quoteBasePrice: quote.basePrice,
        quoteSurcharges: quote.surcharges,
        selectedPartnerId: quote.providerId,
        wantsRetailLabor: false,
        discountApplied: false,
      ),
    );
  }

  /// Đặt cọc chuyến báo giá — trả QR PayOS nếu có đơn API, null nếu mock.
  Future<CheckoutResult?> payQuoteDeposit() async {
    final ref = state.quoteReferenceId;
    if (ref == null || !state.isQuoteBooking) {
      throw Exception('Không tìm thấy yêu cầu báo giá để đặt cọc');
    }

    final snap = _quoteRepo.peek(ref);
    final orderId = snap?.orderId;
    if (orderId != null) {
      final deposit = _depositAmount(state.total);
      final depositInfo = await _ordersRepo.createDepositForOrder(
        orderId: orderId,
        amount: deposit,
      );
      return CheckoutResult(orderId: orderId, deposit: depositInfo);
    }

    return null;
  }

  int _depositAmount(int total) => (total * 0.3).round();

  /// Hoàn tất đặt cọc sau khi thanh toán trên màn Payment.
  Future<QuoteRequestSnapshot> completeQuoteDeposit() async {
    final ref = state.quoteReferenceId;
    if (ref == null || !state.isQuoteBooking) {
      throw Exception('Không tìm thấy yêu cầu báo giá để đặt cọc');
    }

    final snap = _quoteRepo.peek(ref);
    final QuoteRequestSnapshot result;
    if (snap?.orderId != null) {
      result = await _quoteRepo.markDepositPaid(ref);
    } else {
      result = await _quoteRepo.payDeposit(ref);
    }
    emit(state.copyWith(clearQuoteBooking: true));
    return result;
  }
}
