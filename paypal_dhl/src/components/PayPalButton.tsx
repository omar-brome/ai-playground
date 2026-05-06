import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PayPalOnApproveData } from '../types/paypal'
import { PayPalDemoBypassModal } from './PayPalDemoBypassModal'

type PayPalButtonProps = {
  amountUsd: number
  disabled?: boolean
  onApproved: (data: PayPalOnApproveData) => void
}

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined

function demoApproval(): PayPalOnApproveData {
  return {
    orderID: `DEMO-${Date.now()}`,
    payerID: 'DEMO-BYPASS',
  }
}

function loadPayPalSdk(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-lumiere-paypal]',
    )
    if (existing) {
      const done = () => resolve()
      if (window.paypal) done()
      else {
        existing.addEventListener('load', done, { once: true })
        existing.addEventListener(
          'error',
          () => reject(new Error('PayPal SDK load error')),
          {
            once: true,
          },
        )
      }
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`
    script.async = true
    script.dataset.lumierePaypal = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PayPal SDK failed to load'))
    document.body.appendChild(script)
  })
}

export function PayPalButton(props: PayPalButtonProps) {
  if (!CLIENT_ID?.trim()) {
    return (
      <div className="space-y-4">
        <p className="font-sans text-sm text-gold/80">
          No PayPal client ID configured. Add{' '}
          <code className="rounded bg-charcoal-deep px-1.5 py-0.5 font-mono text-xs text-cream">
            VITE_PAYPAL_CLIENT_ID
          </code>{' '}
          to <code className="font-mono text-xs">.env</code> for the live sandbox button,
          or use demo checkout below.
        </p>
        {!props.disabled && props.amountUsd > 0 ? (
          <button
            type="button"
            onClick={() => props.onApproved(demoApproval())}
            className="btn-glow rounded-full border border-gold/45 bg-gold/15 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-gold/30"
          >
            Simulate successful checkout (demo)
          </button>
        ) : null}
      </div>
    )
  }

  if (props.disabled || props.amountUsd <= 0) {
    return (
      <p className="font-sans text-sm text-cream-muted">
        Add items to your cart to pay with PayPal.
      </p>
    )
  }

  return <PayPalMountedButton {...props} />
}

/** Only mounted when PayPal checkout is actionable (guards ESLint hooks + sync set-state in effects). */
function PayPalMountedButton({
  amountUsd,
  onApproved,
}: Omit<PayPalButtonProps, 'disabled'>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<{ close: () => Promise<void> } | null>(null)
  const onApprovedRef = useRef(onApproved)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [bypassModalOpen, setBypassModalOpen] = useState(false)

  useLayoutEffect(() => {
    onApprovedRef.current = onApproved
  })

  useEffect(() => {
    let cancelled = false
    const el = containerRef.current
    const clientId = CLIENT_ID!.trim()
    if (!el) return

    void (async () => {
      try {
        setLoading(true)
        setSdkError(null)
        await loadPayPalSdk(clientId)
        if (cancelled || !containerRef.current) return
        const paypal = window.paypal
        if (!paypal) throw new Error('PayPal namespace missing')

        const value = amountUsd.toFixed(2)
        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          },
          createOrder: async (_data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: 'USD',
                    value,
                  },
                },
              ],
            })
          },
          onApprove: async (data, actions) => {
            try {
              await actions.order?.capture()
            } catch {
              /* capture optional for demo recording */
            }
            onApprovedRef.current(data)
          },
          onError: (err) => {
            console.error(err)
            setSdkError(err.message ?? 'PayPal checkout error')
          },
        })

        buttonsRef.current = buttons
        await buttons.render(containerRef.current)
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'PayPal unavailable'
          setSdkError(msg)
          setBypassModalOpen(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      void buttonsRef.current?.close()
      buttonsRef.current = null
      if (el) el.innerHTML = ''
    }
  }, [amountUsd])

  function handleBypassConfirm() {
    setBypassModalOpen(false)
    setSdkError(null)
    onApprovedRef.current(demoApproval())
  }

  function handleBypassCancel() {
    setBypassModalOpen(false)
  }

  return (
    <div className="w-full max-w-md">
      <PayPalDemoBypassModal
        open={bypassModalOpen}
        errorMessage={sdkError ?? 'Unknown error'}
        onConfirm={handleBypassConfirm}
        onCancel={handleBypassCancel}
      />

      {loading ? (
        <p className="mb-3 font-sans text-sm text-cream-muted">Loading PayPal…</p>
      ) : null}
      {sdkError && !bypassModalOpen ? (
        <p className="mb-3 font-sans text-sm text-red-300/90">{sdkError}</p>
      ) : null}
      <div id="paypal-button-container" ref={containerRef} className="min-h-[120px]" />
    </div>
  )
}
