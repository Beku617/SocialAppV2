import { getUser, type AuthUser } from "./config";
import { getMe } from "./auth";

export const getHomeRouteForUser = (
  user: Pick<AuthUser, "role"> | null | undefined,
): "/admin" | "/(dashboard)" => {
  return user?.role === "admin" ? "/admin" : "/(dashboard)";
};

export async function resolveSessionUser(): Promise<AuthUser | null> {
  const storedUser = await getUser();
  if (storedUser?.role) {
    return storedUser;
  }

  const meResult = await getMe();
  if (meResult.data) {
    return meResult.data;
  }

  return storedUser;
}
