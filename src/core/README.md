# src/core

Pure TypeScript. No React, no DOM, no i18n, no network calls — everything here is
plain data in, plain data out, so it's testable in isolation and never accidentally
depends on the browser. The UI layer (`src/ui`, `src/store`) is the only thing that
imports React and talks to IndexedDB; it composes these modules but never the other
way around.

- `parse/` — CSV text → `Transaction[]` shells (dates, numbers, dedup). Knows nothing
  about categories.
- `categorize/` — the cascade that turns a shell into a fully resolved transaction
  (`kind`, `category`, `merchant`). See the plan's "Категоризация" section for why a
  single MCC code isn't enough on its own.
- `analyze/` — aggregations over already-categorized transactions: totals, trends,
  recurring-charge detection, anomalies, cashflow.
- `insights/` — 18 independent detectors, each a pure function over
  `{ transactions: Transaction[] }`, returning typed `Insight` objects. No detector
  ever invents a number — every field comes from the data.
- `budget/` — 50/30/20 split, savings rate, emergency-fund sizing, the "what if"
  simulator, and the 0-100 financial checkup score.

No AI, no external API calls anywhere in this tree — see the plan's privacy section.
