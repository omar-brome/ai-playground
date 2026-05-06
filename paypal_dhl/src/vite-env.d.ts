/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYPAL_CLIENT_ID: string
  readonly VITE_DHL_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
