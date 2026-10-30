import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }) {
  return <AdminGuard>{children}</AdminGuard>;
}