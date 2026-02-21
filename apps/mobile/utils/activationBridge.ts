/**
 * Bridge para sincronizar estado de ativação entre ApiClient e CompanyContext.
 * Quando o ApiClient detecta 401 (dispositivo inválido), notifica o CompanyContext
 * para atualizar o estado imediatamente e evitar inconsistência.
 */
let onDeviceInvalidated: (() => void) | null = null;

export function setOnDeviceInvalidated(callback: (() => void) | null) {
  onDeviceInvalidated = callback;
}

export function notifyDeviceInvalidated() {
  onDeviceInvalidated?.();
}
