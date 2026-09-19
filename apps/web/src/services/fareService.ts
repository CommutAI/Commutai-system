import { supabase } from '@commutai/supabase';

export interface FareMatrixEntry {
  id: string;
  route_from: string;
  route_to: string;
  km_distance: number;
  regular_fare: number;
  discounted_fare: number;
}

export type PassengerType = 'regular' | 'student' | 'senior_citizen' | 'pwd';

export interface FareCalculation {
  baseFare: number;
  discountedFare: number;
  finalFare: number;
  discountApplied: boolean;
  discountPercentage: number;
}

// Cache for fare matrix data
let fareMatrixCache: FareMatrixEntry[] | null = null;
let cacheExpiry: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch fare matrix from database
 */
export async function fetchFareMatrix(): Promise<FareMatrixEntry[]> {
  // Check cache first
  if (fareMatrixCache && cacheExpiry && Date.now() < cacheExpiry) {
    return fareMatrixCache;
  }

  try {
    const { data, error } = await supabase
      .from('fare_matrix')
      .select('*')
      .order('route_from, route_to');

    if (error) throw error;

    // Update cache
    fareMatrixCache = data || [];
    cacheExpiry = Date.now() + CACHE_DURATION;

    return fareMatrixCache || [];
  } catch (error) {
    console.error('Error fetching fare matrix:', error);
    return [];
  }
}

/**
 * Get fare between two stops
 */
export async function getFareBetweenStops(fromStop: string, toStop: string): Promise<FareMatrixEntry | null> {
  const fareMatrix = await fetchFareMatrix();
  
  return fareMatrix.find(
    entry => 
      entry.route_from.toLowerCase() === fromStop.toLowerCase() &&
      entry.route_to.toLowerCase() === toStop.toLowerCase()
  ) || null;
}

/**
 * Calculate fare based on passenger type
 */
export function calculateFare(baseFare: number, passengerType: PassengerType): FareCalculation {
  let discountPercentage = 0;
  
  switch (passengerType) {
    case 'student':
      discountPercentage = 0.20; // 20% discount
      break;
    case 'senior_citizen':
      discountPercentage = 0.20; // 20% discount
      break;
    case 'pwd':
      discountPercentage = 0.20; // 20% discount
      break;
    case 'regular':
    default:
      discountPercentage = 0;
      break;
  }

  const discountedFare = baseFare * (1 - discountPercentage);
  const finalFare = Math.round(discountedFare * 100) / 100; // Round to 2 decimal places

  return {
    baseFare,
    discountedFare,
    finalFare,
    discountApplied: discountPercentage > 0,
    discountPercentage,
  };
}

/**
 * Get all available stops from fare matrix
 */
export async function getAvailableStops(): Promise<string[]> {
  const fareMatrix = await fetchFareMatrix();
  
  const fromStops = new Set(fareMatrix.map(entry => entry.route_from));
  const toStops = new Set(fareMatrix.map(entry => entry.route_to));
  
  return Array.from(new Set([...fromStops, ...toStops])).sort();
}

/**
 * Clear fare matrix cache (useful after updates)
 */
export function clearFareMatrixCache(): void {
  fareMatrixCache = null;
  cacheExpiry = null;
}

/**
 * Process scan and calculate fare
 */
export interface ScanResult {
  success: boolean;
  fare: number;
  passengerType: PassengerType;
  discountApplied: boolean;
  routeFrom?: string;
  routeTo?: string;
  error?: string;
}

export async function processScan(
  fromStop: string,
  toStop: string,
  passengerType: PassengerType = 'regular'
): Promise<ScanResult> {
  try {
    const fareEntry = await getFareBetweenStops(fromStop, toStop);
    
    if (!fareEntry) {
      return {
        success: false,
        fare: 0,
        passengerType,
        discountApplied: false,
        error: `No fare found for route: ${fromStop} to ${toStop}`,
      };
    }

    const fareCalculation = calculateFare(fareEntry.regular_fare, passengerType);

    return {
      success: true,
      fare: fareCalculation.finalFare,
      passengerType,
      discountApplied: fareCalculation.discountApplied,
      routeFrom: fromStop,
      routeTo: toStop,
    };
  } catch (error) {
    console.error('Error processing scan:', error);
    return {
      success: false,
      fare: 0,
      passengerType,
      discountApplied: false,
      error: 'Failed to process scan',
    };
  }
}
