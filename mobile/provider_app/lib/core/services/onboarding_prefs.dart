import 'package:shared_preferences/shared_preferences.dart';

const providerOnboardingVersion = 1;
const _key = 'provider_onboarding_seen_version';

Future<bool> isProviderOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getInt(_key) == providerOnboardingVersion;
}

Future<void> setProviderOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt(_key, providerOnboardingVersion);
}

Future<void> clearProviderOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_key);
}
