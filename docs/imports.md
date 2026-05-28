# Imports

## Bybit Futures / Perpetual

Upload the Bybit **Closed PnL** export first. Edgefolio treats Closed PnL as the source of truth for realized performance because it contains the final net result for closed futures/perpetual position segments.

The **Trade History** export is optional but recommended. It contains fills and execution records, so it improves fee validation, order-type analysis, execution count, fill fragmentation, and entry/exit reconstruction. A Trade History row is a fill, not a completed trade, so the importer never counts every Trade History row as a trade.

### Supported Files

- Closed PnL CSV or XLSX
- UTA Perp Trade History CSV or XLSX

The importer detects file type from columns, not just filenames:

- `BYBIT_CLOSED_PNL`
- `BYBIT_TRADE_HISTORY`
- `UNKNOWN`

### Data Quality Labels

- `HIGH`: Closed PnL and Trade History were uploaded, matched, and fee validation passed.
- `MEDIUM`: Closed PnL was uploaded without Trade History. Realized P&L analytics work, but execution detail is missing.
- `LIMITED`: Trade History was uploaded without Closed PnL. Executions can be stored, but realized P&L analytics are limited.
- `LOW`: File type is unknown or required fields are missing.

### Funding

Trade History rows where `Filled Type = Funding` are stored as funding entries, not trades. Analytics can include funding in net P&L, exclude it from trading P&L, and show funding separately.

### Required Bybit Columns

Closed PnL requires:

`Market`, `Order Quantity`, `Entry Price`, `Exit Price`, `Opening Fee`, `Closing Fee`, `Funding Fee`, `Trade Type`, `Realized P&L`, `Trade time`

Trade History requires:

`Market`, `Filled Type`, `Filled Quantity`, `Filled Price`, `Trading Fee`, `Direction`, `Order Type`, `Trasaction ID`, `Order No.`, `Transaction Time(UTC+0)`

The parser also accepts `Transaction ID`, `Trade ID`, and `Exec ID` for the Bybit transaction id field.

### Troubleshooting

If a file is detected as `UNKNOWN`, check that the export includes the original Bybit header row. If a row is rejected, review the saved row error for missing values, invalid numbers, or invalid timestamps. Closed PnL timestamps default to UTC; override the timezone in the import preview if the export was downloaded in another timezone.
