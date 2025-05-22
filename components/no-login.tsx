"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export const NoLogin = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Please login to continue</h1>
      <Button onClick={() => signIn("microsoft-entra-id")} className="mt-4">
        Login
      </Button>
    </div>
  );
};
