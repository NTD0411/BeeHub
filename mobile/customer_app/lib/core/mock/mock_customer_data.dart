/// Dữ liệu sinh viên demo — khớp cột `profiles`.
abstract final class MockCustomerData {
  static const userId = '00000000-0000-4000-8000-000000000001';
  static const fullName = 'Lê Nhật Nam';
  static const email = 'nam.nguyen@student.edu.vn';
  static const phone = '0987 654 321';
  static const studentId = '20216045';
  static const university = 'ĐH Đà Nẵng';
  static const avatarUrl =
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXWoxZ1TESGNUdDiBz1jnUPI6DxYmVUUYA86cP3Mjqva6vWPiVxPU0S1Gp1fHCE732UKKgRz-uECNQkp2b3nBSAEIP-ITcW0ZClZBhRsAsCfBLDMVKKBBh9mDJH8nwmauEqC9VWgrNrz27SXwdkCbx2yMSj6vuM23aBcdT9Ki2eYx37foJYxXPcZYoDvogG1eg6rYPlPJQKs8pNON0z9RsZqKpG_BC29nIBX6HqgeV3Jzc0yls8WbhrPT7wpZxVLK6YU1ctKoXK0XW';
  static const totalOrders = 12;
  static const rating = 4.9;
  static const totalSpent = 1250000;
  static const loyaltyPoints = 120;

  static String get greetingName {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    return parts.isEmpty ? 'bạn' : parts.last;
  }
}
