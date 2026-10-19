import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';

class DeviceLocationResult {
  const DeviceLocationResult({
    required this.latitude,
    required this.longitude,
    required this.address,
  });

  final double latitude;
  final double longitude;
  final String address;
}

/// Lấy GPS thiết bị và reverse geocoding (Nominatim) → địa chỉ hiển thị.
class DeviceLocationService {
  DeviceLocationService._();

  static final DeviceLocationService instance = DeviceLocationService._();

  static final Dio _geoDio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'User-Agent': 'UniMoveCustomer/1.0 (booking-location)'},
    ),
  );

  Future<DeviceLocationResult?> getCurrentAddress() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.medium,
        timeLimit: Duration(seconds: 12),
      ),
    );

    final address = await _reverseGeocode(position.latitude, position.longitude);
    if (address == null || address.isEmpty) return null;

    return DeviceLocationResult(
      latitude: position.latitude,
      longitude: position.longitude,
      address: address,
    );
  }

  Future<String?> _reverseGeocode(double lat, double lng) async {
    try {
      final response = await _geoDio.get<dynamic>(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'lat': lat,
          'lon': lng,
          'format': 'json',
          'accept-language': 'vi',
        },
      );
      final data = response.data;
      if (data is Map) {
        final display = data['display_name'];
        if (display is String && display.trim().isNotEmpty) {
          return display.trim();
        }
      }
    } catch (_) {}
    return null;
  }
}
