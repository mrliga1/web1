import assert from 'node:assert/strict';
import vm from 'node:vm';
import { instrumentReactHydrationCapture } from './hydration-diagnostics.mjs';

const source = 'function rD(e){var n=Error(i(418,1<arguments.length&&void 0!==arguments[1]&&arguments[1]?"text":"HTML",""));throw rU(rd(n,e)),rF}';
function execute(code, callback, text = false, withoutWindow = false) {
  const sentinel = { original: true }, queue = [], fiber = { tag: 5, type: 'p' };
  const globals = { Error, i: (...args) => args.join(':'), rU: item => queue.push(item), rd: (error, value) => ({ message: error.message, sameFiber: value === fiber }), rF: sentinel };
  if (!withoutWindow) globals.window = { __greeniaHydrationCapture: callback };
  vm.runInNewContext(code, globals);
  assert.throws(() => globals.rD(fiber, text), error => error === sentinel);
  return { queue, fiber };
}
let passed = 0;
function check(name, callback) { callback(); passed++; console.log('Đạt: ' + name); }
check('giữ nguyên lỗi HTML và fiber, chỉ thêm quan sát trước lỗi', () => {
  let captured;
  const patched = instrumentReactHydrationCapture(source);
  const baseline = execute(source), observed = execute(patched.code, fiber => { captured = fiber; });
  assert.deepEqual(observed.queue, baseline.queue);
  assert.equal(captured, observed.fiber);
  assert.equal(patched.originalSha256.length, 64);
  assert.equal(patched.instrumentedSha256.length, 64);
  assert.notEqual(patched.originalSha256, patched.instrumentedSha256);
});
check('giữ nguyên tham số xác định sai lệch chữ', () => {
  assert.deepEqual(execute(instrumentReactHydrationCapture(source).code, () => {}, true).queue, execute(source, undefined, true).queue);
});
check('quan sát lỗi hoặc không có window vẫn giữ cách React ném lỗi', () => {
  for (const [callback, noWindow] of [[() => { throw new Error('Lỗi quan sát'); }, false], [undefined, false], [undefined, true]]) {
    assert.deepEqual(execute(instrumentReactHydrationCapture(source).code, callback, false, noWindow).queue, execute(source).queue);
  }
});
check('từ chối runtime không khớp, nhiều điểm trùng hoặc đã gắn quan sát', () => {
  for (const input of ['function other(){}', source + source, instrumentReactHydrationCapture(source).code, null]) assert.throws(() => instrumentReactHydrationCapture(input), /không khớp/);
});
console.log('Kiểm thử quan sát lỗi gắn tương tác: ' + passed + '/4 đạt.');
