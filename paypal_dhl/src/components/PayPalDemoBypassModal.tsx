type PayPalDemoBypassModalProps = {
  open: boolean
  errorMessage: string
  onConfirm: () => void
  onCancel: () => void
}

export function PayPalDemoBypassModal({
  open,
  errorMessage,
  onConfirm,
  onCancel,
}: PayPalDemoBypassModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paypal-bypass-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-gold/25 bg-charcoal-deep p-6 shadow-[0_0_80px_-20px_rgba(201,169,110,0.35)] card-glow"
      >
        <h2
          id="paypal-bypass-title"
          className="font-display text-xl text-cream sm:text-2xl"
        >
          PayPal unavailable
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-cream-muted">
          The PayPal SDK could not load (
          <span className="text-gold/90">{errorMessage}</span>
          ). That often happens if sandbox is blocked in your region, the client ID
          is missing, or the script is blocked by the network.
        </p>
        <p className="mt-4 font-sans text-sm leading-relaxed text-cream">
          For this <strong className="font-semibold text-gold">demo only</strong>, would
          you like to skip PayPal and simulate a successful payment? You will continue
          to order confirmation and DHL tracking as usual.
        </p>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gold/30 px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-cream-muted transition hover:border-gold/50 hover:text-cream"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-glow rounded-full border border-gold/45 bg-gold/25 px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-charcoal transition hover:bg-gold/40"
          >
            Yes, simulate checkout
          </button>
        </div>
      </div>
    </div>
  )
}
