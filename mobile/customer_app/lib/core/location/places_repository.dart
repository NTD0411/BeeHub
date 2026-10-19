import 'dart:math' as math;

import 'package:dio/dio.dart';

import '../auth/auth_token_storage.dart';
import '../network/api_client.dart';
import '../../features/booking/domain/booking_models.dart';

class PlacesSearchBias {
  const PlacesSearchBias({
    this.lat,
    this.lng,
    this.pickupAddress,
  });

  final double? lat;
  final double? lng;
  final String? pickupAddress;
}

class PlacesRepository {
  PlacesRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  static final Dio _fallbackDio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'User-Agent': 'UniMoveCustomer/1.0 (places-fallback)'},
    ),
  );

  Future<List<PlaceSuggestion>> autocomplete(
    String input, {
    PlacesSearchBias? bias,
  }) async {
    final q = input.trim();
    if (q.length < 2) return [];

    final params = <String, dynamic>{'input': q};
    if (bias?.lat != null) params['lat'] = bias!.lat;
    if (bias?.lng != null) params['lng'] = bias!.lng;
    if (bias?.pickupAddress?.trim().isNotEmpty ?? false) {
      params['pickup_address'] = bias!.pickupAddress!.trim();
    }

    if (await AuthTokenStorage.instance.hasSession()) {
      try {
        final envelope = await _api.guard(
          () => _api.get('/maps/places/autocomplete', queryParameters: params),
        );
        final data = envelope['data'];
        if (data is List) return _mapSuggestions(data);
      } catch (_) {}
    }

    return _nominatimFallback(q, bias: bias);
  }

  /// Geocode chính xác theo text khách gõ (ưu tiên số nhà).
  Future<PlaceDetails?> resolveAddress(
    String input, {
    PlacesSearchBias? bias,
  }) async {
    final q = input.trim();
    if (q.length < 2) return null;

    final params = <String, dynamic>{'input': q};
    if (bias?.lat != null) params['lat'] = bias!.lat;
    if (bias?.lng != null) params['lng'] = bias!.lng;
    if (bias?.pickupAddress?.trim().isNotEmpty ?? false) {
      params['pickup_address'] = bias!.pickupAddress!.trim();
    }

    if (await AuthTokenStorage.instance.hasSession()) {
      try {
        final envelope = await _api.guard(
          () => _api.get('/maps/places/resolve', queryParameters: params),
        );
        final data = envelope['data'];
        if (data is Map) {
          final j = Map<String, dynamic>.from(data);
          return PlaceDetails(
            placeId: j['place_id'] as String? ?? '',
            title: j['title'] as String? ?? q,
            address: j['address'] as String? ?? q,
            lat: _toDouble(j['lat']),
            lng: _toDouble(j['lng']),
          );
        }
      } catch (_) {}
    }

    final suggestions = await _nominatimFallback(q, bias: bias);
    if (suggestions.isEmpty) return null;
    final parsed = _parseHouseStreet(q);
    PlaceSuggestion best = suggestions.first;
    if (parsed.$1 != null) {
      final num = parsed.$1!.toLowerCase();
      for (final s in suggestions) {
        final main = s.mainText.toLowerCase();
        if (main.startsWith('$num ') || main.startsWith('$num/')) {
          best = s;
          break;
        }
      }
    }
    return PlaceDetails(
      placeId: best.placeId,
      title: parsed.$1 != null && !best.mainText.toLowerCase().startsWith(parsed.$1!.toLowerCase())
          ? '${parsed.$1} ${best.mainText}'
          : best.mainText,
      address: best.displayAddress,
      lat: best.lat,
      lng: best.lng,
    );
  }

  Future<PlaceDetails> getDetails({
    required String placeId,
    String? fallbackAddress,
  }) async {
    if (placeId.startsWith('osm:') && (fallbackAddress?.trim().isNotEmpty ?? false)) {
      final parts = placeId.split(':');
      if (parts.length >= 3) {
        return PlaceDetails(
          placeId: placeId,
          title: fallbackAddress!.split(',').first.trim(),
          address: fallbackAddress.trim(),
          lat: double.tryParse(parts[1]),
          lng: double.tryParse(parts[2]),
        );
      }
    }

    if (await AuthTokenStorage.instance.hasSession()) {
      final envelope = await _api.guard(
        () => _api.get('/maps/places/details', queryParameters: {
          'place_id': placeId,
          if (fallbackAddress != null && fallbackAddress.isNotEmpty) 'address': fallbackAddress,
        }),
      );
      final data = envelope['data'];
      if (data is Map) {
        final j = Map<String, dynamic>.from(data);
        return PlaceDetails(
          placeId: j['place_id'] as String? ?? placeId,
          title: j['title'] as String? ?? '',
          address: j['address'] as String? ?? fallbackAddress ?? '',
          lat: _toDouble(j['lat']),
          lng: _toDouble(j['lng']),
        );
      }
    }

    throw Exception('Không lấy được chi tiết địa chỉ');
  }

  List<PlaceSuggestion> _mapSuggestions(List raw) {
    return raw.map((item) {
      final j = Map<String, dynamic>.from(item as Map);
      return PlaceSuggestion(
        placeId: j['place_id'] as String? ?? '',
        mainText: j['main_text'] as String? ?? '',
        secondaryText: j['secondary_text'] as String? ?? '',
        lat: _toDouble(j['lat']),
        lng: _toDouble(j['lng']),
      );
    }).where((s) => s.placeId.isNotEmpty).toList();
  }

  String _extractLocality(String? pickupAddress) {
    if (pickupAddress == null || pickupAddress.trim().isEmpty) return '';
    final parts = pickupAddress.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    for (final part in parts) {
      final lower = part.toLowerCase();
      if (lower.contains('thành phố') ||
          lower.contains('đà nẵng') ||
          lower.contains('hồ chí minh') ||
          lower.contains('hà nội') ||
          lower.contains('cần thơ') ||
          lower.contains('hải phòng')) {
        return part.replaceAll(RegExp(r'^thành phố\s+', caseSensitive: false), '').trim();
      }
    }
    if (parts.length >= 2) return parts[parts.length - 2];
    return '';
  }

  Future<List<PlaceSuggestion>> _nominatimFallback(
    String input, {
    PlacesSearchBias? bias,
  }) async {
    try {
      final locality = _extractLocality(bias?.pickupAddress);
      final collected = <PlaceSuggestion>[];

      Future<void> runSearch(Map<String, dynamic> query) async {
        final response = await _fallbackDio.get<dynamic>(
          'https://nominatim.openstreetmap.org/search',
          queryParameters: query,
        );
        final rows = response.data;
        if (rows is! List) return;
        for (final item in rows) {
          collected.add(_mapNominatimItem(item, input));
        }
      }

      if (bias?.lat != null && bias?.lng != null) {
        final lat = bias!.lat!;
        final lng = bias.lng!;
        final delta = 0.12;
        await runSearch({
          'q': locality.isNotEmpty ? '$input, $locality, Việt Nam' : '$input, Việt Nam',
          'format': 'json',
          'addressdetails': 1,
          'limit': 10,
          'countrycodes': 'vn',
          'viewbox': '${lng - delta},${lat + delta},${lng + delta},${lat - delta}',
          'bounded': 1,
        });
      }

      final parsed = _parseHouseStreet(input);
      if (parsed.$1 != null && locality.isNotEmpty) {
        for (final street in ['${parsed.$1} ${parsed.$2}', parsed.$2]) {
          await runSearch({
            'street': street,
            'city': locality,
            'country': 'Vietnam',
            'format': 'json',
            'addressdetails': 1,
            'limit': 8,
          });
        }
      } else if (locality.isNotEmpty) {
        await runSearch({
          'street': input,
          'city': locality,
          'country': 'Vietnam',
          'format': 'json',
          'addressdetails': 1,
          'limit': 8,
        });
      }

      final textQuery = locality.isNotEmpty && !input.toLowerCase().contains(locality.toLowerCase())
          ? '$input, $locality, Việt Nam'
          : '$input, Việt Nam';
      final textParams = <String, dynamic>{
        'q': textQuery,
        'format': 'json',
        'addressdetails': 1,
        'limit': 10,
        'countrycodes': 'vn',
      };
      if (bias?.lat != null && bias?.lng != null) {
        final lat = bias!.lat!;
        final lng = bias.lng!;
        final delta = 0.15;
        textParams['viewbox'] = '${lng - delta},${lat + delta},${lng + delta},${lat - delta}';
      }
      await runSearch(textParams);

      return _dedupeAndRank(collected, bias?.lat, bias?.lng, 6, input);
    } catch (_) {
      return [];
    }
  }

  PlaceSuggestion _mapNominatimItem(dynamic item, String fallbackInput) {
    final j = Map<String, dynamic>.from(item as Map);
    final lat = _toDouble(j['lat']);
    final lng = _toDouble(j['lon']);
    final address = j['display_name'] as String? ?? '';
    final addr = j['address'];
    String main = fallbackInput;
    if (addr is Map) {
      final house = addr['house_number']?.toString().trim() ?? '';
      final road = addr['road']?.toString().trim() ?? '';
      if (house.isNotEmpty && road.isNotEmpty) {
        main = '$house $road';
      } else if (road.isNotEmpty) {
        main = road;
      }
    }
    if (main == fallbackInput) {
      main = j['name'] as String? ?? address.split(',').first;
    }
    return PlaceSuggestion(
      placeId: 'osm:$lat:$lng',
      mainText: main,
      secondaryText: address,
      lat: lat,
      lng: lng,
    );
  }

  (String?, String) _parseHouseStreet(String input) {
    final q = input.trim();
    final numbered = RegExp(r'^(\d+[/-]?\d*)\s+(.+)$', caseSensitive: false).firstMatch(q);
    if (numbered != null) {
      return (numbered.group(1), numbered.group(2)!.trim());
    }
    final soNha = RegExp(r'^số\s*(\d+[/-]?\d*)\s+(.+)$', caseSensitive: false).firstMatch(q);
    if (soNha != null) {
      return (soNha.group(1), soNha.group(2)!.trim());
    }
    return (null, q);
  }

  int _scoreSuggestion(PlaceSuggestion row, String input, double? biasLat, double? biasLng) {
    final parsed = _parseHouseStreet(input);
    var score = 0;
    final main = row.mainText.toLowerCase();
    if (parsed.$1 != null) {
      final num = parsed.$1!.toLowerCase();
      if (main.startsWith('$num ') || main.startsWith('$num/')) {
        score += 120;
      } else if (RegExp(r'^\d+').hasMatch(main)) {
        score += 40;
      } else {
        score -= 30;
      }
    }
    if (biasLat != null && biasLng != null && row.lat != null && row.lng != null) {
      final km = _distanceKm(biasLat, biasLng, row.lat, row.lng);
      score += (50 - km).clamp(0, 50).round();
      if (km > 40) score -= 80;
    }
    return score;
  }

  List<PlaceSuggestion> _dedupeAndRank(
    List<PlaceSuggestion> rows,
    double? biasLat,
    double? biasLng,
    int limit,
    String input,
  ) {
    final seen = <String>{};
    final unique = <PlaceSuggestion>[];
    for (final row in rows) {
      final key = '${row.lat?.toStringAsFixed(5)}:${row.lng?.toStringAsFixed(5)}:${row.secondaryText}';
      if (seen.contains(key)) continue;
      seen.add(key);
      unique.add(row);
    }

    unique.sort((a, b) =>
        _scoreSuggestion(b, input, biasLat, biasLng).compareTo(_scoreSuggestion(a, input, biasLat, biasLng)));

    if (biasLat != null && biasLng != null) {
      final nearby = unique
          .where((r) => r.lat != null && r.lng != null && _distanceKm(biasLat, biasLng, r.lat, r.lng) <= 40)
          .toList();
      if (nearby.isNotEmpty) return nearby.take(limit).toList();
    }

    return unique.take(limit).toList();
  }

  double _distanceKm(double lat1, double lng1, double? lat2, double? lng2) {
    if (lat2 == null || lng2 == null) return 9999;
    const r = 6371.0;
    final dLat = _toRad(lat2 - lat1);
    final dLng = _toRad(lng2 - lng1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRad(lat1)) * math.cos(_toRad(lat2)) * math.sin(dLng / 2) * math.sin(dLng / 2);
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  double _toRad(double deg) => deg * math.pi / 180;

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}
