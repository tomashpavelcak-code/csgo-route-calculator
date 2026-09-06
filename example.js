const { RouteCalculator, MovementTechniques } = require('./index.js');

// Initialize the calculator
const calculator = new RouteCalculator();

console.log('=== CS:GO Route Calculator Examples ===\n');

// Example 1: Calculate a single route on Dust2
console.log('Example 1: Single route on de_dust2');
const dust2Routes = calculator.calculateRoute(
  'de_dust2',
  0,      // start X
  0,      // start Y
  1000,   // end X
  1000    // end Y
);

dust2Routes.forEach(route => {
  console.log(`\n${route.technique}:`);
  console.log(`  Distance: ${route.distance.toFixed(2)} units`);
  console.log(`  Time: ${route.estimatedTime.toFixed(2)} seconds`);
  console.log(`  Max Speed: ${route.maxSpeed.toFixed(2)} units/s`);
});

// Example 2: Compare specific techniques
console.log('\n\n=== Example 2: Compare specific techniques ===');
const techniques = [
  MovementTechniques.LONG_JUMP,
  MovementTechniques.JUMPBUG,
  MovementTechniques.CROUCH_JUMP
];

const mirrageRoutes = calculator.calculateRoute(
  'de_mirage',
  500,
  500,
  1500,
  1500,
  techniques
);

const comparison = calculator.compareRoutes(mirrageRoutes);
console.log('\nFastest route:', comparison.fastest.technique);
console.log('Time:', comparison.fastest.estimatedTime.toFixed(2), 'seconds');
console.log('Distance:', comparison.fastest.distance.toFixed(2), 'units');

console.log('\nSlowest route:', comparison.slowest.technique);
console.log('Time:', comparison.slowest.estimatedTime.toFixed(2), 'seconds');

console.log('\nAverage across all techniques:');
console.log('Distance:', comparison.average.distance.toFixed(2), 'units');
console.log('Time:', comparison.average.time.toFixed(2), 'seconds');

// Example 3: Generate a full report for a map
console.log('\n\n=== Example 3: Full report for de_cache ===');
const report = calculator.generateReport('de_cache');
console.log(`Map: ${report.map}`);
console.log(`Total routes calculated: ${report.totalRoutes}`);
console.log(`Fastest technique: ${report.comparison.fastest.technique}`);
console.log(`Fastest time: ${report.comparison.fastest.estimatedTime.toFixed(2)}s`);

// Example 4: Get all routes on all maps
console.log('\n\n=== Example 4: Summary of all maps ===');
const allRoutes = calculator.getAllMapRoutes();

Object.keys(allRoutes).forEach(mapName => {
  const routes = allRoutes[mapName];
  const comparison = calculator.compareRoutes(routes);
  
  console.log(`\n${mapName}:`);
  console.log(`  Fastest: ${comparison.fastest.technique} (${comparison.fastest.estimatedTime.toFixed(2)}s)`);
  console.log(`  Avg Distance: ${comparison.average.distance.toFixed(0)} units`);
});

// Example 5: Using only pixel surf technique
console.log('\n\n=== Example 5: Pixel surf only ===');
const pixelSurfOnly = calculator.calculateRoute(
  'de_inferno',
  0,
  0,
  2000,
  2000,
  [MovementTechniques.PIXEL_SURF]
);

console.log('Pixel Surf route on de_inferno:');
console.log(`  Distance: ${pixelSurfOnly[0].distance.toFixed(2)} units`);
console.log(`  Time: ${pixelSurfOnly[0].estimatedTime.toFixed(2)} seconds`);
console.log(`  Path points: ${pixelSurfOnly[0].path.length}`);
