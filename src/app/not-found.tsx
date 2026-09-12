import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="panel max-w-md px-8 py-12 text-center">
        <div className="num text-[56px] font-semibold leading-none text-accent">404</div>
        <h1 className="mt-4 font-display text-[17px] font-semibold text-bright">
          That page isn&apos;t here
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It might have been deleted, or it might belong to someone else.
        </p>
        <ButtonLink href="/dashboard" size="lg" className="mt-6">
          Back to the dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
