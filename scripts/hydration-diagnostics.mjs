import { createHash } from 'node:crypto';

export function instrumentReactHydrationCapture(source) {
  const marker = 'function rD(e){var n=Error(i(418,';
  if (typeof source !== 'string' || source.split(marker).length !== 2 || source.includes('__greeniaHydrationCapture')) {
    throw new Error('Runtime React không khớp điểm chẩn đoán đã kiểm tra.');
  }
  // Chỉ quan sát trước lỗi, giữ nguyên logic tạo và ném lỗi của React.
  const code = source.replace(marker, 'function rD(e){try{if(typeof window.__greeniaHydrationCapture==="function")window.__greeniaHydrationCapture(e)}catch{}var n=Error(i(418,');
  return {
    code,
    originalSha256: createHash('sha256').update(source).digest('hex'),
    instrumentedSha256: createHash('sha256').update(code).digest('hex'),
  };
}
