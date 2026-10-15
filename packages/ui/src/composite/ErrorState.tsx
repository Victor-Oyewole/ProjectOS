import { Button } from "../primitives/Button";

// Doc 19 Section 1 (Error state): "Human-readable message (not a raw
// error code), with a retry action where applicable; errors logged to
// monitoring (Doc 20) regardless of what's shown to the user." This
// component only covers the display half -- the "logged to monitoring"
// half is explicit Milestone 7 scope (Doc 16: "Error tracking/monitoring
// live" under Pilot Launch Readiness), not yet wired anywhere in the app
// (no Sentry integration exists yet, despite Sentry already being seeded
// in Doc 28's ThirdPartyProcessor registry as the intended choice).
// Flagging rather than silently treating this half of the requirement as
// done.
export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-danger/30 bg-danger/5 px-4 py-8 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
