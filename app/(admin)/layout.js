
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let timeoutId;

    // Allow the admin sign-in redirect page to load without a session.
    if (pathname === "/admin/signin") {
      timeoutId = window.setTimeout(() => {
        setIsAuthorized(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    // Recheck authorization whenever the route changes.
    timeoutId = window.setTimeout(() => {
      setIsAuthorized(false);

      const user = getCurrentUser();

      if (!user) {
        router.replace(
          `/admin/signin?next=${encodeURIComponent(pathname || "/admin")}`,
        );
        return;
      }

      if (user.role !== "admin") {
        router.replace("/");
        return;
      }

      setIsAuthorized(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, router]);

  if (!isAuthorized) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-600">
          Checking administrator access...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
