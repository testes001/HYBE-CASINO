import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingBanner } from "@/components/FloatingBanner";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useWallet } from "@/hooks/useWallet";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
  const { currentUser } = useWallet();
  const isAdmin = currentUser?.role === "admin";

	return (
		<div className="flex flex-col min-h-screen">
			<ErrorBoundary tagName="main" className="flex-1">
				<Outlet />
			</ErrorBoundary>
			<Toaster richColors position="top-right" />
			<TanStackRouterDevtools position="bottom-right" />
			<FloatingBanner position="bottom-left" />
      {isAdmin && (
        <div className="absolute bottom-4 right-4">
          <Link to="/admin" className="p-2 bg-primary text-primary-foreground rounded-full">
            Admin
          </Link>
        </div>
      )}
		</div>
	);
}
