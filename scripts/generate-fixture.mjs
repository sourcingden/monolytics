#!/usr/bin/env node
// Generates the synthetic Monobank-statement fixture used by tests and demo mode.
// Mirrors every structural pattern found in the real sample statement that shaped the
// plan (P2P transfers with commission, "Кредит До завтра" draws, savings jar top-ups,
// installment purchases, cash withdrawals, refunds, "Від:" income) but with invented
// people, merchants and amounts — no real personal data goes into the repo.
//
// Run: node scripts/generate-fixture.mjs > tests/fixtures/sample-statement.csv

const HEADER = [
  'Дата i час операції',
  'Деталі операції',
  'MCC',
  'Сума в валюті картки (UAH)',
  'Сума в валюті операції',
  'Валюта',
  'Курс',
  'Сума комісій (UAH)',
  'Сума кешбеку (UAH)',
  'Залишок після операції',
]

const DASH = '—'

function fmtDate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function fmtNum(n) {
  return n.toFixed(2)
}

/** @type {{date: Date, description: string, mcc: string, amount: number, opAmount?: number, opCurrency?: string, rate?: number, commission?: number, cashback?: number}[]} */
const rows = []

function push(dateStr, description, mcc, amount, extra = {}) {
  rows.push({ date: new Date(dateStr), description, mcc, amount, ...extra })
}

// --- April 2025 ---
push('2025-04-01T09:05:00', 'Від: ТОВ Ромашка Пей', DASH, 32000, {}) // salary via named transfer
push('2025-04-02T08:41:00', 'Сільпо', '5411', -612.4)
push('2025-04-02T18:12:00', 'Aroma Kava', '5814', -78)
push('2025-04-03T08:55:00', 'Aroma Kava', '5814', -78)
push('2025-04-03T19:30:00', 'WOG', '5541', -850)
push('2025-04-04T08:50:00', 'Aroma Kava', '5814', -82)
push('2025-04-04T21:10:00', 'Netflix', '5815', -219)
push('2025-04-05T08:47:00', 'Aroma Kava', '5814', -80)
push('2025-04-05T13:20:00', 'Rozetka', '5399', -3499)
push('2025-04-06T08:53:00', 'Aroma Kava', '5814', -79)
push('2025-04-06T20:05:00', 'Київстар +380671234567', '4814', -350)
push('2025-04-07T08:44:00', 'Aroma Kava', '5814', -85)
push('2025-04-07T12:30:00', 'Аптека Доброго Дня', '5912', -240.5)
push('2025-04-08T08:51:00', 'Aroma Kava', '5814', -77)
push('2025-04-08T19:00:00', 'Uklon', '4121', -145)
push('2025-04-09T08:48:00', 'Aroma Kava', '5814', -83)
push('2025-04-10T18:00:00', 'Кредит До завтра на 14 днів', '4829', 3000)
push('2025-04-10T18:05:00', 'Олена П.', '4829', -1200, { commission: 40.8 })
push('2025-04-11T09:10:00', 'Сільпо', '5411', -455.1)
push('2025-04-12T21:45:00', 'Аврора', '5310', -119)
push('2025-04-13T22:10:00', 'McDonald’s', '5814', -215)
push('2025-04-13T22:40:00', 'Rozetka', '5399', -389, {}) // late-night cluster w/ mcdonalds
push('2025-04-15T08:30:00', 'Видача готівки АТБ', '5411', -1000, { commission: 20 })
push('2025-04-18T17:20:00', 'Поповнення «Відпустка»', '4829', -1500, { commission: 51 })
push('2025-04-20T09:00:00', 'Спортзал MEGAGYM', '7997', -899)
push('2025-04-22T14:10:00', 'Аптека Доброго Дня', '5912', -95)
push('2025-04-25T19:00:00', 'Spotify', '5735', -159)
push('2025-04-28T10:00:00', 'Сільпо', '5411', -601.2)
push('2025-04-30T09:15:00', 'Дія | Штрафи', '9222', -510)

// --- May 2025 ---
push('2025-05-01T09:05:00', 'Від: ТОВ Ромашка Пей', DASH, 32500)
push('2025-05-02T08:44:00', 'Aroma Kava', '5814', -80)
push('2025-05-02T18:00:00', 'Сільпо', '5411', -588.9)
push('2025-05-03T08:41:00', 'Aroma Kava', '5814', -84)
push('2025-05-03T19:10:00', 'WOG', '5541', -900)
push('2025-05-04T08:52:00', 'Aroma Kava', '5814', -81)
push('2025-05-04T21:05:00', 'Netflix', '5815', -219)
push('2025-05-05T08:46:00', 'Aroma Kava', '5814', -86)
push('2025-05-05T20:20:00', 'Uklon', '4121', -160)
push('2025-05-06T08:49:00', 'Aroma Kava', '5814', -79)
push('2025-05-06T20:05:00', 'Київстар +380671234567', '4814', -350)
push('2025-05-07T08:45:00', 'Aroma Kava', '5814', -88)
push('2025-05-07T13:00:00', 'Аптека Доброго Дня', '5912', -180)
push('2025-05-08T08:50:00', 'Aroma Kava', '5814', -82)
push('2025-05-09T22:15:00', 'Glovo', '5814', -420)
push('2025-05-09T22:50:00', 'Rozetka', '5399', -299) // late-night cluster
push('2025-05-10T18:00:00', 'Кредит До завтра на 10 днів', '4829', 2500)
push('2025-05-10T18:05:00', 'Олена П.', '4829', -1200, { commission: 40.8 })
push('2025-05-11T09:00:00', 'Сільпо', '5411', -470.3)
push('2025-05-12T21:00:00', 'Аврора', '5310', -129)
push('2025-05-14T12:00:00', 'Apple', '5818', -458.2, { opAmount: -9.99, opCurrency: 'USD', rate: 45.87 })
push('2025-05-16T08:30:00', 'Видача готівки АТБ', '5411', -1200, { commission: 24 })
push('2025-05-18T17:15:00', 'Поповнення «Відпустка»', '4829', -1500, { commission: 51 })
push('2025-05-20T09:00:00', 'Спортзал MEGAGYM', '7997', -899)
push('2025-05-22T14:00:00', 'Аптека Доброго Дня', '5912', -60)
push('2025-05-25T19:00:00', 'Spotify', '5735', -159)
push('2025-05-27T10:00:00', 'Сільпо', '5411', -615.6)
push('2025-05-29T08:00:00', 'Скасування. Rozetka', '5399', 299)

// --- June 2025 (partial — through the 18th, for burn-rate forecasting) ---
push('2025-06-01T09:05:00', 'Від: ТОВ Ромашка Пей', DASH, 32500)
push('2025-06-02T08:44:00', 'Aroma Kava', '5814', -85)
push('2025-06-02T18:00:00', 'Сільпо', '5411', -540)
push('2025-06-03T08:41:00', 'Aroma Kava', '5814', -84)
push('2025-06-03T19:00:00', 'WOG', '5541', -950)
push('2025-06-04T08:52:00', 'Aroma Kava', '5814', -83)
push('2025-06-04T21:00:00', 'Netflix', '5815', -219)
push('2025-06-05T08:46:00', 'Aroma Kava', '5814', -87)
push('2025-06-06T20:05:00', 'Київстар +380671234567', '4814', -350)
push('2025-06-07T08:45:00', 'Aroma Kava', '5814', -89)
push('2025-06-07T13:00:00', 'Аптека Доброго Дня', '5912', -640) // category-outlier spike
push('2025-06-08T08:50:00', 'Aroma Kava', '5814', -84)
push('2025-06-09T21:30:00', 'Glovo', '5814', -510)
push('2025-06-09T22:00:00', 'Rozetka', '5399', -350) // late-night cluster
push('2025-06-10T18:00:00', 'Кредит До завтра на 7 днів', '4829', 2000)
push('2025-06-10T18:05:00', 'Олена П.', '4829', -1300, { commission: 44.2 })
push('2025-06-11T09:00:00', 'Сільпо', '5411', -505.4)
push('2025-06-14T12:00:00', 'Apple', '5818', -463.9, { opAmount: -9.99, opCurrency: 'USD', rate: 46.44 })
push('2025-06-16T08:30:00', 'Видача готівки АТБ', '5411', -1500, { commission: 30 })
push('2025-06-18T17:00:00', 'Rozetka', '5399', -6200) // new-merchant-large-ish / big ticket

let balance = 15000
const withBalance = rows
  .slice()
  .sort((a, b) => a.date.getTime() - b.date.getTime())
  .map((r) => {
    balance += r.amount
    return { ...r, balanceAfter: balance }
  })

// Monobank exports newest-first — mimic that, and prove the parser doesn't care about order.
withBalance.sort((a, b) => b.date.getTime() - a.date.getTime())

const lines = [HEADER.join('\t')]
for (const r of withBalance) {
  lines.push(
    [
      fmtDate(r.date),
      r.description,
      r.mcc,
      fmtNum(r.amount),
      r.opAmount != null ? fmtNum(r.opAmount) : fmtNum(r.amount),
      r.opCurrency ?? 'UAH',
      r.rate != null ? fmtNum(r.rate) : DASH,
      r.commission != null ? fmtNum(r.commission) : DASH,
      r.cashback != null ? fmtNum(r.cashback) : DASH,
      fmtNum(r.balanceAfter),
    ].join('\t'),
  )
}

process.stdout.write(lines.join('\n') + '\n')
