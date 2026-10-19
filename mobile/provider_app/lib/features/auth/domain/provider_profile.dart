class ProviderProfile {
  const ProviderProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.businessName,
    this.isVerified = false,
    this.rating = 0,
    this.phone,
    this.address,
    this.city,
    this.bio,
    this.licensePlate,
    this.vehicleModel,
    this.vehicleSize,
    this.totalReviews = 0,
    this.completedTrips = 0,
    this.memberSince,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? businessName;
  final bool isVerified;
  final double rating;
  final String? phone;
  final String? address;
  final String? city;
  final String? bio;
  final String? licensePlate;
  final String? vehicleModel;
  final String? vehicleSize;
  final int totalReviews;
  final int completedTrips;
  final DateTime? memberSince;

  String get locationLine {
    final parts = [address, city].where((e) => (e ?? '').isNotEmpty).cast<String>();
    return parts.isEmpty ? '—' : parts.join(', ');
  }

  factory ProviderProfile.fromJson(Map<String, dynamic> json) {
    return ProviderProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String? ?? '',
      role: json['role'] as String? ?? 'provider',
      businessName: json['business_name'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      bio: json['bio'] as String?,
      licensePlate: json['license_plate'] as String?,
      vehicleModel: json['vehicle_model'] as String?,
      vehicleSize: json['vehicle_size'] as String?,
      totalReviews: (json['total_reviews'] as num?)?.round() ?? 0,
      completedTrips: (json['completed_trips'] as num?)?.round() ?? 0,
      memberSince: json['member_since'] != null
          ? DateTime.tryParse(json['member_since'] as String)
          : null,
    );
  }
}
