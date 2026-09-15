import openpyxl
import json
from collections import defaultdict

# Load the Excel file with data_only=True to get calculated values
wb = openpyxl.load_workbook('one manolo manual fare input_03092025.xlsx', data_only=True)
sheet = wb['Sheet1']

# Get the actual column headers
headers = []
for cell in sheet[1]:
    headers.append(cell.value)

print(f"Headers: {headers}")

# Read the data rows
fare_data = []
for row in sheet.iter_rows(min_row=2, values_only=True):
    if any(cell is not None for cell in row):
        fare_data.append(row)

print(f"Total data rows: {len(fare_data)}")

# Get unique stoppages
stoppages = set()
for row in fare_data:
    if row[1]:  # Name stoppage column
        stoppages.add(row[1])

print(f"Unique stoppages: {sorted(stoppages)}")
print(f"Number of unique stoppages: {len(stoppages)}")

# Group data by stoppage
stoppages_data = defaultdict(list)

for row in fare_data:
    if row[1]:  # Name stoppage
        stoppage_name = row[1]
        stoppages_data[stoppage_name].append({
            'nos': row[0],
            'regular_fare': row[5] if len(row) > 5 else None,
            'discounted_fare': row[6] if len(row) > 6 else None,
            'full_row': row
        })

# Create structured JSON for conductor fare metrics
conductor_fare_metrics = {
    "route_name": "Manalo Fortich Terminal ↔ Agora Terminal",
    "base_currency": "PHP",
    "fare_type": "distance_based",
    "stops": []
}

# Create structured JSON for admin fare metrics
admin_fare_metrics = {
    "route_name": "Manalo Fortich Terminal ↔ Agora Terminal",
    "fare_matrix": [],
    "statistics": {
        "total_stops": len(stoppages),
        "min_regular_fare": None,
        "max_regular_fare": None,
        "min_discounted_fare": None,
        "max_discounted_fare": None
    }
}

# Process the data into a proper structure
for stoppage in sorted(stoppages):
    data = stoppages_data[stoppage]
    
    # Get non-zero fares
    regular_fares = [d['regular_fare'] for d in data if d['regular_fare'] and d['regular_fare'] > 0]
    discounted_fares = [d['discounted_fare'] for d in data if d['discounted_fare'] and d['discounted_fare'] > 0]
    
    if regular_fares:
        stop_data = {
            "stop_number": data[0]['nos'],
            "stop_name": stoppage,
            "regular_fare": max(regular_fares) if regular_fares else 0,
            "discounted_fare": max(discounted_fares) if discounted_fares else 0,
            "fare_variations": len(regular_fares)
        }
        conductor_fare_metrics["stops"].append(stop_data)
        
        # Update statistics
        if admin_fare_metrics["statistics"]["min_regular_fare"] is None or stop_data["regular_fare"] < admin_fare_metrics["statistics"]["min_regular_fare"]:
            admin_fare_metrics["statistics"]["min_regular_fare"] = stop_data["regular_fare"]
        if admin_fare_metrics["statistics"]["max_regular_fare"] is None or stop_data["regular_fare"] > admin_fare_metrics["statistics"]["max_regular_fare"]:
            admin_fare_metrics["statistics"]["max_regular_fare"] = stop_data["regular_fare"]
        if admin_fare_metrics["statistics"]["min_discounted_fare"] is None or stop_data["discounted_fare"] < admin_fare_metrics["statistics"]["min_discounted_fare"]:
            admin_fare_metrics["statistics"]["min_discounted_fare"] = stop_data["discounted_fare"]
        if admin_fare_metrics["statistics"]["max_discounted_fare"] is None or stop_data["discounted_fare"] > admin_fare_metrics["statistics"]["max_discounted_fare"]:
            admin_fare_metrics["statistics"]["max_discounted_fare"] = stop_data["discounted_fare"]

admin_fare_metrics["fare_matrix"] = conductor_fare_metrics["stops"]

# Save to separate JSON files
with open('conductor_fare_metrics.json', 'w', encoding='utf-8') as f:
    json.dump(conductor_fare_metrics, f, indent=2)

with open('admin_fare_metrics.json', 'w', encoding='utf-8') as f:
    json.dump(admin_fare_metrics, f, indent=2)

print("\nConductor fare metrics saved to conductor_fare_metrics.json")
print("Admin fare metrics saved to admin_fare_metrics.json")
print(f"Total stops processed: {len(conductor_fare_metrics['stops'])}")
