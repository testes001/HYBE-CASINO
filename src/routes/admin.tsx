import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useWallet } from "@/hooks/useWallet";

function AdminGuard() {
  const { currentUser, isConnected } = useWallet();

  if (!isConnected) {
    return <Navigate to="/" />;
  }

  if (currentUser?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return <AdminDashboard />;
}

export const Route = createFileRoute("/admin")({
  component: AdminGuard,
});
