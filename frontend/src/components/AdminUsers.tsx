"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientRequest } from "@/lib/client-api";
import { ROLE_LABEL } from "@/lib/format";
import { Notice } from "@/components/Notice";
import { BentoTable, CMS_TD, CMS_TH } from "@/components/cms/Bento";
import type { AdminUser } from "@/lib/types";

export function AdminUsers({ users, selfId }: { users: AdminUser[]; selfId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  async function patch(id: string, body: Record<string, string>) {
    const r = await clientRequest("PATCH", `/admin/users/${id}`, body);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    setMsg({ kind: "success", text: "Perubahan disimpan; sesi pengguna tersebut dicabut." });
    router.refresh();
  }
  const selectCls =
    "rounded-xl border border-slate-200 bg-[#F4F5F7] px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:border-forest-700/40 focus:bg-white disabled:opacity-50";
  return (
    <>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>
      <BentoTable>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Daftar pengguna</caption>
          <thead className="border-b border-slate-200/80 bg-slate-50/70">
            <tr>
              <th scope="col" className={CMS_TH}>Pengguna</th>
              <th scope="col" className={CMS_TH}>Peran</th>
              <th scope="col" className={CMS_TH}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-parchment-100/40">
                <td className={CMS_TD}>
                  <span className="font-medium text-slate-900">{u.display_name}</span>
                  <br />
                  <span className="text-xs text-slate-500">{u.email}</span>
                </td>
                <td className={CMS_TD}>
                  <label className="sr-only" htmlFor={`r-${u.id}`}>Peran {u.display_name}</label>
                  <select
                    id={`r-${u.id}`}
                    disabled={u.id === selfId}
                    defaultValue={u.role}
                    onChange={(e) => patch(u.id, { role: e.target.value })}
                    className={selectCls}
                  >
                    {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td className={CMS_TD}>
                  <label className="sr-only" htmlFor={`s-${u.id}`}>Status {u.display_name}</label>
                  <select
                    id={`s-${u.id}`}
                    disabled={u.id === selfId}
                    defaultValue={u.status}
                    onChange={(e) => patch(u.id, { status: e.target.value })}
                    className={selectCls}
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </BentoTable>
    </>
  );
}
