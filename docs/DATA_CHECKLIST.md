# Data Intake Checklist

Follow these steps for any new data source:

1.  **Download & Verify**:
    *   Download the data file to `data/raw/`.
    *   Confirm the file format (CSV/XLSX).
2.  **Record Source**:
    *   Add an entry to `data/raw/SOURCES.md`.
    *   Include full title, URL, licence, year, and notes on units.
3.  **Check Units**:
    *   **Crucial**: Confirm units are standard (e.g., kg/ha vs %).
    *   Confirm Phosphorus is P or P2O5; Potassium is K or K2O.
4.  **Run Validation**:
    *   Run the check script: `python scripts/check_raw_data.py`.
5.  **Fix Warnings**:
    *   Address all warnings printed by the script (duplicates, missing values, range errors).
    *   Remove any `EXAMPLE_ROW_DELETE_ME` entries.
6.  **Finalize**:
    *   Ensure the entry in `SOURCES.md` is complete.
