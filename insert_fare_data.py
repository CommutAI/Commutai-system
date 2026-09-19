import json
import os
from dotenv import load_dotenv
import supabase

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials not found in environment variables")
    print("Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
    exit(1)

# Create Supabase client
client = supabase.create_client(supabase_url, supabase_key)

# Load the fare data from JSON
with open('conductor_fare_metrics_proper.json', 'r') as f:
    fare_data = json.load(f)

print(f"Loaded fare data for route: {fare_data['route_name']}")
print(f"Total stops: {fare_data['total_stops']}")
print(f"Total fare entries: {len(fare_data['fare_matrix'])}")

# Prepare data for insertion
fare_entries = []
for entry in fare_data['fare_matrix']:
    fare_entries.append({
        'route_from': entry['from_stop']['name'],
        'route_to': entry['to_stop']['name'],
        'km_distance': 0,  # Will need to calculate or set manually
        'regular_fare': entry['regular_fare'],
        'discounted_fare': entry['discounted_fare']
    })

print(f"\nPrepared {len(fare_entries)} fare entries for insertion")

# Check existing fare matrix entries
existing_data = client.table('fare_matrix').select('*').execute()
print(f"Existing fare entries in database: {len(existing_data.data)}")

# Ask user if they want to clear existing data
if existing_data.data:
    response = input(f"\nThere are {len(existing_data.data)} existing fare entries. Do you want to clear them before inserting new data? (y/n): ")
    if response.lower() == 'y':
        print("Clearing existing fare matrix...")
        client.table('fare_matrix').delete().neq('id', 0).execute()
        print("Existing data cleared")

# Insert the fare data in batches
batch_size = 50
total_inserted = 0

for i in range(0, len(fare_entries), batch_size):
    batch = fare_entries[i:i + batch_size]
    try:
        result = client.table('fare_matrix').insert(batch).execute()
        batch_count = len(result.data)
        total_inserted += batch_count
        print(f"Inserted batch {i//batch_size + 1}: {batch_count} entries")
    except Exception as e:
        print(f"Error inserting batch {i//batch_size + 1}: {e}")

print(f"\n✅ Successfully inserted {total_inserted} fare entries into the database")
print(f"Total fare entries in JSON: {len(fare_entries)}")

# Verify the insertion
verify_data = client.table('fare_matrix').select('*').execute()
print(f"Verification: Total fare entries in database: {len(verify_data.data)}")

if verify_data.data:
    print("\nSample fare entries:")
    for entry in verify_data.data[:5]:
        print(f"  {entry['route_from']} → {entry['route_to']}: Regular ₱{entry['regular_fare']}, Discounted ₱{entry['discounted_fare']}")
