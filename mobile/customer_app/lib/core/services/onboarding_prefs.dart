import 'package:shared_preferences/shared_preferences.dart';

/// Bump [onboardingVersion] để hiện lại onboarding cho mọi user.
const onboardingVersion = 1;
const _key = 'onboarding_seen_version';

Future<bool> isOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('onboarding_done');
  return prefs.getInt(_key) == onboardingVersion;
}

Future<void> setOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt(_key, onboardingVersion);
}

Future<void> clearOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_key);
  await prefs.remove('onboarding_done');
}
