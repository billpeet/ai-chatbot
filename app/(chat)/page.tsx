import { cookies } from "next/headers";

import { Chat } from "@/components/chat/chat";
import { NoLogin } from "@/components/no-login";

import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { auth } from "../(auth)/auth";

export default async function Page() {
  const session = await auth();
  if (!session) {
    return <NoLogin />;
  }

  const chatId = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={chatId}
          id={chatId}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={chatId} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={chatId}
        id={chatId}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={chatId} />
    </>
  );
}
