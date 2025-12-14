import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/AdminDashboard";
import { userSession } from "@/hooks/useWallet";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (!userSession.isUserSignedIn()) {
      throw redirect({
        to: "/",
      });
    }
    const userData = userSession.loadUserData();
    const user = await authService.getUserByWallet(userData.profile.btcAddress.p2wpkh.mainnet);
    if (user?.role !== "admin") {
      throw redirect({
        to: "/",
      });
    }
  },
  component: AdminDashboard,
});
