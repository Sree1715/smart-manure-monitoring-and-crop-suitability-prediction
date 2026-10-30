import pandas as pd
import os
import glob

def check_data():
    raw_dir = "data/raw"
    template_files = ["manure_composition_template.csv", "crop_requirements_template.csv"]
    
    files = glob.glob(os.path.join(raw_dir, "*.[cC][sS][vV]")) + glob.glob(os.path.join(raw_dir, "*.[xX][lL][sS][xX]"))
    
    files_checked = 0
    files_with_warnings = 0
    files_missing_from_sources = 0
    
    # Load SOURCES.md to check existence
    sources_path = os.path.join(raw_dir, "SOURCES.md")
    sources_content = ""
    if os.path.exists(sources_path):
        with open(sources_path, 'r') as f:
            sources_content = f.read()

    for file_path in files:
        filename = os.path.basename(file_path)
        if filename in template_files or filename == "SOURCES.md":
            continue
            
        print(f"\n--- Checking {filename} ---")
        files_checked += 1
        has_warning = False
        
        # Check if in SOURCES.md
        if filename not in sources_content:
            print(f"  WARNING: {filename} not listed in SOURCES.md")
            files_missing_from_sources += 1
            has_warning = True
            
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
                
            print(f"  Row count: {len(df)}")
            print(f"  Columns: {df.columns.tolist()}")
            print(f"  Dtypes:\n{df.dtypes}")
            
            missing = df.isnull().sum()
            if missing.sum() > 0:
                print(f"  Missing values:\n{missing[missing > 0]}")
                has_warning = True
                
            duplicates = df.duplicated().sum()
            if duplicates > 0:
                print(f"  Duplicate rows: {duplicates}")
                has_warning = True

            # Example row check
            if (df == "EXAMPLE_ROW_DELETE_ME").any().any():
                print("  WARNING: File contains EXAMPLE_ROW_DELETE_ME")
                has_warning = True
                
            # Impossible values check (simple example)
            if 'ph_min' in df.columns:
                if (df['ph_min'] < 0).any() or (df['ph_min'] > 14).any():
                     print("  WARNING: pH value out of range (0-14)")
                     has_warning = True

        except Exception as e:
            print(f"  ERROR: Could not process file: {e}")
            has_warning = True
            
        if has_warning:
            files_with_warnings += 1

    print("\n--- Summary ---")
    print(f"Files checked: {files_checked}")
    print(f"Files with warnings: {files_with_warnings}")
    print(f"Files missing from SOURCES.md: {files_missing_from_sources}")

if __name__ == "__main__":
    check_data()
