# Driver Navigation System

A comprehensive 3D navigation system designed for bus drivers, following the same design patterns as the operator dashboard.

## Features

### 🗺️ 3D Navigation Map
- **MapLibre GL JS Integration**: Open-source mapping library providing 3D navigation capabilities
- **3D Building Rendering**: Automatic 3D building extrusion for enhanced urban navigation
- **Route Visualization**: Clear route line display with color-coded stops
- **Interactive Markers**: Numbered stop markers with popup information
- **Fullscreen Mode**: Expand map for better visibility while driving

### 🧭 Navigation Controls
- **Turn-by-Turn Directions**: Real-time navigation instructions
- **GPS Tracking**: High-accuracy location tracking with progress updates
- **Stop Management**: Mark stops as completed automatically or manually
- **ETA Calculations**: Estimated time of arrival for each stop
- **Distance Tracking**: Real-time distance to next stop and total route

### 📊 Route Information
- **Route Progress**: Visual progress bar showing completion percentage
- **Stop List**: Complete list of route stops with status indicators
- **Total Statistics**: Overall distance, time, and remaining stops
- **Current Leg**: Information about the current route segment

### 🎛️ Driver Controls
- **Start/Stop Navigation**: Easy control over navigation state
- **Sound Toggle**: Enable/disable voice navigation
- **Fullscreen Toggle**: Expand map for better visibility
- **Manual Stop Completion**: Override automatic stop detection

## Technical Implementation

### Technologies Used
- **MapLibre GL JS**: Open-source 3D mapping library (privacy-focused alternative to Google Maps)
- **React 19**: Modern React with hooks for state management
- **Supabase**: Real-time database for trip and route data
- **Lucide React**: Icon library for UI elements
- **TypeScript**: Type-safe development

### Key Components

#### DriverNavigation.tsx
Main component that manages:
- Map initialization and 3D rendering
- GPS tracking and navigation state
- Route stop management
- Real-time progress updates
- User interface controls

#### DriverLayout.tsx
Layout component providing:
- Consistent header with driver branding
- Navigation controls
- Responsive design
- Integration with existing design system

### Data Flow

1. **Route Generation**: Stops are generated based on the assigned route
2. **Map Rendering**: Route line and markers are drawn on the 3D map
3. **GPS Tracking**: Real-time location updates from device GPS
4. **Progress Calculation**: Distance-based progress to next stop
5. **Stop Completion**: Automatic detection when within 50m of stop
6. **Trip Completion**: Final status update when all stops completed

### API Integration

The system integrates with the existing Supabase database:
- **Trips Table**: Fetches active trips for the driver
- **Staff Users Table**: Identifies driver assignments
- **Buses Table**: Retrieves route information
- **Real-time Updates**: Subscribes to trip status changes

## Design Consistency

The driver navigation system follows the same design patterns as the operator dashboard:

### Glass Card System
- Consistent glass-morphism styling
- Orange accent colors matching brand identity
- Hover effects and transitions
- Dark theme optimized for driver visibility

### Color Scheme
- **Primary**: Orange (#F97316) for navigation elements
- **Success**: Green (#22C55E) for completed stops
- **Warning**: Yellow for alerts
- **Neutral**: White/gray for text and backgrounds

### Typography
- Inter font family for consistency
- Clear hierarchy with font weights
- High contrast for readability while driving

### Spacing & Layout
- Consistent spacing scale (4px, 8px, 12px, 16px, 20px, 24px)
- Grid-based layouts for information cards
- Responsive design for different screen sizes

## Map Features

### 3D Capabilities
- **Pitch Control**: 45-degree default pitch for 3D perspective
- **Building Extrusion**: Automatic 3D building rendering
- **Smooth Transitions**: Animated camera movements
- **Zoom Control**: Adjustable zoom levels

### Navigation Elements
- **Route Line**: Orange line showing the complete route
- **Stop Markers**: Numbered circles indicating stop order
- **Current Location**: Real-time position marker
- **Turn Indicators**: Arrow symbols for direction changes

### Interactive Features
- **Popup Information**: Click markers for stop details
- **Navigation Controls**: Built-in zoom and pitch controls
- **Scale Indicator**: Distance scale for reference
- **Fullscreen Mode**: Expanded map view

## Usage

### Starting Navigation
1. Driver logs in and is assigned to an active trip
2. Route stops are automatically generated based on the bus route
3. Map displays the complete route with all stops
4. Driver clicks "Start Navigation" to begin GPS tracking

### During Navigation
- Real-time GPS updates current position
- Progress bar shows route completion percentage
- Next turn instructions display upcoming directions
- Stop list updates as stops are completed
- ETA and distance calculations update continuously

### Completing Stops
- Automatic completion when within 50 meters
- Manual completion via "Mark Stop Complete" button
- Visual indicators show completed vs. pending stops
- Trip auto-completes when final stop is reached

## Future Enhancements

### Potential Improvements
- **Voice Navigation**: Text-to-speech for turn instructions
- **Offline Mode**: Download maps for areas with poor connectivity
- **Traffic Integration**: Real-time traffic data for route optimization
- **Alternative Routes**: Suggest alternate routes based on conditions
- **Passenger Counting**: Integration with passenger counting system
- **Emergency Alerts**: Quick access to emergency reporting

### Integration Opportunities
- **Organic Maps Deep Links**: Launch Organic Maps app for mobile navigation
- **Fare Collection**: Integration with fare payment system
- **Schedule Management**: Display timing and schedule adherence
- **Driver Communication**: Chat with dispatch or other drivers
- **Maintenance Alerts**: Vehicle status and maintenance reminders

## Privacy & Performance

### Privacy-Focused
- **OpenStreetMap Tiles**: Free, open-source map data
- **No Tracking**: MapLibre GL JS doesn't track user activity
- **Local Processing**: GPS calculations performed client-side
- **Minimal Data**: Only essential trip data transmitted

### Performance Optimizations
- **Efficient Rendering**: WebGL-accelerated map rendering
- **Selective Updates**: Only update changed map elements
- **GPS Throttling**: Configurable GPS update frequency
- **Caching**: Map tiles cached for offline access

## Accessibility

### Driver-Focused Design
- **High Contrast**: Optimized for visibility in various lighting conditions
- **Large Touch Targets**: Easy to use while driving
- **Clear Typography**: Readable fonts and sizes
- **Intuitive Controls**: Simple, obvious button functions
- **Audio Support**: Voice navigation for hands-free operation

## Installation

The system requires the following dependency:
```bash
npm install maplibre-gl
```

## Route Configuration

Route stops are currently generated with sample data for the Manolo Fortich - Agora route. To customize for different routes:

1. Update the `generateRouteStops` function with actual route coordinates
2. Add route information to the database
3. Integrate with existing route management system
4. Configure stop types (pickup, dropoff, waypoint)

## License

This component follows the same license as the main CommutAI project.