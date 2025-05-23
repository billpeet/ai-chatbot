"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Document = {
  id?: string;
  baseUrl?: string | null;
  name: string | null;
  type: "file" | "url" | "wordpress" | null;
  contentType: "text" | "image" | "video" | "audio" | "pdf" | "html" | null;
  url: string | null;
  size: number | null;
  contentSummary: string | null;
  count: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export const columns = ({
  deleteResource,
}: {
  deleteResource: (doc: Document) => void | Promise<void>;
}): ColumnDef<Document>[] => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const url = row.original.url;
        return (
          <div>
            <div className="flex items-center gap-2">
              {name}
              {url && (
                <ExternalLink
                  className="size-4 cursor-pointer"
                  onClick={() => window.open(url, "_blank")}
                />
              )}
            </div>
            {row.original.count > 1 && (
              <span className="text-sm text-gray-500">
                ({row.original.count} pages)
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "contentSummary",
      header: "Content Summary",
      cell: ({ row }) => {
        const contentSummary = row.getValue("contentSummary") as string;
        return (
          contentSummary.slice(0, 100) +
          (contentSummary.length > 100 ? "..." : "")
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
    },
    {
      accessorKey: "contentType",
      header: "Content Type",
      cell: ({ row }) => {
        const type = row.getValue("contentType") as string;
        return type.toUpperCase();
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => {
        const size = row.getValue("size") as number;
        return `${(size / 1024).toFixed(2)} KB`;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as Date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const document = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteResource(document)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
