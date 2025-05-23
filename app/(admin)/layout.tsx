import { Sidebar } from "@/components/admin/sidebar";
import { auth } from "../(auth)/auth";
import { Session } from "next-auth";

function AdminContent({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  if (session?.user.type !== "admin") {
    return <div>(You are not authorized to access this page)</div>;
  }
  return <div>{children}</div>;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <AdminContent session={session}>{children}</AdminContent>
      </main>
    </div>
  );
}
