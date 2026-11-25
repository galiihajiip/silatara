import { RoleIconRail } from "@/components/AppNav";
import { currentPath, requireUser } from "@/lib/server-api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Proteksi di server: tanpa sesi valid -> redirect ke /masuk. (Backend tetap memeriksa tiap API.)
  const path = await currentPath();
  const user = await requireUser(path);

  // Layar studio latihan: fokus penuh, tanpa sidebar, agar area video menjadi elemen utama.
  if (/\/lessons\/[^/?]+\/practice(\?|$)/.test(path)) {
    return (
      <div data-fullbleed data-cms-shell data-focus-layout className="flex-1 bg-[#F4F5F7] bg-batik-kawung text-slate-900">
        <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</div>
      </div>
    );
  }

  return (
    <div data-fullbleed data-cms-shell className="flex-1 bg-[#F4F5F7] bg-batik-kawung text-slate-900">
      <div className="mx-auto flex max-w-[1440px] items-start gap-6 px-4 pb-24 pt-4 sm:px-6 md:pb-10 lg:px-8">
        <RoleIconRail role={user.role} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
