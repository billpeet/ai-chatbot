import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
export type Vote = {
  messageId: string;
  parts: any[];
  chatId: string;
  chatTitle: string;
  userId: string;
  userEmail: string;
  isUpvoted: boolean;
};

export const columns = (): ColumnDef<Vote, unknown>[] => [
  {
    accessorKey: "isUpvoted",
    header: "Vote Type",
    cell: ({ row }) => {
      const isUpvoted = row.getValue("isUpvoted") as boolean;
      return isUpvoted ? (
        <ThumbsUpIcon className="text-green-500" />
      ) : (
        <ThumbsDownIcon className="text-red-500" />
      );
    },
  },
  {
    accessorKey: "chatTitle",
    header: "Chat",
    cell: ({ row }) => {
      const chatTitle = row.original.chatTitle;
      return (
        <div className="flex items-center gap-2">
          {chatTitle}
          <ExternalLink
            className="size-4 cursor-pointer"
            onClick={() => {
              window.open(`/chat/${row.original.chatId}`, "_blank");
            }}
          />
        </div>
      );
    },
  },
  {
    accessorKey: "messageContent",
    header: "Message",
    cell: ({ row }) => {
      const messageContent = row.original.parts
        ?.map((part: any) => part.text)
        .join("");
      return <div>{messageContent}</div>;
    },
  },
  {
    accessorKey: "userEmail",
    header: "User",
  },
];
