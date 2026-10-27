
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Allow the admin sign-in redirect page to load without a session.
    if (pathname === "/admin/signin") {
      setIsAuthorized(true);
      return;
    }

    // Recheck authorization whenever the route changes.
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
