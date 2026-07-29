import { requireProfile } from "@/lib/auth/session";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const primaryMembership = profile.memberships[0];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <p className="text-sm font-medium text-zinc-100">
            {primaryMembership?.workspace.name ?? "Sem workspace"}
          </p>
          <p className="text-xs text-zinc-500">
            {profile.email}
            {primaryMembership ? ` · ${primaryMembership.role}` : ""}
            {profile.isPlatformAdmin ? " · admin" : ""}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-200">
            Sair
          </button>
        </form>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
