import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync('src/lib/utils.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const originalTimezone = process.env.TZ;
let comparisons = 0;

try {
  for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh']) {
    process.env.TZ = timezone;
    let formatterCreations = 0;
    const reference = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const exports = {};
    const context = vm.createContext({
      exports, Date,
      Intl: {
        DateTimeFormat: class extends Intl.DateTimeFormat {
          constructor(...args) { super(...args); formatterCreations++; }
        },
      },
    });
    vm.runInContext(compiled, context);
    assert.equal(formatterCreations, 0, 'Nạp tiện ích không được khởi tạo bộ định dạng');
    const format = exports.formatVietnamDate;
    for (const value of [null, undefined, '', 'không-phải-ngày', new Date(NaN), NaN]) {
      assert.equal(format(value), '');
    }
    assert.equal(formatterCreations, 0, 'Đầu vào rỗng/lỗi không cần bộ định dạng');

    const modernDates = [
      '1976-01-01T00:00:00Z', '2026-09-30T16:59:59.999Z',
      '2026-09-30T17:00:00Z', '2024-02-29T18:30:00Z',
      '2026-10-01', '2026-10-01T00:00:00',
      '2026-10-01T03:30:00+14:00', '9999-12-31T16:59:59.999Z',
    ];
    // Đối chiếu với Intl độc lập ở ngày nhuận, ranh giới ngày và các thập kỷ.
    for (let year = 1976; year <= 2100; year++) {
      for (const month of [0, 1, 5, 11]) {
        modernDates.push(Date.UTC(year, month, 1, 17), Date.UTC(year, month, 28, 16, 59));
      }
    }
    for (const value of modernDates) {
      const date = new Date(value);
      assert.equal(format(value), reference.format(date), `${timezone}: ${date.toISOString()}`);
      assert.equal(format(date), reference.format(date), 'Đầu vào Date phải giữ nguyên kết quả');
      comparisons += 2;
    }
    assert.equal(formatterCreations, 0, 'Ngày hiện đại không được khởi tạo ICU');

    for (const value of [
      0, '1910-06-30T17:00:00Z', '1945-03-14T16:30:00Z',
      '1975-06-12T16:30:00Z', '1975-06-13T00:00:00Z',
      '0001-01-01T00:00:00Z', '+010000-01-01T00:00:00Z',
      -8640000000000000, 8640000000000000,
    ]) {
      assert.equal(format(value), reference.format(new Date(value)), 'Ngày ngoài khoảng tối ưu phải giữ cách định dạng cũ');
      comparisons++;
    }
    assert.equal(formatterCreations, 1, 'Ngày lịch sử dùng lại một bộ định dạng');
  }
} finally {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
}

console.log(`Đạt ${comparisons} đối chiếu ngày tháng trên 3 múi giờ; không khởi tạo ICU cho ngày hiện đại.`);
