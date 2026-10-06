import {
  AnalyticsIllo,
  CheckoutIllo,
  PaymentsIllo,
  SyncIllo,
  TeamIllo,
  WelcomeIllo,
  type IllustrationProps,
} from "./illustrations";

export type Slide = {
  key: string;
  title: string;
  subtitle: string;
  Illustration: React.ComponentType<IllustrationProps>;
};

export const SLIDES: Slide[] = [
  {
    key: "welcome",
    title: "One dashboard for every store",
    subtitle:
      "Jump between locations — sales, stock and staff stay perfectly in sync.",
    Illustration: WelcomeIllo,
  },
  {
    key: "checkout",
    title: "Checkout in seconds",
    subtitle: "A cart built for speed, so your queue keeps moving.",
    Illustration: CheckoutIllo,
  },
  {
    key: "sync",
    title: "Stock synced across every store",
    subtitle:
      "Sell in one place, adjust in another — inventory updates everywhere.",
    Illustration: SyncIllo,
  },
  {
    key: "payments",
    title: "Every payment, one flow",
    subtitle:
      "Cash, card and transfer settle into one clean, reconciled stream.",
    Illustration: PaymentsIllo,
  },
  {
    key: "team",
    title: "Bring your whole team in, with the right access",
    subtitle:
      "Roles and permissions that follow how your staff actually works.",
    Illustration: TeamIllo,
  },
  {
    key: "analytics",
    title: "See what's selling, in real time",
    subtitle: "Live sales, margins and low-stock alerts — at a glance.",
    Illustration: AnalyticsIllo,
  },
];
