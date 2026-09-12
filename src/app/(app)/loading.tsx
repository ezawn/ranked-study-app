import { SkeletonPage } from "@/components/ui/route-skeletons";

/**
 * The fallback for any signed-in route that has not defined a closer one.
 *
 * It lives inside the `(app)` group on purpose: the root `loading.tsx` sits
 * above this layout, so using that one would tear down the sidebar, header and
 * coin timer on every navigation and rebuild them a moment later. Here, the
 * shell stays put and only the page area is replaced — which is all that is
 * actually being fetched.
 */
export default function Loading() {
  return <SkeletonPage />;
}
