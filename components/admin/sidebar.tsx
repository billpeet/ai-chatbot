"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, Bot, Brain, ThumbsUp, File, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const routes = [
  {
    label: "Agents",
    icon: Bot,
    href: "/admin/agents",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Models",
    icon: Brain,
    href: "/admin/models",
  },
  {
    label: "Votes",
    icon: ThumbsUp,
    href: "/admin/votes",
  },
  {
    label: "Documents",
    icon: File,
    href: "/admin/documents",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-[240px] flex-col border-r bg-background">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
      </div>
      <Separator />
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Chat
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              pathname === route.href && "bg-secondary"
            )}
            asChild
          >
            <Link href={route.href}>
              <route.icon className="size-4" />
              {route.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
