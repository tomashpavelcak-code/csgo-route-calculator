/**
 * CS:GO Route Calculator
 * Calculates optimal routes using various movement techniques
 */

const MovementTechniques = {
  PIXEL_SURF: 'pixelSurf',
  JUMPBUG: 'jumpbug',
  JUMP: 'jump',
  CROUCH_JUMP: 'crouchJump',
  MINI_JUMP: 'miniJump',
  LONG_JUMP: 'longJump'
};

class Player {
  constructor(x = 0, y = 0, z = 0) {
    this.position = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.health = 100;
    this.airTime = 0;
    this.onGround = true;
    this.crouching = false;
    this.staminaEnergy = 100;
  }

  jump(technique) {
    if (!this.onGround && technique !== MovementTechniques.JUMPBUG) return false;

    const jumpPowers = {
      [MovementTechniques.JUMP]: { z: 21.1, duration: 0.467 },
      [MovementTechniques.CROUCH_JUMP]: { z: 29.1, duration: 0.523 },
      [MovementTechniques.MINI_JUMP]: { z: 10.0, duration: 0.3 },
      [MovementTechniques.LONG_JUMP]: { z: 21.1, duration: 0.8 },
      [MovementTechniques.JUMPBUG]: { z: 21.1, duration: 0.467 }
    };

    const jumpData = jumpPowers[technique] || jumpPowers[MovementTechniques.JUMP];
    this.velocity.z = jumpData.z;
    this.airTime = jumpData.duration;
    this.onGround = false;

    if (technique === MovementTechniques.CROUCH_JUMP) {
      this.crouching = true;
    }

    return true;
  }

  pixelSurf(angle, intensity = 1.0) {
    const maxSpeed = 250 * intensity;
    const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);

    if (currentSpeed < maxSpeed) {
      const acceleration = 10 * intensity;
      this.velocity.x += Math.cos(angle) * acceleration;
      this.velocity.y += Math.sin(angle) * acceleration;
    }

    return {
      technique: MovementTechniques.PIXEL_SURF,
      speed: Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2),
      angle: angle
    };
  }

  jumpbug(moveDirection) {
    // Jumpbug allows mid-air strafing without speed limit
    const acceleration = 15;
    this.velocity.x += Math.cos(moveDirection) * acceleration;
    this.velocity.y += Math.sin(moveDirection) * acceleration;

    return {
      technique: MovementTechniques.JUMPBUG,
      speed: Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2),
      airTime: this.airTime
    };
  }

  updatePosition(deltaTime) {
    // Apply gravity
    if (!this.onGround) {
      this.velocity.z -= 9.81 * deltaTime;
      this.airTime -= deltaTime;

      if (this.airTime <= 0) {
        this.onGround = true;
        this.airTime = 0;
        this.velocity.z = 0;
      }
    }

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Prevent falling through ground
    if (this.position.z < 0) {
      this.position.z = 0;
      this.onGround = true;
      this.velocity.z = 0;
    }
  }
}

class Map {
  constructor(name, width, height, startX, startY) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.startPosition = { x: startX, y: startY, z: 0 };
    this.waypoints = [];
    this.obstacles = [];
  }

  addWaypoint(x, y, z = 0, name = `Waypoint_${this.waypoints.length}`) {
    this.waypoints.push({ x, y, z, name });
  }

  addObstacle(x, y, z, width, height, depth) {
    this.obstacles.push({ x, y, z, width, height, depth });
  }

  isPathClear(fromX, fromY, toX, toY) {
    // Simple line-of-sight check
    for (const obstacle of this.obstacles) {
      if (this.lineIntersectsBox(fromX, fromY, toX, toY, obstacle)) {
        return false;
      }
    }
    return true;
  }

  lineIntersectsBox(x1, y1, x2, y2, box) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return !(
      maxX < box.x - box.width / 2 ||
      minX > box.x + box.width / 2 ||
      maxY < box.y - box.height / 2 ||
      minY > box.y + box.height / 2
    );
  }
}

class RouteCalculator {
  constructor() {
    this.maps = new Map();
    this.routes = [];
    this.initializeMaps();
  }

  initializeMaps() {
    // Initialize all official CS:GO maps
    const csgoMaps = [
      { name: 'de_dust2', width: 2400, height: 2400 },
      { name: 'de_mirage', width: 3200, height: 2800 },
      { name: 'de_inferno', width: 3200, height: 2400 },
      { name: 'de_cache', width: 2400, height: 2400 },
      { name: 'de_cbble', width: 2400, height: 2400 },
      { name: 'de_nuke', width: 2400, height: 2400 },
      { name: 'de_overpass', width: 2400, height: 2400 },
      { name: 'de_train', width: 2400, height: 2400 },
      { name: 'de_vertigo', width: 2400, height: 2400 },
      { name: 'de_ancient', width: 2800, height: 3200 }
    ];

    csgoMaps.forEach(mapData => {
      const map = new Map(mapData.name, mapData.width, mapData.height, 0, 0);
      this.maps.set(mapData.name, map);
    });
  }

  calculateRoute(mapName, startX, startY, endX, endY, techniques = Object.values(MovementTechniques)) {
    const map = this.maps.get(mapName);
    if (!map) {
      console.error(`Map ${mapName} not found`);
      return null;
    }

    const routes = [];
    const player = new Player(startX, startY, 0);

    for (const technique of techniques) {
      const route = this.calculateRouteWithTechnique(player, map, endX, endY, technique);
      routes.push(route);
    }

    return routes;
  }

  calculateRouteWithTechnique(player, map, endX, endY, technique) {
    const path = [];
    const stepSize = 50;
    const maxIterations = 100;
    let iterations = 0;

    const startPos = { ...player.position };
    const target = { x: endX, y: endY };
    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

    while (
      Math.sqrt((player.position.x - endX) ** 2 + (player.position.y - endY) ** 2) > stepSize &&
      iterations < maxIterations
    ) {
      path.push({ ...player.position });

      // Calculate direction to target
      const dx = endX - player.position.x;
      const dy = endY - player.position.y;
      const angle = Math.atan2(dy, dx);

      // Apply movement based on technique
      switch (technique) {
        case MovementTechniques.PIXEL_SURF:
          player.pixelSurf(angle, 0.8);
          break;
        case MovementTechniques.JUMP:
          if (player.onGround) player.jump(technique);
          player.pixelSurf(angle, 0.7);
          break;
        case MovementTechniques.CROUCH_JUMP:
          if (player.onGround) player.jump(technique);
          player.pixelSurf(angle, 0.9);
          break;
        case MovementTechniques.MINI_JUMP:
          if (player.onGround) player.jump(technique);
          player.pixelSurf(angle, 0.6);
          break;
        case MovementTechniques.LONG_JUMP:
          if (player.onGround) player.jump(technique);
          player.jumpbug(angle);
          break;
        case MovementTechniques.JUMPBUG:
          if (!player.onGround) {
            player.jumpbug(angle);
          } else {
            player.jump(MovementTechniques.JUMP);
          }
          break;
      }

      player.updatePosition(0.016); // ~60 FPS
      iterations++;
    }

    path.push({ ...player.position });

    const totalDistance = this.calculatePathDistance(path);
    const estimatedTime = totalDistance / (Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2) || 250);

    return {
      technique: technique,
      path: path,
      distance: totalDistance,
      estimatedTime: estimatedTime,
      iterations: iterations,
      finalPosition: player.position,
      maxSpeed: Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2)
    };
  }

  calculatePathDistance(path) {
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      const dz = path[i].z - path[i - 1].z;
      distance += Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
    }
    return distance;
  }

  getAllMapRoutes(techniques = Object.values(MovementTechniques)) {
    const allRoutes = {};

    this.maps.forEach((map, mapName) => {
      const routes = this.calculateRoute(
        mapName,
        map.startPosition.x,
        map.startPosition.y,
        map.width / 2,
        map.height / 2,
        techniques
      );
      allRoutes[mapName] = routes;
    });

    return allRoutes;
  }

  compareRoutes(routes) {
    if (!routes || routes.length === 0) return null;

    const sorted = [...routes].sort((a, b) => a.estimatedTime - b.estimatedTime);

    return {
      fastest: sorted[0],
      slowest: sorted[sorted.length - 1],
      average: {
        distance: sorted.reduce((sum, r) => sum + r.distance, 0) / sorted.length,
        time: sorted.reduce((sum, r) => sum + r.estimatedTime, 0) / sorted.length
      },
      all: sorted
    };
  }

  generateReport(mapName) {
    const routes = this.calculateRoute(
      mapName,
      0,
      0,
      1000,
      1000,
      Object.values(MovementTechniques)
    );

    const comparison = this.compareRoutes(routes);

    return {
      map: mapName,
      timestamp: new Date().toISOString(),
      totalRoutes: routes.length,
      comparison: comparison,
      details: routes
    };
  }
}

module.exports = {
  RouteCalculator,
  Player,
  Map,
  MovementTechniques
};
