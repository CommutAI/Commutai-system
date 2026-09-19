import openpyxl
from openpyxl.utils import range_boundaries

# Load the Excel file
wb = openpyxl.load_workbook('one manolo manual fare input_03092025.xlsx')
sheet = wb['Sheet1']

print("=== Excel File Structure Analysis ===\n")

# Check for merged cells
print("Merged Cells:")
for merged_range in sheet.merged_cells.ranges:
    print(f"  {merged_range}")
    # Get the value of the merged range
    cell_value = sheet.cell(merged_range.min_row, merged_range.min_col).value
    print(f"    Value: {cell_value}")

print("\n=== First 20 rows with cell coordinates ===")
for row_idx in range(1, 21):
    row_data = []
    for col_idx in range(1, 12):  # Check first 12 columns
        cell = sheet.cell(row_idx, col_idx)
        row_data.append({
            'coord': cell.coordinate,
            'value': cell.value,
            'is_merged': cell.coordinate in [str(r) for r in sheet.merged_cells.ranges]
        })
    
    has_data = any(item['value'] is not None for item in row_data)
    if has_data:
        print(f"\nRow {row_idx}:")
        for item in row_data:
            if item['value'] is not None or item['is_merged']:
                print(f"  {item['coord']}: {item['value']} {'(merged)' if item['is_merged'] else ''}")

print("\n=== Column Headers Analysis ===")
for col_idx in range(1, 12):
    cell = sheet.cell(1, col_idx)
    print(f"Column {col_idx} ({cell.column_letter}): {cell.value}")

print("\n=== Check if there are destination headers in row 2 or beyond ===")
for row_idx in range(1, 5):
    print(f"\nRow {row_idx} potential headers:")
    for col_idx in range(1, 12):
        cell = sheet.cell(row_idx, col_idx)
        if cell.value and str(cell.value).strip():
            print(f"  {cell.coordinate}: {cell.value}")

print("\n=== Sample data rows to understand pattern ===")
for row_idx in range(2, 15):
    row = sheet[row_idx]
    values = [cell.value for cell in row[:12]]
    if any(v is not None for v in values):
        print(f"Row {row_idx}: {values[:7]}")  # Show first 7 columns

print("\n=== Check if data is actually a matrix (destinations as columns) ===")
# Let's see if there are patterns in the null columns
print("Checking columns 2, 3, 4 for any data:")
for row_idx in range(2, 50):
    col2 = sheet.cell(row_idx, 3).value  # Column C
    col3 = sheet.cell(row_idx, 4).value  # Column D  
    col4 = sheet.cell(row_idx, 5).value  # Column E
    
    if col2 or col3 or col4:
        print(f"Row {row_idx}: Col2={col2}, Col3={col3}, Col4={col4}")
