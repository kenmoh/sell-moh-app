import { SplashScreen } from "expo-router";
import { useSession } from "@/lib/ctx";
import { useOnboarding } from "@/lib/onboarding-context";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();
  const { isLoading: onboardingLoading } = useOnboarding();

  if (!isLoading && !onboardingLoading) {
    SplashScreen.hide();
  }

  return null;
}
