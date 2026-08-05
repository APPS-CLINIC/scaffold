/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PREVIEW_DATA_PROFILE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
