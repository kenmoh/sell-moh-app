import type { AuthUser } from "@/types/auth";

/**
 * The roles a user holds.
 *
 * A user can hold several roles at once, and the token's `role` field is the
 * comma-joined string that older clients read. The `roles` list is
 * authoritative; the string is split only when it is missing, so a session that
 * predates the list still resolves.
 */
export const rolesOf = (
  user: Pick<AuthUser, "role" | "roles"> | null | undefined,
): string[] => {
  if (!user) return [];
  if (user.roles?.length) return user.roles.filter(Boolean);
  return (user.role ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
};

/** True when the user holds any of the named roles. Case-insensitive. */
export const holdsRole = (
  user: Pick<AuthUser, "role" | "roles"> | null | undefined,
  ...names: string[]
): boolean => {
  const held = rolesOf(user).map((role) => role.toLowerCase());
  return names.some((name) => held.includes(name.toLowerCase()));
};

/**
 * Whether the user is the owner.
 *
 * This has to go through the role list rather than comparing `role`, which
 * reads "owner,manager" for an owner who also holds another role — so an
 * equality check hid the store switcher and asked them for a supervisor PIN on
 * actions the backend lets them take alone.
 */
export const isOwnerRole = (
  user: Pick<AuthUser, "role" | "roles"> | null | undefined,
): boolean => holdsRole(user, "owner");

/** Highest ranked role, for display. Roles arrive ordered by rank. */
export const primaryRoleOf = (
  user: Pick<AuthUser, "role" | "roles"> | null | undefined,
): string => rolesOf(user)[0] ?? "";