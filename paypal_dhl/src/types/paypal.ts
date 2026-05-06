/** Minimal PayPal JS SDK shapes for sandbox checkout */

export type PayPalOnApproveData = {
  orderID: string
  payerID?: string
}

export type PayPalButtons = {
  render: (selector: HTMLElement | string) => Promise<void>
  close: () => Promise<void>
}

export type PayPalNamespace = {
  Buttons: (options: {
    createOrder: (
      data: Record<string, unknown>,
      actions: {
        order: {
          create: (opts: {
            purchase_units: Array<{
              amount: { value: string; currency_code?: string }
            }>
          }) => Promise<string>
        }
      },
    ) => Promise<string>
    onApprove?: (
      data: PayPalOnApproveData,
      actions: {
        order?: {
          capture: () => Promise<unknown>
        }
      },
    ) => Promise<void>
    onError?: (err: Error) => void
    style?: {
      layout?: string
      color?: string
      shape?: string
      label?: string
    }
  }) => PayPalButtons
}

declare global {
  interface Window {
    paypal?: PayPalNamespace
  }
}

export {}
