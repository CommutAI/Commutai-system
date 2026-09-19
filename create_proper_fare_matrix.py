import openpyxl
import json

# Load the Excel file with data_only=True to get calculated values
wb = openpyxl.load_workbook('one manolo manual fare input_03092025.xlsx', data_only=True)
sheet = wb['Sheet1']

# Create a proper from-to fare matrix
fare_matrix = []

# Read all data rows starting from row 2
for row in sheet.iter_rows(min_row=2, values_only=True):
    # Skip rows without complete data
    if not all([row[0], row[1], row[3], row[4]]):
        continue
    
    # Extract fare data
    from_stop_number = row[0]
    from_stop_name = row[1]
    to_stop_number = row[3]
    to_stop_name = row[4]
    regular_fare = row[5] if len(row) > 5 else 0
    discounted_fare = row[6] if len(row) > 6 else 0
    
    # Skip rows with zero fares (likely placeholder data)
    if regular_fare == 0 and discounted_fare == 0:
        continue
    
    # Add to matrix
    fare_entry = {
        "from_stop": {
            "number": from_stop_number,
            "name": from_stop_name
        },
        "to_stop": {
            "number": to_stop_number,
            "name": to_stop_name
        },
        "regular_fare": regular_fare,
        "discounted_fare": discounted_fare
    }
    fare_matrix.append(fare_entry)

print(f"Total fare entries: {len(fare_matrix)}")

# Create unique stops list
stops = {}
for entry in fare_matrix:
    from_stop = entry["from_stop"]
    to_stop = entry["to_stop"]
    
    if from_stop["number"] not in stops:
        stops[from_stop["number"]] = {
            "number": from_stop["number"],
            "name": from_stop["name"]
        }
    
    if to_stop["number"] not in stops:
        stops[to_stop["number"]] = {
            "number": to_stop["number"],
            "name": to_stop["name"]
        }

# Sort stops by number
sorted_stops = sorted(stops.values(), key=lambda x: x["number"])

# Create conductor fare metrics
conductor_fare_metrics = {
    "route_name": "Manalo Fortich Terminal ↔ Agora Terminal",
    "base_currency": "PHP",
    "fare_type": "from_to_matrix",
    "total_stops": len(sorted_stops),
    "stops": sorted_stops,
    "fare_matrix": fare_matrix
}

# Create admin fare metrics with statistics
admin_fare_metrics = {
    "route_name": "Manalo Fortich Terminal ↔ Agora Terminal",
    "base_currency": "PHP",
    "fare_type": "from_to_matrix",
    "total_stops": len(sorted_stops),
    "stops": sorted_stops,
    "fare_matrix": fare_matrix,
    "statistics": {
        "total_routes": len(fare_matrix),
        "min_regular_fare": min(entry["regular_fare"] for entry in fare_matrix),
        "max_regular_fare": max(entry["regular_fare"] for entry in fare_matrix),
        "min_discounted_fare": min(entry["discounted_fare"] for entry in fare_matrix),
        "max_discounted_fare": max(entry["discounted_fare"] for entry in fare_matrix),
        "average_regular_fare": sum(entry["regular_fare"] for entry in fare_matrix) / len(fare_matrix),
        "average_discounted_fare": sum(entry["discounted_fare"] for entry in fare_matrix) / len(fare_matrix)
    }
}

# Save to JSON files
with open('conductor_fare_metrics_proper.json', 'w', encoding='utf-8') as f:
    json.dump(conductor_fare_metrics, f, indent=2)

with open('admin_fare_metrics_proper.json', 'w', encoding='utf-8') as f:
    json.dump(admin_fare_metrics, f, indent=2)

print(f"\n✅ Proper fare matrix created!")
print(f"Total stops: {len(sorted_stops)}")
print(f"Total fare routes: {len(fare_matrix)}")
print(f"Fare range: ₱{admin_fare_metrics['statistics']['min_regular_fare']} - ₱{admin_fare_metrics['statistics']['max_regular_fare']}")
print(f"\nFiles saved:")
print("  - conductor_fare_metrics_proper.json")
print("  - admin_fare_metrics_proper.json")

# Print sample of fare matrix
print(f"\nSample fare matrix entries (first 5):")
for entry in fare_matrix[:5]:
    print(f"  {entry['from_stop']['name']} → {entry['to_stop']['name']}: Regular ₱{entry['regular_fare']}, Discounted ₱{entry['discounted_fare']}")
