import { getCurrentUser } from "@/lib/server-api";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

export async function SiteHeader({ isCms }: { isCms?: boolean } = {}) {
  const user = await getCurrentUser();
  return <SiteHeaderClient user={user} isCms={isCms} />;
}
