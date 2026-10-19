import 'dart:math' as math;

/// Khoảng cách đường chim bay (km) giữa hai tọa độ.
double haversineKm(double lat1, double lng1, double lat2, double lng2) {
  const earthRadiusKm = 6371.0;
  double toRad(double d) => d * math.pi / 180;
  final dLat = toRad(lat2 - lat1);
  final dLng = toRad(lng2 - lng1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(toRad(lat1)) * math.cos(toRad(lat2)) * math.sin(dLng / 2) * math.sin(dLng / 2);
  return earthRadiusKm * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}
