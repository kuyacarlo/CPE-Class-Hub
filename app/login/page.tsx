"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Plate from "@/components/Plate";
import { browserClient } from "@/lib/supabase/browser";

function SignIn() {
  const failed = useSearchParams().has("error");
  const signIn = () =>
    browserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
  return (
    <Plate
      title="Officer sign-in"
      actions={<>
        <button className="btn p" onClick={signIn}>Sign in with Google</button>
        <Link href="/">Back to the schedule</Link>
      </>}
    >
      <p>Officers sign in with Google to post notices, classes and files. Use the account the head officer added.</p>
      {failed && <p role="alert">Sign-in didn&apos;t finish. Try again.</p>}
    </Plate>
  );
}

export default function LoginPage() {
  return <Suspense><SignIn /></Suspense>;
}
