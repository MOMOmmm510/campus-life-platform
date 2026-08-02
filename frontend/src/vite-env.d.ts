/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基础地址（生产部署时通过 VITE_API_BASE 注入） */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}