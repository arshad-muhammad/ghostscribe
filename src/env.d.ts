/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_API_URL: string
  readonly VITE_DEFAULT_WORDS_PER_REQUEST: string
  readonly VITE_DEFAULT_WORDS_PER_MONTH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 