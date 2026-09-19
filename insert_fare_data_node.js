const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if it exists
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertFareData() {
  try {
    // Load JSON file
    const jsonPath = path.resolve(__dirname, 'conductor_fare_metrics_proper.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    console.log('Starting fare data insertion...');
    console.log(`Route: ${jsonData.route_name}`);
    console.log(`Total stops: ${jsonData.total_stops}`);
    console.log(`Total fare entries: ${jsonData.fare_matrix.length}`);

    // Prepare data for insertion
    const fareEntries = jsonData.fare_matrix.map(entry => ({
      route_from: entry.from_stop.name,
      route_to: entry.to_stop.name,
      km_distance: 0, // Will need to calculate or set manually
      regular_fare: entry.regular_fare,
      discounted_fare: entry.discounted_fare
    }));

    console.log(`Prepared ${fareEntries.length} fare entries for insertion`);

    // Check existing fare matrix entries
    const { data: existingData, error: checkError } = await supabase
      .from('fare_matrix')
      .select('*');
    
    if (checkError) {
      console.error('Error checking existing data:', checkError);
      return;
    }

    console.log(`Existing fare entries in database: ${existingData?.length || 0}`);

    // Clear existing data if any by deleting all rows
    if (existingData && existingData.length > 0) {
      console.log('Clearing existing fare matrix...');
      const { error: deleteError } = await supabase
        .from('fare_matrix')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error clearing existing data:', deleteError);
        // Try alternative approach - delete by getting IDs
        const idsToDelete = existingData.map(entry => entry.id);
        const { error: deleteError2 } = await supabase
          .from('fare_matrix')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError2) {
          console.error('Error clearing existing data with IDs:', deleteError2);
          return;
        }
      }
      console.log('Existing data cleared');
    }

    // Insert the fare data in batches
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < fareEntries.length; i += batchSize) {
      const batch = fareEntries.slice(i, i + batchSize);
      try {
        const { data, error } = await supabase
          .from('fare_matrix')
          .insert(batch)
          .select();
        
        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        } else {
          const batchCount = data?.length || 0;
          totalInserted += batchCount;
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batchCount} entries`);
        }
      } catch (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      }
    }

    console.log(`\n✅ Successfully inserted ${totalInserted} fare entries into the database`);
    console.log(`Total fare entries in JSON: ${fareEntries.length}`);

    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('fare_matrix')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying insertion:', verifyError);
    } else {
      console.log(`Verification: Total fare entries in database: ${verifyData?.length || 0}`);
      
      if (verifyData && verifyData.length > 0) {
        console.log('\nSample fare entries:');
        verifyData.slice(0, 5).forEach(entry => {
          console.log(`  ${entry.route_from} → ${entry.route_to}: Regular ₱${entry.regular_fare}, Discounted ₱${entry.discounted_fare}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the insertion
insertFareData();
