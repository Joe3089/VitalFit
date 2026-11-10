export type MembershipStatusType = "active" | "expired" | "cancelled";

interface StatusConfig {
  badgeColor: string;
  progressBarColor: string;
  iconColor: string;
  translationKey: string;
}

export const MEMBERSHIP_STATUS_CONFIG: Record<
  MembershipStatusType,
  StatusConfig
> = {
  active: {
    badgeColor: "bg-green-100 text-green-700 border-green-200",
    progressBarColor: "bg-gradient-to-r from-orange-400 to-orange-500",
    iconColor: "text-orange-500",
    translationKey: "active",
  },
  expired: {
    badgeColor: "bg-red-100 text-red-700 border-red-200",
    progressBarColor: "bg-red-500",
    iconColor: "text-red-500",
    translationKey: "expired",
  },
  cancelled: {
    badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
    progressBarColor: "bg-gray-300",
    iconColor: "text-gray-400",
    translationKey: "cancelled",
  },
};
