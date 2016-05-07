(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = function(raw){
    var multiDay = [];
    var breakDown = raw["Analysis"];
    for (var i = 0; i < breakDown["surfMax"].length; i++) {
        var day = {}
        day.surfMax = breakDown["surfMax"][i];
        day.surfMin = breakDown["surfMin"][i];
        day.surfText = breakDown["surfText"][i];
        day.generalCondition = breakDown["generalCondition"][i];
        day.surfRange = breakDown["surfRange"][i];
        day.generalText = breakDown["generalText"][i];
        multiDay.push(day)
    }
    return multiDay
}
},{}],2:[function(require,module,exports){
var Matter = require('matter-js');
var surf = require('./public/data.json');
var dataBuilder = require('./dataBuilder.js');
var map = require('./map.js');

   var World = Matter.World,
		Bodies = Matter.Bodies,
		Body = Matter.Body,
		Composite = Matter.Composite,
		Composites = Matter.Composites,
		Constraint = Matter.Constraint;



var svgns = "http://www.w3.org/2000/svg";
var ary = dataBuilder(surf)

var width = 20;
var height = 20;
var padding = 20;

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

// create an engine
var engine = Engine.create();




var svgBG = document.getElementById('world');

var svgBods = [];
var svgBoxDims = svgBG.getBoundingClientRect();
var yCoord = svgBoxDims - height;

var physicsBodies = [];
var springs = [];
function createBodies(days){ 
  for (var i = 0; i < days.length; i++) {
    var rect = document.createElementNS(svgns, 'rect');
      var xCoord = width * i + (padding * (i+1));
      rect.setAttributeNS(null, 'height', '20');
      rect.setAttributeNS(null, 'width', '20');
      rect.setAttributeNS(null, 'fill', 'blue');
      rect.setAttributeNS(null, 'x', xCoord);
      svgBods.push(rect)
      svgBG.appendChild(rect);
      // physics bodies 
      var physicsBody = Bodies.rectangle(xCoord, svgBoxDims.height, height, width);
      
      var vertSpring = Constraint.create({ bodyA: physicsBody, pointB: { x: xCoord, y: svgBoxDims.height } })
      var prevBody = physicsBodies[i-1]
      if(prevBody){
        var horizontalSpring = Constraint.create({ bodyA: physicsBody, bodyB: prevBody})
        horizontalSpring.length = padding * 2
        horizontalSpring.stiffness = 1;
        springs.push(horizontalSpring)
      }
      vertSpring.stiffness = 0.02;
      //wave height
      vertSpring.length = (days[i].surfMax *10 + height/2);

      physicsBodies.push(physicsBody);
      springs.push(vertSpring)
  }
}

createBodies(ary);
engine.world.gravity.y = -0.1;
World.add(engine.world, physicsBodies.concat(springs));

// run the engine
Engine.run(engine);


// render loop
(function render() {
    var bodies = Composite.allBodies(engine.world);

    window.requestAnimationFrame(render);

    for (var i = 0; i < bodies.length; i++) {
        var vertices = bodies[i].vertices;
        var rectSvg = svgBods[i];
        //rectSvg.setAttributeNS(null, 'x', vertices[0].x);
        rectSvg.setAttributeNS(null, 'y', vertices[0].y);
    }
})();

},{"./dataBuilder.js":1,"./map.js":3,"./public/data.json":34,"matter-js":31}],3:[function(require,module,exports){
module.exports = function() {
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -34.397, lng: 150.644},
      zoom: 8
    });
}
},{}],4:[function(require,module,exports){
/**
* The `Matter.Body` module contains methods for creating and manipulating body models.
* A `Matter.Body` is a rigid body that can be simulated by a `Matter.Engine`.
* Factories for commonly used body configurations (such as rectangles, circles and other polygons) can be found in the module `Matter.Bodies`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

* @class Body
*/

var Body = {};

module.exports = Body;

var Vertices = require('../geometry/Vertices');
var Vector = require('../geometry/Vector');
var Sleeping = require('../core/Sleeping');
var Render = require('../render/Render');
var Common = require('../core/Common');
var Bounds = require('../geometry/Bounds');
var Axes = require('../geometry/Axes');

(function() {

    Body._inertiaScale = 4;
    Body._nextCollidingGroupId = 1;
    Body._nextNonCollidingGroupId = -1;
    Body._nextCategory = 0x0001;

    /**
     * Creates a new rigid body model. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {} options
     * @return {body} body
     */
    Body.create = function(options) {
        var defaults = {
            id: Common.nextId(),
            type: 'body',
            label: 'Body',
            parts: [],
            angle: 0,
            vertices: Vertices.fromPath('L 0 0 L 40 0 L 40 40 L 0 40'),
            position: { x: 0, y: 0 },
            force: { x: 0, y: 0 },
            torque: 0,
            positionImpulse: { x: 0, y: 0 },
            constraintImpulse: { x: 0, y: 0, angle: 0 },
            totalContacts: 0,
            speed: 0,
            angularSpeed: 0,
            velocity: { x: 0, y: 0 },
            angularVelocity: 0,
            isSensor: false,
            isStatic: false,
            isSleeping: false,
            motion: 0,
            sleepThreshold: 60,
            density: 0.001,
            restitution: 0,
            friction: 0.1,
            frictionStatic: 0.5,
            frictionAir: 0.01,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            },
            slop: 0.05,
            timeScale: 1,
            render: {
                visible: true,
                opacity: 1,
                sprite: {
                    xScale: 1,
                    yScale: 1,
                    xOffset: 0,
                    yOffset: 0
                },
                lineWidth: 1.5
            }
        };

        var body = Common.extend(defaults, options);

        _initProperties(body, options);

        return body;
    };

    /**
     * Returns the next unique group index for which bodies will collide.
     * If `isNonColliding` is `true`, returns the next unique group index for which bodies will _not_ collide.
     * See `body.collisionFilter` for more information.
     * @method nextGroup
     * @param {bool} [isNonColliding=false]
     * @return {Number} Unique group index
     */
    Body.nextGroup = function(isNonColliding) {
        if (isNonColliding)
            return Body._nextNonCollidingGroupId--;

        return Body._nextCollidingGroupId++;
    };

    /**
     * Returns the next unique category bitfield (starting after the initial default category `0x0001`).
     * There are 32 available. See `body.collisionFilter` for more information.
     * @method nextCategory
     * @return {Number} Unique category bitfield
     */
    Body.nextCategory = function() {
        Body._nextCategory = Body._nextCategory << 1;
        return Body._nextCategory;
    };

    /**
     * Initialises body properties.
     * @method _initProperties
     * @private
     * @param {body} body
     * @param {} options
     */
    var _initProperties = function(body, options) {
        // init required properties (order is important)
        Body.set(body, {
            bounds: body.bounds || Bounds.create(body.vertices),
            positionPrev: body.positionPrev || Vector.clone(body.position),
            anglePrev: body.anglePrev || body.angle,
            vertices: body.vertices,
            parts: body.parts || [body],
            isStatic: body.isStatic,
            isSleeping: body.isSleeping,
            parent: body.parent || body
        });

        Vertices.rotate(body.vertices, body.angle, body.position);
        Axes.rotate(body.axes, body.angle);
        Bounds.update(body.bounds, body.vertices, body.velocity);

        // allow options to override the automatically calculated properties
        Body.set(body, {
            axes: options.axes || body.axes,
            area: options.area || body.area,
            mass: options.mass || body.mass,
            inertia: options.inertia || body.inertia
        });

        // render properties
        var defaultFillStyle = (body.isStatic ? '#eeeeee' : Common.choose(['#556270', '#4ECDC4', '#C7F464', '#FF6B6B', '#C44D58'])),
            defaultStrokeStyle = Common.shadeColor(defaultFillStyle, -20);
        body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
        body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
        body.render.sprite.xOffset += -(body.bounds.min.x - body.position.x) / (body.bounds.max.x - body.bounds.min.x);
        body.render.sprite.yOffset += -(body.bounds.min.y - body.position.y) / (body.bounds.max.y - body.bounds.min.y);
    };

    /**
     * Given a property and a value (or map of), sets the property(s) on the body, using the appropriate setter functions if they exist.
     * Prefer to use the actual setter functions in performance critical situations.
     * @method set
     * @param {body} body
     * @param {} settings A property name (or map of properties and values) to set on the body.
     * @param {} value The value to set if `settings` is a single property name.
     */
    Body.set = function(body, settings, value) {
        var property;

        if (typeof settings === 'string') {
            property = settings;
            settings = {};
            settings[property] = value;
        }

        for (property in settings) {
            value = settings[property];

            if (!settings.hasOwnProperty(property))
                continue;

            switch (property) {

            case 'isStatic':
                Body.setStatic(body, value);
                break;
            case 'isSleeping':
                Sleeping.set(body, value);
                break;
            case 'mass':
                Body.setMass(body, value);
                break;
            case 'density':
                Body.setDensity(body, value);
                break;
            case 'inertia':
                Body.setInertia(body, value);
                break;
            case 'vertices':
                Body.setVertices(body, value);
                break;
            case 'position':
                Body.setPosition(body, value);
                break;
            case 'angle':
                Body.setAngle(body, value);
                break;
            case 'velocity':
                Body.setVelocity(body, value);
                break;
            case 'angularVelocity':
                Body.setAngularVelocity(body, value);
                break;
            case 'parts':
                Body.setParts(body, value);
                break;
            default:
                body[property] = value;

            }
        }
    };

    /**
     * Sets the body as static, including isStatic flag and setting mass and inertia to Infinity.
     * @method setStatic
     * @param {body} body
     * @param {bool} isStatic
     */
    Body.setStatic = function(body, isStatic) {
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.isStatic = isStatic;

            if (isStatic) {
                part.restitution = 0;
                part.friction = 1;
                part.mass = part.inertia = part.density = Infinity;
                part.inverseMass = part.inverseInertia = 0;

                part.positionPrev.x = part.position.x;
                part.positionPrev.y = part.position.y;
                part.anglePrev = part.angle;
                part.angularVelocity = 0;
                part.speed = 0;
                part.angularSpeed = 0;
                part.motion = 0;
            }
        }
    };

    /**
     * Sets the mass of the body. Inverse mass and density are automatically updated to reflect the change.
     * @method setMass
     * @param {body} body
     * @param {number} mass
     */
    Body.setMass = function(body, mass) {
        body.mass = mass;
        body.inverseMass = 1 / body.mass;
        body.density = body.mass / body.area;
    };

    /**
     * Sets the density of the body. Mass is automatically updated to reflect the change.
     * @method setDensity
     * @param {body} body
     * @param {number} density
     */
    Body.setDensity = function(body, density) {
        Body.setMass(body, density * body.area);
        body.density = density;
    };

    /**
     * Sets the moment of inertia (i.e. second moment of area) of the body of the body. 
     * Inverse inertia is automatically updated to reflect the change. Mass is not changed.
     * @method setInertia
     * @param {body} body
     * @param {number} inertia
     */
    Body.setInertia = function(body, inertia) {
        body.inertia = inertia;
        body.inverseInertia = 1 / body.inertia;
    };

    /**
     * Sets the body's vertices and updates body properties accordingly, including inertia, area and mass (with respect to `body.density`).
     * Vertices will be automatically transformed to be orientated around their centre of mass as the origin.
     * They are then automatically translated to world space based on `body.position`.
     *
     * The `vertices` argument should be passed as an array of `Matter.Vector` points (or a `Matter.Vertices` array).
     * Vertices must form a convex hull, concave hulls are not supported.
     *
     * @method setVertices
     * @param {body} body
     * @param {vector[]} vertices
     */
    Body.setVertices = function(body, vertices) {
        // change vertices
        if (vertices[0].body === body) {
            body.vertices = vertices;
        } else {
            body.vertices = Vertices.create(vertices, body);
        }

        // update properties
        body.axes = Axes.fromVertices(body.vertices);
        body.area = Vertices.area(body.vertices);
        Body.setMass(body, body.density * body.area);

        // orient vertices around the centre of mass at origin (0, 0)
        var centre = Vertices.centre(body.vertices);
        Vertices.translate(body.vertices, centre, -1);

        // update inertia while vertices are at origin (0, 0)
        Body.setInertia(body, Body._inertiaScale * Vertices.inertia(body.vertices, body.mass));

        // update geometry
        Vertices.translate(body.vertices, body.position);
        Bounds.update(body.bounds, body.vertices, body.velocity);
    };

    /**
     * Sets the parts of the `body` and updates mass, inertia and centroid.
     * Each part will have its parent set to `body`.
     * By default the convex hull will be automatically computed and set on `body`, unless `autoHull` is set to `false.`
     * Note that this method will ensure that the first part in `body.parts` will always be the `body`.
     * @method setParts
     * @param {body} body
     * @param [body] parts
     * @param {bool} [autoHull=true]
     */
    Body.setParts = function(body, parts, autoHull) {
        var i;

        // add all the parts, ensuring that the first part is always the parent body
        parts = parts.slice(0);
        body.parts.length = 0;
        body.parts.push(body);
        body.parent = body;

        for (i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part !== body) {
                part.parent = body;
                body.parts.push(part);
            }
        }

        if (body.parts.length === 1)
            return;

        autoHull = typeof autoHull !== 'undefined' ? autoHull : true;

        // find the convex hull of all parts to set on the parent body
        if (autoHull) {
            var vertices = [];
            for (i = 0; i < parts.length; i++) {
                vertices = vertices.concat(parts[i].vertices);
            }

            Vertices.clockwiseSort(vertices);

            var hull = Vertices.hull(vertices),
                hullCentre = Vertices.centre(hull);

            Body.setVertices(body, hull);
            Vertices.translate(body.vertices, hullCentre);
        }

        // sum the properties of all compound parts of the parent body
        var total = _totalProperties(body);

        body.area = total.area;
        body.parent = body;
        body.position.x = total.centre.x;
        body.position.y = total.centre.y;
        body.positionPrev.x = total.centre.x;
        body.positionPrev.y = total.centre.y;

        Body.setMass(body, total.mass);
        Body.setInertia(body, total.inertia);
        Body.setPosition(body, total.centre);
    };

    /**
     * Sets the position of the body instantly. Velocity, angle, force etc. are unchanged.
     * @method setPosition
     * @param {body} body
     * @param {vector} position
     */
    Body.setPosition = function(body, position) {
        var delta = Vector.sub(position, body.position);
        body.positionPrev.x += delta.x;
        body.positionPrev.y += delta.y;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.position.x += delta.x;
            part.position.y += delta.y;
            Vertices.translate(part.vertices, delta);
            Bounds.update(part.bounds, part.vertices, body.velocity);
        }
    };

    /**
     * Sets the angle of the body instantly. Angular velocity, position, force etc. are unchanged.
     * @method setAngle
     * @param {body} body
     * @param {number} angle
     */
    Body.setAngle = function(body, angle) {
        var delta = angle - body.angle;
        body.anglePrev += delta;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.angle += delta;
            Vertices.rotate(part.vertices, delta, body.position);
            Axes.rotate(part.axes, delta);
            Bounds.update(part.bounds, part.vertices, body.velocity);
            if (i > 0) {
                Vector.rotateAbout(part.position, delta, body.position, part.position);
            }
        }
    };

    /**
     * Sets the linear velocity of the body instantly. Position, angle, force etc. are unchanged. See also `Body.applyForce`.
     * @method setVelocity
     * @param {body} body
     * @param {vector} velocity
     */
    Body.setVelocity = function(body, velocity) {
        body.positionPrev.x = body.position.x - velocity.x;
        body.positionPrev.y = body.position.y - velocity.y;
        body.velocity.x = velocity.x;
        body.velocity.y = velocity.y;
        body.speed = Vector.magnitude(body.velocity);
    };

    /**
     * Sets the angular velocity of the body instantly. Position, angle, force etc. are unchanged. See also `Body.applyForce`.
     * @method setAngularVelocity
     * @param {body} body
     * @param {number} velocity
     */
    Body.setAngularVelocity = function(body, velocity) {
        body.anglePrev = body.angle - velocity;
        body.angularVelocity = velocity;
        body.angularSpeed = Math.abs(body.angularVelocity);
    };

    /**
     * Moves a body by a given vector relative to its current position, without imparting any velocity.
     * @method translate
     * @param {body} body
     * @param {vector} translation
     */
    Body.translate = function(body, translation) {
        Body.setPosition(body, Vector.add(body.position, translation));
    };

    /**
     * Rotates a body by a given angle relative to its current angle, without imparting any angular velocity.
     * @method rotate
     * @param {body} body
     * @param {number} rotation
     */
    Body.rotate = function(body, rotation) {
        Body.setAngle(body, body.angle + rotation);
    };

    /**
     * Scales the body, including updating physical properties (mass, area, axes, inertia), from a world-space point (default is body centre).
     * @method scale
     * @param {body} body
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} [point]
     */
    Body.scale = function(body, scaleX, scaleY, point) {
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];

            // scale vertices
            Vertices.scale(part.vertices, scaleX, scaleY, body.position);

            // update properties
            part.axes = Axes.fromVertices(part.vertices);

            if (!body.isStatic) {
                part.area = Vertices.area(part.vertices);
                Body.setMass(part, body.density * part.area);

                // update inertia (requires vertices to be at origin)
                Vertices.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
                Body.setInertia(part, Vertices.inertia(part.vertices, part.mass));
                Vertices.translate(part.vertices, { x: part.position.x, y: part.position.y });
            }

            // update bounds
            Bounds.update(part.bounds, part.vertices, body.velocity);
        }

        // handle circles
        if (body.circleRadius) { 
            if (scaleX === scaleY) {
                body.circleRadius *= scaleX;
            } else {
                // body is no longer a circle
                body.circleRadius = null;
            }
        }

        if (!body.isStatic) {
            var total = _totalProperties(body);
            body.area = total.area;
            Body.setMass(body, total.mass);
            Body.setInertia(body, total.inertia);
        }
    };

    /**
     * Performs a simulation step for the given `body`, including updating position and angle using Verlet integration.
     * @method update
     * @param {body} body
     * @param {number} deltaTime
     * @param {number} timeScale
     * @param {number} correction
     */
    Body.update = function(body, deltaTime, timeScale, correction) {
        var deltaTimeSquared = Math.pow(deltaTime * timeScale * body.timeScale, 2);

        // from the previous step
        var frictionAir = 1 - body.frictionAir * timeScale * body.timeScale,
            velocityPrevX = body.position.x - body.positionPrev.x,
            velocityPrevY = body.position.y - body.positionPrev.y;

        // update velocity with Verlet integration
        body.velocity.x = (velocityPrevX * frictionAir * correction) + (body.force.x / body.mass) * deltaTimeSquared;
        body.velocity.y = (velocityPrevY * frictionAir * correction) + (body.force.y / body.mass) * deltaTimeSquared;

        body.positionPrev.x = body.position.x;
        body.positionPrev.y = body.position.y;
        body.position.x += body.velocity.x;
        body.position.y += body.velocity.y;

        // update angular velocity with Verlet integration
        body.angularVelocity = ((body.angle - body.anglePrev) * frictionAir * correction) + (body.torque / body.inertia) * deltaTimeSquared;
        body.anglePrev = body.angle;
        body.angle += body.angularVelocity;

        // track speed and acceleration
        body.speed = Vector.magnitude(body.velocity);
        body.angularSpeed = Math.abs(body.angularVelocity);

        // transform the body geometry
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];

            Vertices.translate(part.vertices, body.velocity);
            
            if (i > 0) {
                part.position.x += body.velocity.x;
                part.position.y += body.velocity.y;
            }

            if (body.angularVelocity !== 0) {
                Vertices.rotate(part.vertices, body.angularVelocity, body.position);
                Axes.rotate(part.axes, body.angularVelocity);
                if (i > 0) {
                    Vector.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
                }
            }

            Bounds.update(part.bounds, part.vertices, body.velocity);
        }
    };

    /**
     * Applies a force to a body from a given world-space position, including resulting torque.
     * @method applyForce
     * @param {body} body
     * @param {vector} position
     * @param {vector} force
     */
    Body.applyForce = function(body, position, force) {
        body.force.x += force.x;
        body.force.y += force.y;
        var offset = { x: position.x - body.position.x, y: position.y - body.position.y };
        body.torque += offset.x * force.y - offset.y * force.x;
    };

    /**
     * Returns the sums of the properties of all compound parts of the parent body.
     * @method _totalProperties
     * @private
     * @param {body} body
     * @return {}
     */
    var _totalProperties = function(body) {
        // https://ecourses.ou.edu/cgi-bin/ebook.cgi?doc=&topic=st&chap_sec=07.2&page=theory
        // http://output.to/sideway/default.asp?qno=121100087

        var properties = {
            mass: 0,
            area: 0,
            inertia: 0,
            centre: { x: 0, y: 0 }
        };

        // sum the properties of all compound parts of the parent body
        for (var i = body.parts.length === 1 ? 0 : 1; i < body.parts.length; i++) {
            var part = body.parts[i];
            properties.mass += part.mass;
            properties.area += part.area;
            properties.inertia += part.inertia;
            properties.centre = Vector.add(properties.centre, 
                                           Vector.mult(part.position, part.mass !== Infinity ? part.mass : 1));
        }

        properties.centre = Vector.div(properties.centre, 
                                       properties.mass !== Infinity ? properties.mass : body.parts.length);

        return properties;
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired when a body starts sleeping (where `this` is the body).
    *
    * @event sleepStart
    * @this {body} The body that has started sleeping
    * @param {} event An event object
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a body ends sleeping (where `this` is the body).
    *
    * @event sleepEnd
    * @this {body} The body that has ended sleeping
    * @param {} event An event object
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` uniquely identifying number generated in `Body.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "body"
     * @readOnly
     */

    /**
     * An arbitrary `String` name to help the user identify and manage bodies.
     *
     * @property label
     * @type string
     * @default "Body"
     */

    /**
     * An array of bodies that make up this body. 
     * The first body in the array must always be a self reference to the current body instance.
     * All bodies in the `parts` array together form a single rigid compound body.
     * Parts are allowed to overlap, have gaps or holes or even form concave bodies.
     * Parts themselves should never be added to a `World`, only the parent body should be.
     * Use `Body.setParts` when setting parts to ensure correct updates of all properties.
     *
     * @property parts
     * @type body[]
     */

    /**
     * A self reference if the body is _not_ a part of another body.
     * Otherwise this is a reference to the body that this is a part of.
     * See `body.parts`.
     *
     * @property parent
     * @type body
     */

    /**
     * A `Number` specifying the angle of the body, in radians.
     *
     * @property angle
     * @type number
     * @default 0
     */

    /**
     * An array of `Vector` objects that specify the convex hull of the rigid body.
     * These should be provided about the origin `(0, 0)`. E.g.
     *
     *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
     *
     * When passed via `Body.create`, the vertices are translated relative to `body.position` (i.e. world-space, and constantly updated by `Body.update` during simulation).
     * The `Vector` objects are also augmented with additional properties required for efficient collision detection. 
     *
     * Other properties such as `inertia` and `bounds` are automatically calculated from the passed vertices (unless provided via `options`).
     * Concave hulls are not currently supported. The module `Matter.Vertices` contains useful methods for working with vertices.
     *
     * @property vertices
     * @type vector[]
     */

    /**
     * A `Vector` that specifies the current world-space position of the body.
     *
     * @property position
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Vector` that specifies the force to apply in the current step. It is zeroed after every `Body.update`. See also `Body.applyForce`.
     *
     * @property force
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Number` that specifies the torque (turning force) to apply in the current step. It is zeroed after every `Body.update`.
     *
     * @property torque
     * @type number
     * @default 0
     */

    /**
     * A `Number` that _measures_ the current speed of the body after the last `Body.update`. It is read-only and always positive (it's the magnitude of `body.velocity`).
     *
     * @readOnly
     * @property speed
     * @type number
     * @default 0
     */

    /**
     * A `Number` that _measures_ the current angular speed of the body after the last `Body.update`. It is read-only and always positive (it's the magnitude of `body.angularVelocity`).
     *
     * @readOnly
     * @property angularSpeed
     * @type number
     * @default 0
     */

    /**
     * A `Vector` that _measures_ the current velocity of the body after the last `Body.update`. It is read-only. 
     * If you need to modify a body's velocity directly, you should either apply a force or simply change the body's `position` (as the engine uses position-Verlet integration).
     *
     * @readOnly
     * @property velocity
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Number` that _measures_ the current angular velocity of the body after the last `Body.update`. It is read-only. 
     * If you need to modify a body's angular velocity directly, you should apply a torque or simply change the body's `angle` (as the engine uses position-Verlet integration).
     *
     * @readOnly
     * @property angularVelocity
     * @type number
     * @default 0
     */

    /**
     * A flag that indicates whether a body is considered static. A static body can never change position or angle and is completely fixed.
     * If you need to set a body as static after its creation, you should use `Body.setStatic` as this requires more than just setting this flag.
     *
     * @property isStatic
     * @type boolean
     * @default false
     */

    /**
     * A flag that indicates whether a body is a sensor. Sensor triggers collision events, but doesn't react with colliding body physically.
     *
     * @property isSensor
     * @type boolean
     * @default false
     */

    /**
     * A flag that indicates whether the body is considered sleeping. A sleeping body acts similar to a static body, except it is only temporary and can be awoken.
     * If you need to set a body as sleeping, you should use `Sleeping.set` as this requires more than just setting this flag.
     *
     * @property isSleeping
     * @type boolean
     * @default false
     */

    /**
     * A `Number` that _measures_ the amount of movement a body currently has (a combination of `speed` and `angularSpeed`). It is read-only and always positive.
     * It is used and updated by the `Matter.Sleeping` module during simulation to decide if a body has come to rest.
     *
     * @readOnly
     * @property motion
     * @type number
     * @default 0
     */

    /**
     * A `Number` that defines the number of updates in which this body must have near-zero velocity before it is set as sleeping by the `Matter.Sleeping` module (if sleeping is enabled by the engine).
     *
     * @property sleepThreshold
     * @type number
     * @default 60
     */

    /**
     * A `Number` that defines the density of the body, that is its mass per unit area.
     * If you pass the density via `Body.create` the `mass` property is automatically calculated for you based on the size (area) of the object.
     * This is generally preferable to simply setting mass and allows for more intuitive definition of materials (e.g. rock has a higher density than wood).
     *
     * @property density
     * @type number
     * @default 0.001
     */

    /**
     * A `Number` that defines the mass of the body, although it may be more appropriate to specify the `density` property instead.
     * If you modify this value, you must also modify the `body.inverseMass` property (`1 / mass`).
     *
     * @property mass
     * @type number
     */

    /**
     * A `Number` that defines the inverse mass of the body (`1 / mass`).
     * If you modify this value, you must also modify the `body.mass` property.
     *
     * @property inverseMass
     * @type number
     */

    /**
     * A `Number` that defines the moment of inertia (i.e. second moment of area) of the body.
     * It is automatically calculated from the given convex hull (`vertices` array) and density in `Body.create`.
     * If you modify this value, you must also modify the `body.inverseInertia` property (`1 / inertia`).
     *
     * @property inertia
     * @type number
     */

    /**
     * A `Number` that defines the inverse moment of inertia of the body (`1 / inertia`).
     * If you modify this value, you must also modify the `body.inertia` property.
     *
     * @property inverseInertia
     * @type number
     */

    /**
     * A `Number` that defines the restitution (elasticity) of the body. The value is always positive and is in the range `(0, 1)`.
     * A value of `0` means collisions may be perfectly inelastic and no bouncing may occur. 
     * A value of `0.8` means the body may bounce back with approximately 80% of its kinetic energy.
     * Note that collision response is based on _pairs_ of bodies, and that `restitution` values are _combined_ with the following formula:
     *
     *     Math.max(bodyA.restitution, bodyB.restitution)
     *
     * @property restitution
     * @type number
     * @default 0
     */

    /**
     * A `Number` that defines the friction of the body. The value is always positive and is in the range `(0, 1)`.
     * A value of `0` means that the body may slide indefinitely.
     * A value of `1` means the body may come to a stop almost instantly after a force is applied.
     *
     * The effects of the value may be non-linear. 
     * High values may be unstable depending on the body.
     * The engine uses a Coulomb friction model including static and kinetic friction.
     * Note that collision response is based on _pairs_ of bodies, and that `friction` values are _combined_ with the following formula:
     *
     *     Math.min(bodyA.friction, bodyB.friction)
     *
     * @property friction
     * @type number
     * @default 0.1
     */

    /**
     * A `Number` that defines the static friction of the body (in the Coulomb friction model). 
     * A value of `0` means the body will never 'stick' when it is nearly stationary and only dynamic `friction` is used.
     * The higher the value (e.g. `10`), the more force it will take to initially get the body moving when nearly stationary.
     * This value is multiplied with the `friction` property to make it easier to change `friction` and maintain an appropriate amount of static friction.
     *
     * @property frictionStatic
     * @type number
     * @default 0.5
     */

    /**
     * A `Number` that defines the air friction of the body (air resistance). 
     * A value of `0` means the body will never slow as it moves through space.
     * The higher the value, the faster a body slows when moving through space.
     * The effects of the value are non-linear. 
     *
     * @property frictionAir
     * @type number
     * @default 0.01
     */

    /**
     * An `Object` that specifies the collision filtering properties of this body.
     *
     * Collisions between two bodies will obey the following rules:
     * - If the two bodies have the same non-zero value of `collisionFilter.group`,
     *   they will always collide if the value is positive, and they will never collide
     *   if the value is negative.
     * - If the two bodies have different values of `collisionFilter.group` or if one
     *   (or both) of the bodies has a value of 0, then the category/mask rules apply as follows:
     *
     * Each body belongs to a collision category, given by `collisionFilter.category`. This
     * value is used as a bit field and the category should have only one bit set, meaning that
     * the value of this property is a power of two in the range [1, 2^31]. Thus, there are 32
     * different collision categories available.
     *
     * Each body also defines a collision bitmask, given by `collisionFilter.mask` which specifies
     * the categories it collides with (the value is the bitwise AND value of all these categories).
     *
     * Using the category/mask rules, two bodies `A` and `B` collide if each includes the other's
     * category in its mask, i.e. `(categoryA & maskB) !== 0` and `(categoryB & maskA) !== 0`
     * are both true.
     *
     * @property collisionFilter
     * @type object
     */

    /**
     * An Integer `Number`, that specifies the collision group this body belongs to.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter.group
     * @type object
     * @default 0
     */

    /**
     * A bit field that specifies the collision category this body belongs to.
     * The category value should have only one bit set, for example `0x0001`.
     * This means there are up to 32 unique collision categories available.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter.category
     * @type object
     * @default 1
     */

    /**
     * A bit mask that specifies the collision categories this body may collide with.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter.mask
     * @type object
     * @default -1
     */

    /**
     * A `Number` that specifies a tolerance on how far a body is allowed to 'sink' or rotate into other bodies.
     * Avoid changing this value unless you understand the purpose of `slop` in physics engines.
     * The default should generally suffice, although very large bodies may require larger values for stable stacking.
     *
     * @property slop
     * @type number
     * @default 0.05
     */

    /**
     * A `Number` that allows per-body time scaling, e.g. a force-field where bodies inside are in slow-motion, while others are at full speed.
     *
     * @property timeScale
     * @type number
     * @default 1
     */

    /**
     * An `Object` that defines the rendering properties to be consumed by the module `Matter.Render`.
     *
     * @property render
     * @type object
     */

    /**
     * A flag that indicates if the body should be rendered.
     *
     * @property render.visible
     * @type boolean
     * @default true
     */

    /**
     * Sets the opacity to use when rendering.
     *
     * @property render.opacity
     * @type number
     * @default 1
    */

    /**
     * An `Object` that defines the sprite properties to use when rendering, if any.
     *
     * @property render.sprite
     * @type object
     */

    /**
     * An `String` that defines the path to the image to use as the sprite texture, if any.
     *
     * @property render.sprite.texture
     * @type string
     */
     
    /**
     * A `Number` that defines the scaling in the x-axis for the sprite, if any.
     *
     * @property render.sprite.xScale
     * @type number
     * @default 1
     */

    /**
     * A `Number` that defines the scaling in the y-axis for the sprite, if any.
     *
     * @property render.sprite.yScale
     * @type number
     * @default 1
     */

     /**
      * A `Number` that defines the offset in the x-axis for the sprite (normalised by texture width).
      *
      * @property render.sprite.xOffset
      * @type number
      * @default 0
      */

     /**
      * A `Number` that defines the offset in the y-axis for the sprite (normalised by texture height).
      *
      * @property render.sprite.yOffset
      * @type number
      * @default 0
      */

    /**
     * A `Number` that defines the line width to use when rendering the body outline (if a sprite is not defined).
     * A value of `0` means no outline will be rendered.
     *
     * @property render.lineWidth
     * @type number
     * @default 1.5
     */

    /**
     * A `String` that defines the fill style to use when rendering the body (if a sprite is not defined).
     * It is the same as when using a canvas, so it accepts CSS style property values.
     *
     * @property render.fillStyle
     * @type string
     * @default a random colour
     */

    /**
     * A `String` that defines the stroke style to use when rendering the body outline (if a sprite is not defined).
     * It is the same as when using a canvas, so it accepts CSS style property values.
     *
     * @property render.strokeStyle
     * @type string
     * @default a random colour
     */

    /**
     * An array of unique axis vectors (edge normals) used for collision detection.
     * These are automatically calculated from the given convex hull (`vertices` array) in `Body.create`.
     * They are constantly updated by `Body.update` during the simulation.
     *
     * @property axes
     * @type vector[]
     */
     
    /**
     * A `Number` that _measures_ the area of the body's convex hull, calculated at creation by `Body.create`.
     *
     * @property area
     * @type string
     * @default 
     */

    /**
     * A `Bounds` object that defines the AABB region for the body.
     * It is automatically calculated from the given convex hull (`vertices` array) in `Body.create` and constantly updated by `Body.update` during simulation.
     *
     * @property bounds
     * @type bounds
     */

})();

},{"../core/Common":17,"../core/Sleeping":23,"../geometry/Axes":26,"../geometry/Bounds":27,"../geometry/Vector":29,"../geometry/Vertices":30,"../render/Render":32}],5:[function(require,module,exports){
/**
* The `Matter.Composite` module contains methods for creating and manipulating composite bodies.
* A composite body is a collection of `Matter.Body`, `Matter.Constraint` and other `Matter.Composite`, therefore composites form a tree structure.
* It is important to use the functions in this module to modify composites, rather than directly modifying their properties.
* Note that the `Matter.World` object is also a type of `Matter.Composite` and as such all composite methods here can also operate on a `Matter.World`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composite
*/

var Composite = {};

module.exports = Composite;

var Events = require('../core/Events');
var Common = require('../core/Common');
var Body = require('./Body');

(function() {

    /**
     * Creates a new composite. The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properites section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {} [options]
     * @return {composite} A new composite
     */
    Composite.create = function(options) {
        return Common.extend({ 
            id: Common.nextId(),
            type: 'composite',
            parent: null,
            isModified: false,
            bodies: [], 
            constraints: [], 
            composites: [],
            label: 'Composite'
        }, options);
    };

    /**
     * Sets the composite's `isModified` flag. 
     * If `updateParents` is true, all parents will be set (default: false).
     * If `updateChildren` is true, all children will be set (default: false).
     * @method setModified
     * @param {composite} composite
     * @param {boolean} isModified
     * @param {boolean} [updateParents=false]
     * @param {boolean} [updateChildren=false]
     */
    Composite.setModified = function(composite, isModified, updateParents, updateChildren) {
        composite.isModified = isModified;

        if (updateParents && composite.parent) {
            Composite.setModified(composite.parent, isModified, updateParents, updateChildren);
        }

        if (updateChildren) {
            for(var i = 0; i < composite.composites.length; i++) {
                var childComposite = composite.composites[i];
                Composite.setModified(childComposite, isModified, updateParents, updateChildren);
            }
        }
    };

    /**
     * Generic add function. Adds one or many body(s), constraint(s) or a composite(s) to the given composite.
     * Triggers `beforeAdd` and `afterAdd` events on the `composite`.
     * @method add
     * @param {composite} composite
     * @param {} object
     * @return {composite} The original composite with the objects added
     */
    Composite.add = function(composite, object) {
        var objects = [].concat(object);

        Events.trigger(composite, 'beforeAdd', { object: object });

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            switch (obj.type) {

            case 'body':
                // skip adding compound parts
                if (obj.parent !== obj) {
                    Common.log('Composite.add: skipped adding a compound body part (you must add its parent instead)', 'warn');
                    break;
                }

                Composite.addBody(composite, obj);
                break;
            case 'constraint':
                Composite.addConstraint(composite, obj);
                break;
            case 'composite':
                Composite.addComposite(composite, obj);
                break;
            case 'mouseConstraint':
                Composite.addConstraint(composite, obj.constraint);
                break;

            }
        }

        Events.trigger(composite, 'afterAdd', { object: object });

        return composite;
    };

    /**
     * Generic remove function. Removes one or many body(s), constraint(s) or a composite(s) to the given composite.
     * Optionally searching its children recursively.
     * Triggers `beforeRemove` and `afterRemove` events on the `composite`.
     * @method remove
     * @param {composite} composite
     * @param {} object
     * @param {boolean} [deep=false]
     * @return {composite} The original composite with the objects removed
     */
    Composite.remove = function(composite, object, deep) {
        var objects = [].concat(object);

        Events.trigger(composite, 'beforeRemove', { object: object });

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            switch (obj.type) {

            case 'body':
                Composite.removeBody(composite, obj, deep);
                break;
            case 'constraint':
                Composite.removeConstraint(composite, obj, deep);
                break;
            case 'composite':
                Composite.removeComposite(composite, obj, deep);
                break;
            case 'mouseConstraint':
                Composite.removeConstraint(composite, obj.constraint);
                break;

            }
        }

        Events.trigger(composite, 'afterRemove', { object: object });

        return composite;
    };

    /**
     * Adds a composite to the given composite.
     * @private
     * @method addComposite
     * @param {composite} compositeA
     * @param {composite} compositeB
     * @return {composite} The original compositeA with the objects from compositeB added
     */
    Composite.addComposite = function(compositeA, compositeB) {
        compositeA.composites.push(compositeB);
        compositeB.parent = compositeA;
        Composite.setModified(compositeA, true, true, false);
        return compositeA;
    };

    /**
     * Removes a composite from the given composite, and optionally searching its children recursively.
     * @private
     * @method removeComposite
     * @param {composite} compositeA
     * @param {composite} compositeB
     * @param {boolean} [deep=false]
     * @return {composite} The original compositeA with the composite removed
     */
    Composite.removeComposite = function(compositeA, compositeB, deep) {
        var position = Common.indexOf(compositeA.composites, compositeB);
        if (position !== -1) {
            Composite.removeCompositeAt(compositeA, position);
            Composite.setModified(compositeA, true, true, false);
        }

        if (deep) {
            for (var i = 0; i < compositeA.composites.length; i++){
                Composite.removeComposite(compositeA.composites[i], compositeB, true);
            }
        }

        return compositeA;
    };

    /**
     * Removes a composite from the given composite.
     * @private
     * @method removeCompositeAt
     * @param {composite} composite
     * @param {number} position
     * @return {composite} The original composite with the composite removed
     */
    Composite.removeCompositeAt = function(composite, position) {
        composite.composites.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Adds a body to the given composite.
     * @private
     * @method addBody
     * @param {composite} composite
     * @param {body} body
     * @return {composite} The original composite with the body added
     */
    Composite.addBody = function(composite, body) {
        composite.bodies.push(body);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Removes a body from the given composite, and optionally searching its children recursively.
     * @private
     * @method removeBody
     * @param {composite} composite
     * @param {body} body
     * @param {boolean} [deep=false]
     * @return {composite} The original composite with the body removed
     */
    Composite.removeBody = function(composite, body, deep) {
        var position = Common.indexOf(composite.bodies, body);
        if (position !== -1) {
            Composite.removeBodyAt(composite, position);
            Composite.setModified(composite, true, true, false);
        }

        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeBody(composite.composites[i], body, true);
            }
        }

        return composite;
    };

    /**
     * Removes a body from the given composite.
     * @private
     * @method removeBodyAt
     * @param {composite} composite
     * @param {number} position
     * @return {composite} The original composite with the body removed
     */
    Composite.removeBodyAt = function(composite, position) {
        composite.bodies.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Adds a constraint to the given composite.
     * @private
     * @method addConstraint
     * @param {composite} composite
     * @param {constraint} constraint
     * @return {composite} The original composite with the constraint added
     */
    Composite.addConstraint = function(composite, constraint) {
        composite.constraints.push(constraint);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Removes a constraint from the given composite, and optionally searching its children recursively.
     * @private
     * @method removeConstraint
     * @param {composite} composite
     * @param {constraint} constraint
     * @param {boolean} [deep=false]
     * @return {composite} The original composite with the constraint removed
     */
    Composite.removeConstraint = function(composite, constraint, deep) {
        var position = Common.indexOf(composite.constraints, constraint);
        if (position !== -1) {
            Composite.removeConstraintAt(composite, position);
        }

        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeConstraint(composite.composites[i], constraint, true);
            }
        }

        return composite;
    };

    /**
     * Removes a body from the given composite.
     * @private
     * @method removeConstraintAt
     * @param {composite} composite
     * @param {number} position
     * @return {composite} The original composite with the constraint removed
     */
    Composite.removeConstraintAt = function(composite, position) {
        composite.constraints.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Removes all bodies, constraints and composites from the given composite.
     * Optionally clearing its children recursively.
     * @method clear
     * @param {composite} composite
     * @param {boolean} keepStatic
     * @param {boolean} [deep=false]
     */
    Composite.clear = function(composite, keepStatic, deep) {
        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.clear(composite.composites[i], keepStatic, true);
            }
        }
        
        if (keepStatic) {
            composite.bodies = composite.bodies.filter(function(body) { return body.isStatic; });
        } else {
            composite.bodies.length = 0;
        }

        composite.constraints.length = 0;
        composite.composites.length = 0;
        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Returns all bodies in the given composite, including all bodies in its children, recursively.
     * @method allBodies
     * @param {composite} composite
     * @return {body[]} All the bodies
     */
    Composite.allBodies = function(composite) {
        var bodies = [].concat(composite.bodies);

        for (var i = 0; i < composite.composites.length; i++)
            bodies = bodies.concat(Composite.allBodies(composite.composites[i]));

        return bodies;
    };

    /**
     * Returns all constraints in the given composite, including all constraints in its children, recursively.
     * @method allConstraints
     * @param {composite} composite
     * @return {constraint[]} All the constraints
     */
    Composite.allConstraints = function(composite) {
        var constraints = [].concat(composite.constraints);

        for (var i = 0; i < composite.composites.length; i++)
            constraints = constraints.concat(Composite.allConstraints(composite.composites[i]));

        return constraints;
    };

    /**
     * Returns all composites in the given composite, including all composites in its children, recursively.
     * @method allComposites
     * @param {composite} composite
     * @return {composite[]} All the composites
     */
    Composite.allComposites = function(composite) {
        var composites = [].concat(composite.composites);

        for (var i = 0; i < composite.composites.length; i++)
            composites = composites.concat(Composite.allComposites(composite.composites[i]));

        return composites;
    };

    /**
     * Searches the composite recursively for an object matching the type and id supplied, null if not found.
     * @method get
     * @param {composite} composite
     * @param {number} id
     * @param {string} type
     * @return {object} The requested object, if found
     */
    Composite.get = function(composite, id, type) {
        var objects,
            object;

        switch (type) {
        case 'body':
            objects = Composite.allBodies(composite);
            break;
        case 'constraint':
            objects = Composite.allConstraints(composite);
            break;
        case 'composite':
            objects = Composite.allComposites(composite).concat(composite);
            break;
        }

        if (!objects)
            return null;

        object = objects.filter(function(object) { 
            return object.id.toString() === id.toString(); 
        });

        return object.length === 0 ? null : object[0];
    };

    /**
     * Moves the given object(s) from compositeA to compositeB (equal to a remove followed by an add).
     * @method move
     * @param {compositeA} compositeA
     * @param {object[]} objects
     * @param {compositeB} compositeB
     * @return {composite} Returns compositeA
     */
    Composite.move = function(compositeA, objects, compositeB) {
        Composite.remove(compositeA, objects);
        Composite.add(compositeB, objects);
        return compositeA;
    };

    /**
     * Assigns new ids for all objects in the composite, recursively.
     * @method rebase
     * @param {composite} composite
     * @return {composite} Returns composite
     */
    Composite.rebase = function(composite) {
        var objects = Composite.allBodies(composite)
                        .concat(Composite.allConstraints(composite))
                        .concat(Composite.allComposites(composite));

        for (var i = 0; i < objects.length; i++) {
            objects[i].id = Common.nextId();
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Translates all children in the composite by a given vector relative to their current positions, 
     * without imparting any velocity.
     * @method translate
     * @param {composite} composite
     * @param {vector} translation
     * @param {bool} [recursive=true]
     */
    Composite.translate = function(composite, translation, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            Body.translate(bodies[i], translation);
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Rotates all children in the composite by a given angle about the given point, without imparting any angular velocity.
     * @method rotate
     * @param {composite} composite
     * @param {number} rotation
     * @param {vector} point
     * @param {bool} [recursive=true]
     */
    Composite.rotate = function(composite, rotation, point, recursive) {
        var cos = Math.cos(rotation),
            sin = Math.sin(rotation),
            bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + (dx * cos - dy * sin),
                y: point.y + (dx * sin + dy * cos)
            });

            Body.rotate(body, rotation);
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Scales all children in the composite, including updating physical properties (mass, area, axes, inertia), from a world-space point.
     * @method scale
     * @param {composite} composite
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} point
     * @param {bool} [recursive=true]
     */
    Composite.scale = function(composite, scaleX, scaleY, point, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + dx * scaleX,
                y: point.y + dy * scaleY
            });

            Body.scale(body, scaleX, scaleY);
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired when a call to `Composite.add` is made, before objects have been added.
    *
    * @event beforeAdd
    * @param {} event An event object
    * @param {} event.object The object(s) to be added (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a call to `Composite.add` is made, after objects have been added.
    *
    * @event afterAdd
    * @param {} event An event object
    * @param {} event.object The object(s) that have been added (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a call to `Composite.remove` is made, before objects have been removed.
    *
    * @event beforeRemove
    * @param {} event An event object
    * @param {} event.object The object(s) to be removed (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when a call to `Composite.remove` is made, after objects have been removed.
    *
    * @event afterRemove
    * @param {} event An event object
    * @param {} event.object The object(s) that have been removed (may be a single body, constraint, composite or a mixed array of these)
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` uniquely identifying number generated in `Composite.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "composite"
     * @readOnly
     */

    /**
     * An arbitrary `String` name to help the user identify and manage composites.
     *
     * @property label
     * @type string
     * @default "Composite"
     */

    /**
     * A flag that specifies whether the composite has been modified during the current step.
     * Most `Matter.Composite` methods will automatically set this flag to `true` to inform the engine of changes to be handled.
     * If you need to change it manually, you should use the `Composite.setModified` method.
     *
     * @property isModified
     * @type boolean
     * @default false
     */

    /**
     * The `Composite` that is the parent of this composite. It is automatically managed by the `Matter.Composite` methods.
     *
     * @property parent
     * @type composite
     * @default null
     */

    /**
     * An array of `Body` that are _direct_ children of this composite.
     * To add or remove bodies you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
     * If you wish to recursively find all descendants, you should use the `Composite.allBodies` method.
     *
     * @property bodies
     * @type body[]
     * @default []
     */

    /**
     * An array of `Constraint` that are _direct_ children of this composite.
     * To add or remove constraints you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
     * If you wish to recursively find all descendants, you should use the `Composite.allConstraints` method.
     *
     * @property constraints
     * @type constraint[]
     * @default []
     */

    /**
     * An array of `Composite` that are _direct_ children of this composite.
     * To add or remove composites you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
     * If you wish to recursively find all descendants, you should use the `Composite.allComposites` method.
     *
     * @property composites
     * @type composite[]
     * @default []
     */

})();

},{"../core/Common":17,"../core/Events":19,"./Body":4}],6:[function(require,module,exports){
/**
* The `Matter.World` module contains methods for creating and manipulating the world composite.
* A `Matter.World` is a `Matter.Composite` body, which is a collection of `Matter.Body`, `Matter.Constraint` and other `Matter.Composite`.
* A `Matter.World` has a few additional properties including `gravity` and `bounds`.
* It is important to use the functions in the `Matter.Composite` module to modify the world composite, rather than directly modifying its properties.
* There are also a few methods here that alias those in `Matter.Composite` for easier readability.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class World
* @extends Composite
*/

var World = {};

module.exports = World;

var Composite = require('./Composite');
var Constraint = require('../constraint/Constraint');
var Common = require('../core/Common');

(function() {

    /**
     * Creates a new world composite. The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @constructor
     * @param {} options
     * @return {world} A new world
     */
    World.create = function(options) {
        var composite = Composite.create();

        var defaults = {
            label: 'World',
            gravity: {
                x: 0,
                y: 1,
                scale: 0.001
            },
            bounds: { 
                min: { x: -Infinity, y: -Infinity }, 
                max: { x: Infinity, y: Infinity } 
            }
        };
        
        return Common.extend(composite, defaults, options);
    };

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * The gravity to apply on the world.
     *
     * @property gravity
     * @type object
     */

    /**
     * The gravity x component.
     *
     * @property gravity.x
     * @type object
     * @default 0
     */

    /**
     * The gravity y component.
     *
     * @property gravity.y
     * @type object
     * @default 1
     */

    /**
     * The gravity scale factor.
     *
     * @property gravity.scale
     * @type object
     * @default 0.001
     */

    /**
     * A `Bounds` object that defines the world bounds for collision detection.
     *
     * @property bounds
     * @type bounds
     * @default { min: { x: -Infinity, y: -Infinity }, max: { x: Infinity, y: Infinity } }
     */

    // World is a Composite body
    // see src/module/Outro.js for these aliases:
    
    /**
     * An alias for Composite.clear
     * @method clear
     * @param {world} world
     * @param {boolean} keepStatic
     */

    /**
     * An alias for Composite.add
     * @method addComposite
     * @param {world} world
     * @param {composite} composite
     * @return {world} The original world with the objects from composite added
     */
    
     /**
      * An alias for Composite.addBody
      * @method addBody
      * @param {world} world
      * @param {body} body
      * @return {world} The original world with the body added
      */

     /**
      * An alias for Composite.addConstraint
      * @method addConstraint
      * @param {world} world
      * @param {constraint} constraint
      * @return {world} The original world with the constraint added
      */

})();

},{"../constraint/Constraint":15,"../core/Common":17,"./Composite":5}],7:[function(require,module,exports){
/**
* The `Matter.Contact` module contains methods for creating and manipulating collision contacts.
*
* @class Contact
*/

var Contact = {};

module.exports = Contact;

(function() {

    /**
     * Creates a new contact.
     * @method create
     * @param {vertex} vertex
     * @return {contact} A new contact
     */
    Contact.create = function(vertex) {
        return {
            id: Contact.id(vertex),
            vertex: vertex,
            normalImpulse: 0,
            tangentImpulse: 0
        };
    };
    
    /**
     * Generates a contact id.
     * @method id
     * @param {vertex} vertex
     * @return {string} Unique contactID
     */
    Contact.id = function(vertex) {
        return vertex.body.id + '_' + vertex.index;
    };

})();

},{}],8:[function(require,module,exports){
/**
* The `Matter.Detector` module contains methods for detecting collisions given a set of pairs.
*
* @class Detector
*/

// TODO: speculative contacts

var Detector = {};

module.exports = Detector;

var SAT = require('./SAT');
var Pair = require('./Pair');
var Bounds = require('../geometry/Bounds');

(function() {

    /**
     * Finds all collisions given a list of pairs.
     * @method collisions
     * @param {pair[]} broadphasePairs
     * @param {engine} engine
     * @return {array} collisions
     */
    Detector.collisions = function(broadphasePairs, engine) {
        var collisions = [],
            pairsTable = engine.pairs.table;

        // @if DEBUG
        var metrics = engine.metrics;
        // @endif
        
        for (var i = 0; i < broadphasePairs.length; i++) {
            var bodyA = broadphasePairs[i][0], 
                bodyB = broadphasePairs[i][1];

            if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping))
                continue;
            
            if (!Detector.canCollide(bodyA.collisionFilter, bodyB.collisionFilter))
                continue;

            // @if DEBUG
            metrics.midphaseTests += 1;
            // @endif

            // mid phase
            if (Bounds.overlaps(bodyA.bounds, bodyB.bounds)) {
                for (var j = bodyA.parts.length > 1 ? 1 : 0; j < bodyA.parts.length; j++) {
                    var partA = bodyA.parts[j];

                    for (var k = bodyB.parts.length > 1 ? 1 : 0; k < bodyB.parts.length; k++) {
                        var partB = bodyB.parts[k];

                        if ((partA === bodyA && partB === bodyB) || Bounds.overlaps(partA.bounds, partB.bounds)) {
                            // find a previous collision we could reuse
                            var pairId = Pair.id(partA, partB),
                                pair = pairsTable[pairId],
                                previousCollision;

                            if (pair && pair.isActive) {
                                previousCollision = pair.collision;
                            } else {
                                previousCollision = null;
                            }

                            // narrow phase
                            var collision = SAT.collides(partA, partB, previousCollision);

                            // @if DEBUG
                            metrics.narrowphaseTests += 1;
                            if (collision.reused)
                                metrics.narrowReuseCount += 1;
                            // @endif

                            if (collision.collided) {
                                collisions.push(collision);
                                // @if DEBUG
                                metrics.narrowDetections += 1;
                                // @endif
                            }
                        }
                    }
                }
            }
        }

        return collisions;
    };

    /**
     * Returns `true` if both supplied collision filters will allow a collision to occur.
     * See `body.collisionFilter` for more information.
     * @method canCollide
     * @param {} filterA
     * @param {} filterB
     * @return {bool} `true` if collision can occur
     */
    Detector.canCollide = function(filterA, filterB) {
        if (filterA.group === filterB.group && filterA.group !== 0)
            return filterA.group > 0;

        return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    };

})();

},{"../geometry/Bounds":27,"./Pair":10,"./SAT":14}],9:[function(require,module,exports){
/**
* The `Matter.Grid` module contains methods for creating and manipulating collision broadphase grid structures.
*
* @class Grid
*/

var Grid = {};

module.exports = Grid;

var Pair = require('./Pair');
var Detector = require('./Detector');
var Common = require('../core/Common');

(function() {

    /**
     * Creates a new grid.
     * @method create
     * @param {} options
     * @return {grid} A new grid
     */
    Grid.create = function(options) {
        var defaults = {
            controller: Grid,
            detector: Detector.collisions,
            buckets: {},
            pairs: {},
            pairsList: [],
            bucketWidth: 48,
            bucketHeight: 48
        };

        return Common.extend(defaults, options);
    };

    /**
     * The width of a single grid bucket.
     *
     * @property bucketWidth
     * @type number
     * @default 48
     */

    /**
     * The height of a single grid bucket.
     *
     * @property bucketHeight
     * @type number
     * @default 48
     */

    /**
     * Updates the grid.
     * @method update
     * @param {grid} grid
     * @param {body[]} bodies
     * @param {engine} engine
     * @param {boolean} forceUpdate
     */
    Grid.update = function(grid, bodies, engine, forceUpdate) {
        var i, col, row,
            world = engine.world,
            buckets = grid.buckets,
            bucket,
            bucketId,
            gridChanged = false;

        // @if DEBUG
        var metrics = engine.metrics;
        metrics.broadphaseTests = 0;
        // @endif

        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isSleeping && !forceUpdate)
                continue;

            // don't update out of world bodies
            if (body.bounds.max.x < world.bounds.min.x || body.bounds.min.x > world.bounds.max.x
                || body.bounds.max.y < world.bounds.min.y || body.bounds.min.y > world.bounds.max.y)
                continue;

            var newRegion = _getRegion(grid, body);

            // if the body has changed grid region
            if (!body.region || newRegion.id !== body.region.id || forceUpdate) {

                // @if DEBUG
                metrics.broadphaseTests += 1;
                // @endif

                if (!body.region || forceUpdate)
                    body.region = newRegion;

                var union = _regionUnion(newRegion, body.region);

                // update grid buckets affected by region change
                // iterate over the union of both regions
                for (col = union.startCol; col <= union.endCol; col++) {
                    for (row = union.startRow; row <= union.endRow; row++) {
                        bucketId = _getBucketId(col, row);
                        bucket = buckets[bucketId];

                        var isInsideNewRegion = (col >= newRegion.startCol && col <= newRegion.endCol
                                                && row >= newRegion.startRow && row <= newRegion.endRow);

                        var isInsideOldRegion = (col >= body.region.startCol && col <= body.region.endCol
                                                && row >= body.region.startRow && row <= body.region.endRow);

                        // remove from old region buckets
                        if (!isInsideNewRegion && isInsideOldRegion) {
                            if (isInsideOldRegion) {
                                if (bucket)
                                    _bucketRemoveBody(grid, bucket, body);
                            }
                        }

                        // add to new region buckets
                        if (body.region === newRegion || (isInsideNewRegion && !isInsideOldRegion) || forceUpdate) {
                            if (!bucket)
                                bucket = _createBucket(buckets, bucketId);
                            _bucketAddBody(grid, bucket, body);
                        }
                    }
                }

                // set the new region
                body.region = newRegion;

                // flag changes so we can update pairs
                gridChanged = true;
            }
        }

        // update pairs list only if pairs changed (i.e. a body changed region)
        if (gridChanged)
            grid.pairsList = _createActivePairsList(grid);
    };

    /**
     * Clears the grid.
     * @method clear
     * @param {grid} grid
     */
    Grid.clear = function(grid) {
        grid.buckets = {};
        grid.pairs = {};
        grid.pairsList = [];
    };

    /**
     * Finds the union of two regions.
     * @method _regionUnion
     * @private
     * @param {} regionA
     * @param {} regionB
     * @return {} region
     */
    var _regionUnion = function(regionA, regionB) {
        var startCol = Math.min(regionA.startCol, regionB.startCol),
            endCol = Math.max(regionA.endCol, regionB.endCol),
            startRow = Math.min(regionA.startRow, regionB.startRow),
            endRow = Math.max(regionA.endRow, regionB.endRow);

        return _createRegion(startCol, endCol, startRow, endRow);
    };

    /**
     * Gets the region a given body falls in for a given grid.
     * @method _getRegion
     * @private
     * @param {} grid
     * @param {} body
     * @return {} region
     */
    var _getRegion = function(grid, body) {
        var bounds = body.bounds,
            startCol = Math.floor(bounds.min.x / grid.bucketWidth),
            endCol = Math.floor(bounds.max.x / grid.bucketWidth),
            startRow = Math.floor(bounds.min.y / grid.bucketHeight),
            endRow = Math.floor(bounds.max.y / grid.bucketHeight);

        return _createRegion(startCol, endCol, startRow, endRow);
    };

    /**
     * Creates a region.
     * @method _createRegion
     * @private
     * @param {} startCol
     * @param {} endCol
     * @param {} startRow
     * @param {} endRow
     * @return {} region
     */
    var _createRegion = function(startCol, endCol, startRow, endRow) {
        return { 
            id: startCol + ',' + endCol + ',' + startRow + ',' + endRow,
            startCol: startCol, 
            endCol: endCol, 
            startRow: startRow, 
            endRow: endRow 
        };
    };

    /**
     * Gets the bucket id at the given position.
     * @method _getBucketId
     * @private
     * @param {} column
     * @param {} row
     * @return {string} bucket id
     */
    var _getBucketId = function(column, row) {
        return column + ',' + row;
    };

    /**
     * Creates a bucket.
     * @method _createBucket
     * @private
     * @param {} buckets
     * @param {} bucketId
     * @return {} bucket
     */
    var _createBucket = function(buckets, bucketId) {
        var bucket = buckets[bucketId] = [];
        return bucket;
    };

    /**
     * Adds a body to a bucket.
     * @method _bucketAddBody
     * @private
     * @param {} grid
     * @param {} bucket
     * @param {} body
     */
    var _bucketAddBody = function(grid, bucket, body) {
        // add new pairs
        for (var i = 0; i < bucket.length; i++) {
            var bodyB = bucket[i];

            if (body.id === bodyB.id || (body.isStatic && bodyB.isStatic))
                continue;

            // keep track of the number of buckets the pair exists in
            // important for Grid.update to work
            var pairId = Pair.id(body, bodyB),
                pair = grid.pairs[pairId];

            if (pair) {
                pair[2] += 1;
            } else {
                grid.pairs[pairId] = [body, bodyB, 1];
            }
        }

        // add to bodies (after pairs, otherwise pairs with self)
        bucket.push(body);
    };

    /**
     * Removes a body from a bucket.
     * @method _bucketRemoveBody
     * @private
     * @param {} grid
     * @param {} bucket
     * @param {} body
     */
    var _bucketRemoveBody = function(grid, bucket, body) {
        // remove from bucket
        bucket.splice(Common.indexOf(bucket, body), 1);

        // update pair counts
        for (var i = 0; i < bucket.length; i++) {
            // keep track of the number of buckets the pair exists in
            // important for _createActivePairsList to work
            var bodyB = bucket[i],
                pairId = Pair.id(body, bodyB),
                pair = grid.pairs[pairId];

            if (pair)
                pair[2] -= 1;
        }
    };

    /**
     * Generates a list of the active pairs in the grid.
     * @method _createActivePairsList
     * @private
     * @param {} grid
     * @return [] pairs
     */
    var _createActivePairsList = function(grid) {
        var pairKeys,
            pair,
            pairs = [];

        // grid.pairs is used as a hashmap
        pairKeys = Common.keys(grid.pairs);

        // iterate over grid.pairs
        for (var k = 0; k < pairKeys.length; k++) {
            pair = grid.pairs[pairKeys[k]];

            // if pair exists in at least one bucket
            // it is a pair that needs further collision testing so push it
            if (pair[2] > 0) {
                pairs.push(pair);
            } else {
                delete grid.pairs[pairKeys[k]];
            }
        }

        return pairs;
    };
    
})();

},{"../core/Common":17,"./Detector":8,"./Pair":10}],10:[function(require,module,exports){
/**
* The `Matter.Pair` module contains methods for creating and manipulating collision pairs.
*
* @class Pair
*/

var Pair = {};

module.exports = Pair;

var Contact = require('./Contact');

(function() {
    
    /**
     * Creates a pair.
     * @method create
     * @param {collision} collision
     * @param {number} timestamp
     * @return {pair} A new pair
     */
    Pair.create = function(collision, timestamp) {
        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            parentA = collision.parentA,
            parentB = collision.parentB;

        var pair = {
            id: Pair.id(bodyA, bodyB),
            bodyA: bodyA,
            bodyB: bodyB,
            contacts: {},
            activeContacts: [],
            separation: 0,
            isActive: true,
            isSensor: bodyA.isSensor || bodyB.isSensor,
            timeCreated: timestamp,
            timeUpdated: timestamp,
            inverseMass: parentA.inverseMass + parentB.inverseMass,
            friction: Math.min(parentA.friction, parentB.friction),
            frictionStatic: Math.max(parentA.frictionStatic, parentB.frictionStatic),
            restitution: Math.max(parentA.restitution, parentB.restitution),
            slop: Math.max(parentA.slop, parentB.slop)
        };

        Pair.update(pair, collision, timestamp);

        return pair;
    };

    /**
     * Updates a pair given a collision.
     * @method update
     * @param {pair} pair
     * @param {collision} collision
     * @param {number} timestamp
     */
    Pair.update = function(pair, collision, timestamp) {
        var contacts = pair.contacts,
            supports = collision.supports,
            activeContacts = pair.activeContacts,
            parentA = collision.parentA,
            parentB = collision.parentB;
        
        pair.collision = collision;
        pair.inverseMass = parentA.inverseMass + parentB.inverseMass;
        pair.friction = Math.min(parentA.friction, parentB.friction);
        pair.frictionStatic = Math.max(parentA.frictionStatic, parentB.frictionStatic);
        pair.restitution = Math.max(parentA.restitution, parentB.restitution);
        pair.slop = Math.max(parentA.slop, parentB.slop);
        activeContacts.length = 0;
        
        if (collision.collided) {
            for (var i = 0; i < supports.length; i++) {
                var support = supports[i],
                    contactId = Contact.id(support),
                    contact = contacts[contactId];

                if (contact) {
                    activeContacts.push(contact);
                } else {
                    activeContacts.push(contacts[contactId] = Contact.create(support));
                }
            }

            pair.separation = collision.depth;
            Pair.setActive(pair, true, timestamp);
        } else {
            if (pair.isActive === true)
                Pair.setActive(pair, false, timestamp);
        }
    };
    
    /**
     * Set a pair as active or inactive.
     * @method setActive
     * @param {pair} pair
     * @param {bool} isActive
     * @param {number} timestamp
     */
    Pair.setActive = function(pair, isActive, timestamp) {
        if (isActive) {
            pair.isActive = true;
            pair.timeUpdated = timestamp;
        } else {
            pair.isActive = false;
            pair.activeContacts.length = 0;
        }
    };

    /**
     * Get the id for the given pair.
     * @method id
     * @param {body} bodyA
     * @param {body} bodyB
     * @return {string} Unique pairId
     */
    Pair.id = function(bodyA, bodyB) {
        if (bodyA.id < bodyB.id) {
            return bodyA.id + '_' + bodyB.id;
        } else {
            return bodyB.id + '_' + bodyA.id;
        }
    };

})();

},{"./Contact":7}],11:[function(require,module,exports){
/**
* The `Matter.Pairs` module contains methods for creating and manipulating collision pair sets.
*
* @class Pairs
*/

var Pairs = {};

module.exports = Pairs;

var Pair = require('./Pair');
var Common = require('../core/Common');

(function() {
    
    var _pairMaxIdleLife = 1000;

    /**
     * Creates a new pairs structure.
     * @method create
     * @param {object} options
     * @return {pairs} A new pairs structure
     */
    Pairs.create = function(options) {
        return Common.extend({ 
            table: {},
            list: [],
            collisionStart: [],
            collisionActive: [],
            collisionEnd: []
        }, options);
    };

    /**
     * Updates pairs given a list of collisions.
     * @method update
     * @param {object} pairs
     * @param {collision[]} collisions
     * @param {number} timestamp
     */
    Pairs.update = function(pairs, collisions, timestamp) {
        var pairsList = pairs.list,
            pairsTable = pairs.table,
            collisionStart = pairs.collisionStart,
            collisionEnd = pairs.collisionEnd,
            collisionActive = pairs.collisionActive,
            activePairIds = [],
            collision,
            pairId,
            pair,
            i;

        // clear collision state arrays, but maintain old reference
        collisionStart.length = 0;
        collisionEnd.length = 0;
        collisionActive.length = 0;

        for (i = 0; i < collisions.length; i++) {
            collision = collisions[i];

            if (collision.collided) {
                pairId = Pair.id(collision.bodyA, collision.bodyB);
                activePairIds.push(pairId);

                pair = pairsTable[pairId];
                
                if (pair) {
                    // pair already exists (but may or may not be active)
                    if (pair.isActive) {
                        // pair exists and is active
                        collisionActive.push(pair);
                    } else {
                        // pair exists but was inactive, so a collision has just started again
                        collisionStart.push(pair);
                    }

                    // update the pair
                    Pair.update(pair, collision, timestamp);
                } else {
                    // pair did not exist, create a new pair
                    pair = Pair.create(collision, timestamp);
                    pairsTable[pairId] = pair;

                    // push the new pair
                    collisionStart.push(pair);
                    pairsList.push(pair);
                }
            }
        }

        // deactivate previously active pairs that are now inactive
        for (i = 0; i < pairsList.length; i++) {
            pair = pairsList[i];
            if (pair.isActive && Common.indexOf(activePairIds, pair.id) === -1) {
                Pair.setActive(pair, false, timestamp);
                collisionEnd.push(pair);
            }
        }
    };
    
    /**
     * Finds and removes pairs that have been inactive for a set amount of time.
     * @method removeOld
     * @param {object} pairs
     * @param {number} timestamp
     */
    Pairs.removeOld = function(pairs, timestamp) {
        var pairsList = pairs.list,
            pairsTable = pairs.table,
            indexesToRemove = [],
            pair,
            collision,
            pairIndex,
            i;

        for (i = 0; i < pairsList.length; i++) {
            pair = pairsList[i];
            collision = pair.collision;
            
            // never remove sleeping pairs
            if (collision.bodyA.isSleeping || collision.bodyB.isSleeping) {
                pair.timeUpdated = timestamp;
                continue;
            }

            // if pair is inactive for too long, mark it to be removed
            if (timestamp - pair.timeUpdated > _pairMaxIdleLife) {
                indexesToRemove.push(i);
            }
        }

        // remove marked pairs
        for (i = 0; i < indexesToRemove.length; i++) {
            pairIndex = indexesToRemove[i] - i;
            pair = pairsList[pairIndex];
            delete pairsTable[pair.id];
            pairsList.splice(pairIndex, 1);
        }
    };

    /**
     * Clears the given pairs structure.
     * @method clear
     * @param {pairs} pairs
     * @return {pairs} pairs
     */
    Pairs.clear = function(pairs) {
        pairs.table = {};
        pairs.list.length = 0;
        pairs.collisionStart.length = 0;
        pairs.collisionActive.length = 0;
        pairs.collisionEnd.length = 0;
        return pairs;
    };

})();

},{"../core/Common":17,"./Pair":10}],12:[function(require,module,exports){
/**
* The `Matter.Query` module contains methods for performing collision queries.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Query
*/

var Query = {};

module.exports = Query;

var Vector = require('../geometry/Vector');
var SAT = require('./SAT');
var Bounds = require('../geometry/Bounds');
var Bodies = require('../factory/Bodies');
var Vertices = require('../geometry/Vertices');

(function() {

    /**
     * Casts a ray segment against a set of bodies and returns all collisions, ray width is optional. Intersection points are not provided.
     * @method ray
     * @param {body[]} bodies
     * @param {vector} startPoint
     * @param {vector} endPoint
     * @param {number} [rayWidth]
     * @return {object[]} Collisions
     */
    Query.ray = function(bodies, startPoint, endPoint, rayWidth) {
        rayWidth = rayWidth || 1e-100;

        var rayAngle = Vector.angle(startPoint, endPoint),
            rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)),
            rayX = (endPoint.x + startPoint.x) * 0.5,
            rayY = (endPoint.y + startPoint.y) * 0.5,
            ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }),
            collisions = [];

        for (var i = 0; i < bodies.length; i++) {
            var bodyA = bodies[i];
            
            if (Bounds.overlaps(bodyA.bounds, ray.bounds)) {
                for (var j = bodyA.parts.length === 1 ? 0 : 1; j < bodyA.parts.length; j++) {
                    var part = bodyA.parts[j];

                    if (Bounds.overlaps(part.bounds, ray.bounds)) {
                        var collision = SAT.collides(part, ray);
                        if (collision.collided) {
                            collision.body = collision.bodyA = collision.bodyB = bodyA;
                            collisions.push(collision);
                            break;
                        }
                    }
                }
            }
        }

        return collisions;
    };

    /**
     * Returns all bodies whose bounds are inside (or outside if set) the given set of bounds, from the given set of bodies.
     * @method region
     * @param {body[]} bodies
     * @param {bounds} bounds
     * @param {bool} [outside=false]
     * @return {body[]} The bodies matching the query
     */
    Query.region = function(bodies, bounds, outside) {
        var result = [];

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                overlaps = Bounds.overlaps(body.bounds, bounds);
            if ((overlaps && !outside) || (!overlaps && outside))
                result.push(body);
        }

        return result;
    };

    /**
     * Returns all bodies whose vertices contain the given point, from the given set of bodies.
     * @method point
     * @param {body[]} bodies
     * @param {vector} point
     * @return {body[]} The bodies matching the query
     */
    Query.point = function(bodies, point) {
        var result = [];

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            
            if (Bounds.contains(body.bounds, point)) {
                for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                    var part = body.parts[j];

                    if (Bounds.contains(part.bounds, point)
                        && Vertices.contains(part.vertices, point)) {
                        result.push(body);
                        break;
                    }
                }
            }
        }

        return result;
    };

})();

},{"../factory/Bodies":24,"../geometry/Bounds":27,"../geometry/Vector":29,"../geometry/Vertices":30,"./SAT":14}],13:[function(require,module,exports){
/**
* The `Matter.Resolver` module contains methods for resolving collision pairs.
*
* @class Resolver
*/

var Resolver = {};

module.exports = Resolver;

var Vertices = require('../geometry/Vertices');
var Vector = require('../geometry/Vector');
var Common = require('../core/Common');
var Bounds = require('../geometry/Bounds');

(function() {

    Resolver._restingThresh = 4;
    Resolver._restingThreshTangent = 6;
    Resolver._positionDampen = 0.9;
    Resolver._positionWarming = 0.8;
    Resolver._frictionNormalMultiplier = 5;

    /**
     * Prepare pairs for position solving.
     * @method preSolvePosition
     * @param {pair[]} pairs
     */
    Resolver.preSolvePosition = function(pairs) {
        var i,
            pair,
            activeCount;

        // find total contacts on each body
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            
            if (!pair.isActive)
                continue;
            
            activeCount = pair.activeContacts.length;
            pair.collision.parentA.totalContacts += activeCount;
            pair.collision.parentB.totalContacts += activeCount;
        }
    };

    /**
     * Find a solution for pair positions.
     * @method solvePosition
     * @param {pair[]} pairs
     * @param {number} timeScale
     */
    Resolver.solvePosition = function(pairs, timeScale) {
        var i,
            pair,
            collision,
            bodyA,
            bodyB,
            normal,
            bodyBtoA,
            contactShare,
            positionImpulse,
            contactCount = {},
            tempA = Vector._temp[0],
            tempB = Vector._temp[1],
            tempC = Vector._temp[2],
            tempD = Vector._temp[3];

        // find impulses required to resolve penetration
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;

            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;

            // get current separation between body edges involved in collision
            bodyBtoA = Vector.sub(Vector.add(bodyB.positionImpulse, bodyB.position, tempA), 
                                    Vector.add(bodyA.positionImpulse, 
                                        Vector.sub(bodyB.position, collision.penetration, tempB), tempC), tempD);

            pair.separation = Vector.dot(normal, bodyBtoA);
        }
        
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive || pair.isSensor || pair.separation < 0)
                continue;
            
            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;
            positionImpulse = (pair.separation - pair.slop) * timeScale;

            if (bodyA.isStatic || bodyB.isStatic)
                positionImpulse *= 2;
            
            if (!(bodyA.isStatic || bodyA.isSleeping)) {
                contactShare = Resolver._positionDampen / bodyA.totalContacts;
                bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
                bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
            }

            if (!(bodyB.isStatic || bodyB.isSleeping)) {
                contactShare = Resolver._positionDampen / bodyB.totalContacts;
                bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
                bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
            }
        }
    };

    /**
     * Apply position resolution.
     * @method postSolvePosition
     * @param {body[]} bodies
     */
    Resolver.postSolvePosition = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            // reset contact count
            body.totalContacts = 0;

            if (body.positionImpulse.x !== 0 || body.positionImpulse.y !== 0) {
                // update body geometry
                for (var j = 0; j < body.parts.length; j++) {
                    var part = body.parts[j];
                    Vertices.translate(part.vertices, body.positionImpulse);
                    Bounds.update(part.bounds, part.vertices, body.velocity);
                    part.position.x += body.positionImpulse.x;
                    part.position.y += body.positionImpulse.y;
                }

                // move the body without changing velocity
                body.positionPrev.x += body.positionImpulse.x;
                body.positionPrev.y += body.positionImpulse.y;

                if (Vector.dot(body.positionImpulse, body.velocity) < 0) {
                    // reset cached impulse if the body has velocity along it
                    body.positionImpulse.x = 0;
                    body.positionImpulse.y = 0;
                } else {
                    // warm the next iteration
                    body.positionImpulse.x *= Resolver._positionWarming;
                    body.positionImpulse.y *= Resolver._positionWarming;
                }
            }
        }
    };

    /**
     * Prepare pairs for velocity solving.
     * @method preSolveVelocity
     * @param {pair[]} pairs
     */
    Resolver.preSolveVelocity = function(pairs) {
        var i,
            j,
            pair,
            contacts,
            collision,
            bodyA,
            bodyB,
            normal,
            tangent,
            contact,
            contactVertex,
            normalImpulse,
            tangentImpulse,
            offset,
            impulse = Vector._temp[0],
            tempA = Vector._temp[1];
        
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;
            
            contacts = pair.activeContacts;
            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;
            tangent = collision.tangent;

            // resolve each contact
            for (j = 0; j < contacts.length; j++) {
                contact = contacts[j];
                contactVertex = contact.vertex;
                normalImpulse = contact.normalImpulse;
                tangentImpulse = contact.tangentImpulse;

                if (normalImpulse !== 0 || tangentImpulse !== 0) {
                    // total impulse from contact
                    impulse.x = (normal.x * normalImpulse) + (tangent.x * tangentImpulse);
                    impulse.y = (normal.y * normalImpulse) + (tangent.y * tangentImpulse);
                    
                    // apply impulse from contact
                    if (!(bodyA.isStatic || bodyA.isSleeping)) {
                        offset = Vector.sub(contactVertex, bodyA.position, tempA);
                        bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
                        bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
                        bodyA.anglePrev += Vector.cross(offset, impulse) * bodyA.inverseInertia;
                    }

                    if (!(bodyB.isStatic || bodyB.isSleeping)) {
                        offset = Vector.sub(contactVertex, bodyB.position, tempA);
                        bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
                        bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
                        bodyB.anglePrev -= Vector.cross(offset, impulse) * bodyB.inverseInertia;
                    }
                }
            }
        }
    };

    /**
     * Find a solution for pair velocities.
     * @method solveVelocity
     * @param {pair[]} pairs
     * @param {number} timeScale
     */
    Resolver.solveVelocity = function(pairs, timeScale) {
        var timeScaleSquared = timeScale * timeScale,
            impulse = Vector._temp[0],
            tempA = Vector._temp[1],
            tempB = Vector._temp[2],
            tempC = Vector._temp[3],
            tempD = Vector._temp[4],
            tempE = Vector._temp[5];
        
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;
            
            var collision = pair.collision,
                bodyA = collision.parentA,
                bodyB = collision.parentB,
                normal = collision.normal,
                tangent = collision.tangent,
                contacts = pair.activeContacts,
                contactShare = 1 / contacts.length;

            // update body velocities
            bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
            bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
            bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
            bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
            bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
            bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;

            // resolve each contact
            for (var j = 0; j < contacts.length; j++) {
                var contact = contacts[j],
                    contactVertex = contact.vertex,
                    offsetA = Vector.sub(contactVertex, bodyA.position, tempA),
                    offsetB = Vector.sub(contactVertex, bodyB.position, tempB),
                    velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity), tempC),
                    velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity), tempD), 
                    relativeVelocity = Vector.sub(velocityPointA, velocityPointB, tempE),
                    normalVelocity = Vector.dot(normal, relativeVelocity);

                var tangentVelocity = Vector.dot(tangent, relativeVelocity),
                    tangentSpeed = Math.abs(tangentVelocity),
                    tangentVelocityDirection = Common.sign(tangentVelocity);

                // raw impulses
                var normalImpulse = (1 + pair.restitution) * normalVelocity,
                    normalForce = Common.clamp(pair.separation + normalVelocity, 0, 1) * Resolver._frictionNormalMultiplier;

                // coulomb friction
                var tangentImpulse = tangentVelocity,
                    maxFriction = Infinity;

                if (tangentSpeed > pair.friction * pair.frictionStatic * normalForce * timeScaleSquared) {
                    maxFriction = tangentSpeed;
                    tangentImpulse = Common.clamp(
                        pair.friction * tangentVelocityDirection * timeScaleSquared,
                        -maxFriction, maxFriction
                    );
                }

                // modify impulses accounting for mass, inertia and offset
                var oAcN = Vector.cross(offsetA, normal),
                    oBcN = Vector.cross(offsetB, normal),
                    share = contactShare / (bodyA.inverseMass + bodyB.inverseMass + bodyA.inverseInertia * oAcN * oAcN  + bodyB.inverseInertia * oBcN * oBcN);

                normalImpulse *= share;
                tangentImpulse *= share;

                // handle high velocity and resting collisions separately
                if (normalVelocity < 0 && normalVelocity * normalVelocity > Resolver._restingThresh * timeScaleSquared) {
                    // high normal velocity so clear cached contact normal impulse
                    contact.normalImpulse = 0;
                } else {
                    // solve resting collision constraints using Erin Catto's method (GDC08)
                    // impulse constraint tends to 0
                    var contactNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse = Math.min(contact.normalImpulse + normalImpulse, 0);
                    normalImpulse = contact.normalImpulse - contactNormalImpulse;
                }

                // handle high velocity and resting collisions separately
                if (tangentVelocity * tangentVelocity > Resolver._restingThreshTangent * timeScaleSquared) {
                    // high tangent velocity so clear cached contact tangent impulse
                    contact.tangentImpulse = 0;
                } else {
                    // solve resting collision constraints using Erin Catto's method (GDC08)
                    // tangent impulse tends to -tangentSpeed or +tangentSpeed
                    var contactTangentImpulse = contact.tangentImpulse;
                    contact.tangentImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                    tangentImpulse = contact.tangentImpulse - contactTangentImpulse;
                }

                // total impulse from contact
                impulse.x = (normal.x * normalImpulse) + (tangent.x * tangentImpulse);
                impulse.y = (normal.y * normalImpulse) + (tangent.y * tangentImpulse);
                
                // apply impulse from contact
                if (!(bodyA.isStatic || bodyA.isSleeping)) {
                    bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
                    bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
                    bodyA.anglePrev += Vector.cross(offsetA, impulse) * bodyA.inverseInertia;
                }

                if (!(bodyB.isStatic || bodyB.isSleeping)) {
                    bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
                    bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
                    bodyB.anglePrev -= Vector.cross(offsetB, impulse) * bodyB.inverseInertia;
                }
            }
        }
    };

})();

},{"../core/Common":17,"../geometry/Bounds":27,"../geometry/Vector":29,"../geometry/Vertices":30}],14:[function(require,module,exports){
/**
* The `Matter.SAT` module contains methods for detecting collisions using the Separating Axis Theorem.
*
* @class SAT
*/

// TODO: true circles and curves

var SAT = {};

module.exports = SAT;

var Vertices = require('../geometry/Vertices');
var Vector = require('../geometry/Vector');

(function() {

    /**
     * Detect collision between two bodies using the Separating Axis Theorem.
     * @method collides
     * @param {body} bodyA
     * @param {body} bodyB
     * @param {collision} previousCollision
     * @return {collision} collision
     */
    SAT.collides = function(bodyA, bodyB, previousCollision) {
        var overlapAB,
            overlapBA, 
            minOverlap,
            collision,
            prevCol = previousCollision,
            canReusePrevCol = false;

        if (prevCol) {
            // estimate total motion
            var parentA = bodyA.parent,
                parentB = bodyB.parent,
                motion = parentA.speed * parentA.speed + parentA.angularSpeed * parentA.angularSpeed
                       + parentB.speed * parentB.speed + parentB.angularSpeed * parentB.angularSpeed;

            // we may be able to (partially) reuse collision result 
            // but only safe if collision was resting
            canReusePrevCol = prevCol && prevCol.collided && motion < 0.2;

            // reuse collision object
            collision = prevCol;
        } else {
            collision = { collided: false, bodyA: bodyA, bodyB: bodyB };
        }

        if (prevCol && canReusePrevCol) {
            // if we can reuse the collision result
            // we only need to test the previously found axis
            var axisBodyA = collision.axisBody,
                axisBodyB = axisBodyA === bodyA ? bodyB : bodyA,
                axes = [axisBodyA.axes[prevCol.axisNumber]];

            minOverlap = _overlapAxes(axisBodyA.vertices, axisBodyB.vertices, axes);
            collision.reused = true;

            if (minOverlap.overlap <= 0) {
                collision.collided = false;
                return collision;
            }
        } else {
            // if we can't reuse a result, perform a full SAT test

            overlapAB = _overlapAxes(bodyA.vertices, bodyB.vertices, bodyA.axes);

            if (overlapAB.overlap <= 0) {
                collision.collided = false;
                return collision;
            }

            overlapBA = _overlapAxes(bodyB.vertices, bodyA.vertices, bodyB.axes);

            if (overlapBA.overlap <= 0) {
                collision.collided = false;
                return collision;
            }

            if (overlapAB.overlap < overlapBA.overlap) {
                minOverlap = overlapAB;
                collision.axisBody = bodyA;
            } else {
                minOverlap = overlapBA;
                collision.axisBody = bodyB;
            }

            // important for reuse later
            collision.axisNumber = minOverlap.axisNumber;
        }

        collision.bodyA = bodyA.id < bodyB.id ? bodyA : bodyB;
        collision.bodyB = bodyA.id < bodyB.id ? bodyB : bodyA;
        collision.collided = true;
        collision.normal = minOverlap.axis;
        collision.depth = minOverlap.overlap;
        collision.parentA = collision.bodyA.parent;
        collision.parentB = collision.bodyB.parent;
        
        bodyA = collision.bodyA;
        bodyB = collision.bodyB;

        // ensure normal is facing away from bodyA
        if (Vector.dot(collision.normal, Vector.sub(bodyB.position, bodyA.position)) > 0) 
            collision.normal = Vector.neg(collision.normal);

        collision.tangent = Vector.perp(collision.normal);

        collision.penetration = { 
            x: collision.normal.x * collision.depth, 
            y: collision.normal.y * collision.depth 
        };

        // find support points, there is always either exactly one or two
        var verticesB = _findSupports(bodyA, bodyB, collision.normal),
            supports = collision.supports || [];
        supports.length = 0;

        // find the supports from bodyB that are inside bodyA
        if (Vertices.contains(bodyA.vertices, verticesB[0]))
            supports.push(verticesB[0]);

        if (Vertices.contains(bodyA.vertices, verticesB[1]))
            supports.push(verticesB[1]);

        // find the supports from bodyA that are inside bodyB
        if (supports.length < 2) {
            var verticesA = _findSupports(bodyB, bodyA, Vector.neg(collision.normal));
                
            if (Vertices.contains(bodyB.vertices, verticesA[0]))
                supports.push(verticesA[0]);

            if (supports.length < 2 && Vertices.contains(bodyB.vertices, verticesA[1]))
                supports.push(verticesA[1]);
        }

        // account for the edge case of overlapping but no vertex containment
        if (supports.length < 1)
            supports = [verticesB[0]];
        
        collision.supports = supports;

        return collision;
    };

    /**
     * Find the overlap between two sets of vertices.
     * @method _overlapAxes
     * @private
     * @param {} verticesA
     * @param {} verticesB
     * @param {} axes
     * @return result
     */
    var _overlapAxes = function(verticesA, verticesB, axes) {
        var projectionA = Vector._temp[0], 
            projectionB = Vector._temp[1],
            result = { overlap: Number.MAX_VALUE },
            overlap,
            axis;

        for (var i = 0; i < axes.length; i++) {
            axis = axes[i];

            _projectToAxis(projectionA, verticesA, axis);
            _projectToAxis(projectionB, verticesB, axis);

            overlap = Math.min(projectionA.max - projectionB.min, projectionB.max - projectionA.min);

            if (overlap <= 0) {
                result.overlap = overlap;
                return result;
            }

            if (overlap < result.overlap) {
                result.overlap = overlap;
                result.axis = axis;
                result.axisNumber = i;
            }
        }

        return result;
    };

    /**
     * Projects vertices on an axis and returns an interval.
     * @method _projectToAxis
     * @private
     * @param {} projection
     * @param {} vertices
     * @param {} axis
     */
    var _projectToAxis = function(projection, vertices, axis) {
        var min = Vector.dot(vertices[0], axis),
            max = min;

        for (var i = 1; i < vertices.length; i += 1) {
            var dot = Vector.dot(vertices[i], axis);

            if (dot > max) { 
                max = dot; 
            } else if (dot < min) { 
                min = dot; 
            }
        }

        projection.min = min;
        projection.max = max;
    };
    
    /**
     * Finds supporting vertices given two bodies along a given direction using hill-climbing.
     * @method _findSupports
     * @private
     * @param {} bodyA
     * @param {} bodyB
     * @param {} normal
     * @return [vector]
     */
    var _findSupports = function(bodyA, bodyB, normal) {
        var nearestDistance = Number.MAX_VALUE,
            vertexToBody = Vector._temp[0],
            vertices = bodyB.vertices,
            bodyAPosition = bodyA.position,
            distance,
            vertex,
            vertexA,
            vertexB;

        // find closest vertex on bodyB
        for (var i = 0; i < vertices.length; i++) {
            vertex = vertices[i];
            vertexToBody.x = vertex.x - bodyAPosition.x;
            vertexToBody.y = vertex.y - bodyAPosition.y;
            distance = -Vector.dot(normal, vertexToBody);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                vertexA = vertex;
            }
        }

        // find next closest vertex using the two connected to it
        var prevIndex = vertexA.index - 1 >= 0 ? vertexA.index - 1 : vertices.length - 1;
        vertex = vertices[prevIndex];
        vertexToBody.x = vertex.x - bodyAPosition.x;
        vertexToBody.y = vertex.y - bodyAPosition.y;
        nearestDistance = -Vector.dot(normal, vertexToBody);
        vertexB = vertex;

        var nextIndex = (vertexA.index + 1) % vertices.length;
        vertex = vertices[nextIndex];
        vertexToBody.x = vertex.x - bodyAPosition.x;
        vertexToBody.y = vertex.y - bodyAPosition.y;
        distance = -Vector.dot(normal, vertexToBody);
        if (distance < nearestDistance) {
            vertexB = vertex;
        }

        return [vertexA, vertexB];
    };

})();

},{"../geometry/Vector":29,"../geometry/Vertices":30}],15:[function(require,module,exports){
/**
* The `Matter.Constraint` module contains methods for creating and manipulating constraints.
* Constraints are used for specifying that a fixed distance must be maintained between two bodies (or a body and a fixed world-space position).
* The stiffness of constraints can be modified to create springs or elastic.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Constraint
*/

// TODO: fix instability issues with torque
// TODO: linked constraints
// TODO: breakable constraints
// TODO: collision constraints
// TODO: allow constrained bodies to sleep
// TODO: handle 0 length constraints properly
// TODO: impulse caching and warming

var Constraint = {};

module.exports = Constraint;

var Vertices = require('../geometry/Vertices');
var Vector = require('../geometry/Vector');
var Sleeping = require('../core/Sleeping');
var Bounds = require('../geometry/Bounds');
var Axes = require('../geometry/Axes');
var Common = require('../core/Common');

(function() {

    var _minLength = 0.000001,
        _minDifference = 0.001;

    /**
     * Creates a new constraint.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {} options
     * @return {constraint} constraint
     */
    Constraint.create = function(options) {
        var constraint = options;

        // if bodies defined but no points, use body centre
        if (constraint.bodyA && !constraint.pointA)
            constraint.pointA = { x: 0, y: 0 };
        if (constraint.bodyB && !constraint.pointB)
            constraint.pointB = { x: 0, y: 0 };

        // calculate static length using initial world space points
        var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.position, constraint.pointA) : constraint.pointA,
            initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.position, constraint.pointB) : constraint.pointB,
            length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
    
        constraint.length = constraint.length || length || _minLength;

        // render
        var render = {
            visible: true,
            lineWidth: 2,
            strokeStyle: '#666'
        };
        
        constraint.render = Common.extend(render, constraint.render);

        // option defaults
        constraint.id = constraint.id || Common.nextId();
        constraint.label = constraint.label || 'Constraint';
        constraint.type = 'constraint';
        constraint.stiffness = constraint.stiffness || 1;
        constraint.angularStiffness = constraint.angularStiffness || 0;
        constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
        constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;

        return constraint;
    };

    /**
     * Solves all constraints in a list of collisions.
     * @private
     * @method solveAll
     * @param {constraint[]} constraints
     * @param {number} timeScale
     */
    Constraint.solveAll = function(constraints, timeScale) {
        for (var i = 0; i < constraints.length; i++) {
            Constraint.solve(constraints[i], timeScale);
        }
    };

    /**
     * Solves a distance constraint with Gauss-Siedel method.
     * @private
     * @method solve
     * @param {constraint} constraint
     * @param {number} timeScale
     */
    Constraint.solve = function(constraint, timeScale) {
        var bodyA = constraint.bodyA,
            bodyB = constraint.bodyB,
            pointA = constraint.pointA,
            pointB = constraint.pointB;

        // update reference angle
        if (bodyA && !bodyA.isStatic) {
            constraint.pointA = Vector.rotate(pointA, bodyA.angle - constraint.angleA);
            constraint.angleA = bodyA.angle;
        }
        
        // update reference angle
        if (bodyB && !bodyB.isStatic) {
            constraint.pointB = Vector.rotate(pointB, bodyB.angle - constraint.angleB);
            constraint.angleB = bodyB.angle;
        }

        var pointAWorld = pointA,
            pointBWorld = pointB;

        if (bodyA) pointAWorld = Vector.add(bodyA.position, pointA);
        if (bodyB) pointBWorld = Vector.add(bodyB.position, pointB);

        if (!pointAWorld || !pointBWorld)
            return;

        var delta = Vector.sub(pointAWorld, pointBWorld),
            currentLength = Vector.magnitude(delta);

        // prevent singularity
        if (currentLength === 0)
            currentLength = _minLength;

        // solve distance constraint with Gauss-Siedel method
        var difference = (currentLength - constraint.length) / currentLength,
            normal = Vector.div(delta, currentLength),
            force = Vector.mult(delta, difference * 0.5 * constraint.stiffness * timeScale * timeScale);
        
        // if difference is very small, we can skip
        if (Math.abs(1 - (currentLength / constraint.length)) < _minDifference * timeScale)
            return;

        var velocityPointA,
            velocityPointB,
            offsetA,
            offsetB,
            oAn,
            oBn,
            bodyADenom,
            bodyBDenom;
    
        if (bodyA && !bodyA.isStatic) {
            // point body offset
            offsetA = { 
                x: pointAWorld.x - bodyA.position.x + force.x, 
                y: pointAWorld.y - bodyA.position.y + force.y
            };
            
            // update velocity
            bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
            bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
            bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
            
            // find point velocity and body mass
            velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity));
            oAn = Vector.dot(offsetA, normal);
            bodyADenom = bodyA.inverseMass + bodyA.inverseInertia * oAn * oAn;
        } else {
            velocityPointA = { x: 0, y: 0 };
            bodyADenom = bodyA ? bodyA.inverseMass : 0;
        }
            
        if (bodyB && !bodyB.isStatic) {
            // point body offset
            offsetB = { 
                x: pointBWorld.x - bodyB.position.x - force.x, 
                y: pointBWorld.y - bodyB.position.y - force.y 
            };
            
            // update velocity
            bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
            bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
            bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;

            // find point velocity and body mass
            velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity));
            oBn = Vector.dot(offsetB, normal);
            bodyBDenom = bodyB.inverseMass + bodyB.inverseInertia * oBn * oBn;
        } else {
            velocityPointB = { x: 0, y: 0 };
            bodyBDenom = bodyB ? bodyB.inverseMass : 0;
        }
        
        var relativeVelocity = Vector.sub(velocityPointB, velocityPointA),
            normalImpulse = Vector.dot(normal, relativeVelocity) / (bodyADenom + bodyBDenom);
    
        if (normalImpulse > 0) normalImpulse = 0;
    
        var normalVelocity = {
            x: normal.x * normalImpulse, 
            y: normal.y * normalImpulse
        };

        var torque;
 
        if (bodyA && !bodyA.isStatic) {
            torque = Vector.cross(offsetA, normalVelocity) * bodyA.inverseInertia * (1 - constraint.angularStiffness);

            // keep track of applied impulses for post solving
            bodyA.constraintImpulse.x -= force.x;
            bodyA.constraintImpulse.y -= force.y;
            bodyA.constraintImpulse.angle += torque;

            // apply forces
            bodyA.position.x -= force.x;
            bodyA.position.y -= force.y;
            bodyA.angle += torque;
        }

        if (bodyB && !bodyB.isStatic) {
            torque = Vector.cross(offsetB, normalVelocity) * bodyB.inverseInertia * (1 - constraint.angularStiffness);

            // keep track of applied impulses for post solving
            bodyB.constraintImpulse.x += force.x;
            bodyB.constraintImpulse.y += force.y;
            bodyB.constraintImpulse.angle -= torque;
            
            // apply forces
            bodyB.position.x += force.x;
            bodyB.position.y += force.y;
            bodyB.angle -= torque;
        }

    };

    /**
     * Performs body updates required after solving constraints.
     * @private
     * @method postSolveAll
     * @param {body[]} bodies
     */
    Constraint.postSolveAll = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                impulse = body.constraintImpulse;

            if (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0) {
                continue;
            }

            Sleeping.set(body, false);

            // update geometry and reset
            for (var j = 0; j < body.parts.length; j++) {
                var part = body.parts[j];
                
                Vertices.translate(part.vertices, impulse);

                if (j > 0) {
                    part.position.x += impulse.x;
                    part.position.y += impulse.y;
                }

                if (impulse.angle !== 0) {
                    Vertices.rotate(part.vertices, impulse.angle, body.position);
                    Axes.rotate(part.axes, impulse.angle);
                    if (j > 0) {
                        Vector.rotateAbout(part.position, impulse.angle, body.position, part.position);
                    }
                }

                Bounds.update(part.bounds, part.vertices, body.velocity);
            }

            impulse.angle = 0;
            impulse.x = 0;
            impulse.y = 0;
        }
    };

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` uniquely identifying number generated in `Composite.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "constraint"
     * @readOnly
     */

    /**
     * An arbitrary `String` name to help the user identify and manage bodies.
     *
     * @property label
     * @type string
     * @default "Constraint"
     */

    /**
     * An `Object` that defines the rendering properties to be consumed by the module `Matter.Render`.
     *
     * @property render
     * @type object
     */

    /**
     * A flag that indicates if the constraint should be rendered.
     *
     * @property render.visible
     * @type boolean
     * @default true
     */

    /**
     * A `Number` that defines the line width to use when rendering the constraint outline.
     * A value of `0` means no outline will be rendered.
     *
     * @property render.lineWidth
     * @type number
     * @default 2
     */

    /**
     * A `String` that defines the stroke style to use when rendering the constraint outline.
     * It is the same as when using a canvas, so it accepts CSS style property values.
     *
     * @property render.strokeStyle
     * @type string
     * @default a random colour
     */

    /**
     * The first possible `Body` that this constraint is attached to.
     *
     * @property bodyA
     * @type body
     * @default null
     */

    /**
     * The second possible `Body` that this constraint is attached to.
     *
     * @property bodyB
     * @type body
     * @default null
     */

    /**
     * A `Vector` that specifies the offset of the constraint from center of the `constraint.bodyA` if defined, otherwise a world-space position.
     *
     * @property pointA
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Vector` that specifies the offset of the constraint from center of the `constraint.bodyA` if defined, otherwise a world-space position.
     *
     * @property pointB
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * A `Number` that specifies the stiffness of the constraint, i.e. the rate at which it returns to its resting `constraint.length`.
     * A value of `1` means the constraint should be very stiff.
     * A value of `0.2` means the constraint acts like a soft spring.
     *
     * @property stiffness
     * @type number
     * @default 1
     */

    /**
     * A `Number` that specifies the target resting length of the constraint. 
     * It is calculated automatically in `Constraint.create` from initial positions of the `constraint.bodyA` and `constraint.bodyB`.
     *
     * @property length
     * @type number
     */

})();

},{"../core/Common":17,"../core/Sleeping":23,"../geometry/Axes":26,"../geometry/Bounds":27,"../geometry/Vector":29,"../geometry/Vertices":30}],16:[function(require,module,exports){
/**
* The `Matter.MouseConstraint` module contains methods for creating mouse constraints.
* Mouse constraints are used for allowing user interaction, providing the ability to move bodies via the mouse or touch.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class MouseConstraint
*/

var MouseConstraint = {};

module.exports = MouseConstraint;

var Vertices = require('../geometry/Vertices');
var Sleeping = require('../core/Sleeping');
var Mouse = require('../core/Mouse');
var Events = require('../core/Events');
var Detector = require('../collision/Detector');
var Constraint = require('./Constraint');
var Composite = require('../body/Composite');
var Common = require('../core/Common');
var Bounds = require('../geometry/Bounds');

(function() {

    /**
     * Creates a new mouse constraint.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {engine} engine
     * @param {} options
     * @return {MouseConstraint} A new MouseConstraint
     */
    MouseConstraint.create = function(engine, options) {
        var mouse = (engine ? engine.mouse : null) || (options ? options.mouse : null);

        if (!mouse) {
            if (engine && engine.render && engine.render.canvas) {
                mouse = Mouse.create(engine.render.canvas);
            } else if (options && options.element) {
                mouse = Mouse.create(options.element);
            } else {
                mouse = Mouse.create();
                Common.log('MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected', 'warn');
            }
        }

        var constraint = Constraint.create({ 
            label: 'Mouse Constraint',
            pointA: mouse.position,
            pointB: { x: 0, y: 0 },
            length: 0.01, 
            stiffness: 0.1,
            angularStiffness: 1,
            render: {
                strokeStyle: '#90EE90',
                lineWidth: 3
            }
        });

        var defaults = {
            type: 'mouseConstraint',
            mouse: mouse,
            element: null,
            body: null,
            constraint: constraint,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            }
        };

        var mouseConstraint = Common.extend(defaults, options);

        Events.on(engine, 'tick', function() {
            var allBodies = Composite.allBodies(engine.world);
            MouseConstraint.update(mouseConstraint, allBodies);
            _triggerEvents(mouseConstraint);
        });

        return mouseConstraint;
    };

    /**
     * Updates the given mouse constraint.
     * @private
     * @method update
     * @param {MouseConstraint} mouseConstraint
     * @param {body[]} bodies
     */
    MouseConstraint.update = function(mouseConstraint, bodies) {
        var mouse = mouseConstraint.mouse,
            constraint = mouseConstraint.constraint,
            body = mouseConstraint.body;

        if (mouse.button === 0) {
            if (!constraint.bodyB) {
                for (var i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (Bounds.contains(body.bounds, mouse.position) 
                            && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                        for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.position)) {
                                constraint.pointA = mouse.position;
                                constraint.bodyB = mouseConstraint.body = body;
                                constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                                constraint.angleB = body.angle;

                                Sleeping.set(body, false);
                                Events.trigger(mouseConstraint, 'startdrag', { mouse: mouse, body: body });

                                break;
                            }
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                constraint.pointA = mouse.position;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            if (body)
                Events.trigger(mouseConstraint, 'enddrag', { mouse: mouse, body: body });
        }
    };

    /**
     * Triggers mouse constraint events.
     * @method _triggerEvents
     * @private
     * @param {mouse} mouseConstraint
     */
    var _triggerEvents = function(mouseConstraint) {
        var mouse = mouseConstraint.mouse,
            mouseEvents = mouse.sourceEvents;

        if (mouseEvents.mousemove)
            Events.trigger(mouseConstraint, 'mousemove', { mouse: mouse });

        if (mouseEvents.mousedown)
            Events.trigger(mouseConstraint, 'mousedown', { mouse: mouse });

        if (mouseEvents.mouseup)
            Events.trigger(mouseConstraint, 'mouseup', { mouse: mouse });

        // reset the mouse state ready for the next step
        Mouse.clearSourceEvents(mouse);
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired when the mouse has moved (or a touch moves) during the last step
    *
    * @event mousemove
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the mouse is down (or a touch has started) during the last step
    *
    * @event mousedown
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the mouse is up (or a touch has ended) during the last step
    *
    * @event mouseup
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the user starts dragging a body
    *
    * @event startdrag
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {body} event.body The body being dragged
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired when the user ends dragging a body
    *
    * @event enddrag
    * @param {} event An event object
    * @param {mouse} event.mouse The engine's mouse instance
    * @param {body} event.body The body that has stopped being dragged
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A `String` denoting the type of object.
     *
     * @property type
     * @type string
     * @default "constraint"
     * @readOnly
     */

    /**
     * The `Mouse` instance in use. If not supplied in `MouseConstraint.create`, one will be created.
     *
     * @property mouse
     * @type mouse
     * @default mouse
     */

    /**
     * The `Body` that is currently being moved by the user, or `null` if no body.
     *
     * @property body
     * @type body
     * @default null
     */

    /**
     * The `Constraint` object that is used to move the body during interaction.
     *
     * @property constraint
     * @type constraint
     */

    /**
     * An `Object` that specifies the collision filter properties.
     * The collision filter allows the user to define which types of body this mouse constraint can interact with.
     * See `body.collisionFilter` for more information.
     *
     * @property collisionFilter
     * @type object
     */

})();

},{"../body/Composite":5,"../collision/Detector":8,"../core/Common":17,"../core/Events":19,"../core/Mouse":21,"../core/Sleeping":23,"../geometry/Bounds":27,"../geometry/Vertices":30,"./Constraint":15}],17:[function(require,module,exports){
/**
* The `Matter.Common` module contains utility functions that are common to all modules.
*
* @class Common
*/

var Common = {};

module.exports = Common;

(function() {

    Common._nextId = 0;
    Common._seed = 0;

    /**
     * Extends the object in the first argument using the object in the second argument.
     * @method extend
     * @param {} obj
     * @param {boolean} deep
     * @return {} obj extended
     */
    Common.extend = function(obj, deep) {
        var argsStart,
            args,
            deepClone;

        if (typeof deep === 'boolean') {
            argsStart = 2;
            deepClone = deep;
        } else {
            argsStart = 1;
            deepClone = true;
        }

        args = Array.prototype.slice.call(arguments, argsStart);

        for (var i = 0; i < args.length; i++) {
            var source = args[i];

            if (source) {
                for (var prop in source) {
                    if (deepClone && source[prop] && source[prop].constructor === Object) {
                        if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            Common.extend(obj[prop], deepClone, source[prop]);
                        } else {
                            obj[prop] = source[prop];
                        }
                    } else {
                        obj[prop] = source[prop];
                    }
                }
            }
        }
        
        return obj;
    };

    /**
     * Creates a new clone of the object, if deep is true references will also be cloned.
     * @method clone
     * @param {} obj
     * @param {bool} deep
     * @return {} obj cloned
     */
    Common.clone = function(obj, deep) {
        return Common.extend({}, deep, obj);
    };

    /**
     * Returns the list of keys for the given object.
     * @method keys
     * @param {} obj
     * @return {string[]} keys
     */
    Common.keys = function(obj) {
        if (Object.keys)
            return Object.keys(obj);

        // avoid hasOwnProperty for performance
        var keys = [];
        for (var key in obj)
            keys.push(key);
        return keys;
    };

    /**
     * Returns the list of values for the given object.
     * @method values
     * @param {} obj
     * @return {array} Array of the objects property values
     */
    Common.values = function(obj) {
        var values = [];
        
        if (Object.keys) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                values.push(obj[keys[i]]);
            }
            return values;
        }
        
        // avoid hasOwnProperty for performance
        for (var key in obj)
            values.push(obj[key]);
        return values;
    };

    /**
     * Returns a hex colour string made by lightening or darkening color by percent.
     * @method shadeColor
     * @param {string} color
     * @param {number} percent
     * @return {string} A hex colour
     */
    Common.shadeColor = function(color, percent) {   
        // http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color
        var colorInteger = parseInt(color.slice(1),16), 
            amount = Math.round(2.55 * percent), 
            R = (colorInteger >> 16) + amount, 
            B = (colorInteger >> 8 & 0x00FF) + amount, 
            G = (colorInteger & 0x0000FF) + amount;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R :255) * 0x10000 
                + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 
                + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    };

    /**
     * Shuffles the given array in-place.
     * The function uses a seeded random generator.
     * @method shuffle
     * @param {array} array
     * @return {array} array shuffled randomly
     */
    Common.shuffle = function(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Common.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };

    /**
     * Randomly chooses a value from a list with equal probability.
     * The function uses a seeded random generator.
     * @method choose
     * @param {array} choices
     * @return {object} A random choice object from the array
     */
    Common.choose = function(choices) {
        return choices[Math.floor(Common.random() * choices.length)];
    };

    /**
     * Returns true if the object is a HTMLElement, otherwise false.
     * @method isElement
     * @param {object} obj
     * @return {boolean} True if the object is a HTMLElement, otherwise false
     */
    Common.isElement = function(obj) {
        // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
        try {
            return obj instanceof HTMLElement;
        }
        catch(e){
            return (typeof obj==="object") &&
              (obj.nodeType===1) && (typeof obj.style === "object") &&
              (typeof obj.ownerDocument ==="object");
        }
    };

    /**
     * Returns true if the object is an array.
     * @method isArray
     * @param {object} obj
     * @return {boolean} True if the object is an array, otherwise false
     */
    Common.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    
    /**
     * Returns the given value clamped between a minimum and maximum value.
     * @method clamp
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @return {number} The value clamped between min and max inclusive
     */
    Common.clamp = function(value, min, max) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    };
    
    /**
     * Returns the sign of the given value.
     * @method sign
     * @param {number} value
     * @return {number} -1 if negative, +1 if 0 or positive
     */
    Common.sign = function(value) {
        return value < 0 ? -1 : 1;
    };
    
    /**
     * Returns the current timestamp (high-res if available).
     * @method now
     * @return {number} the current timestamp (high-res if available)
     */
    Common.now = function() {
        // http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
        // https://gist.github.com/davidwaterston/2982531

        var performance = window.performance || {};

        performance.now = (function() {
            return performance.now    ||
            performance.webkitNow     ||
            performance.msNow         ||
            performance.oNow          ||
            performance.mozNow        ||
            function() { return +(new Date()); };
        })();
              
        return performance.now();
    };

    
    /**
     * Returns a random value between a minimum and a maximum value inclusive.
     * The function uses a seeded random generator.
     * @method random
     * @param {number} min
     * @param {number} max
     * @return {number} A random number between min and max inclusive
     */
    Common.random = function(min, max) {
        min = (typeof min !== "undefined") ? min : 0;
        max = (typeof max !== "undefined") ? max : 1;
        return min + _seededRandom() * (max - min);
    };

    /**
     * Converts a CSS hex colour string into an integer.
     * @method colorToNumber
     * @param {string} colorString
     * @return {number} An integer representing the CSS hex string
     */
    Common.colorToNumber = function(colorString) {
        colorString = colorString.replace('#','');

        if (colorString.length == 3) {
            colorString = colorString.charAt(0) + colorString.charAt(0)
                        + colorString.charAt(1) + colorString.charAt(1)
                        + colorString.charAt(2) + colorString.charAt(2);
        }

        return parseInt(colorString, 16);
    };

    /**
     * A wrapper for console.log, for providing errors and warnings.
     * @method log
     * @param {string} message
     * @param {string} type
     */
    Common.log = function(message, type) {
        if (!console || !console.log || !console.warn)
            return;

        switch (type) {

        case 'warn':
            console.warn('Matter.js:', message);
            break;
        case 'error':
            console.log('Matter.js:', message);
            break;

        }
    };

    /**
     * Returns the next unique sequential ID.
     * @method nextId
     * @return {Number} Unique sequential ID
     */
    Common.nextId = function() {
        return Common._nextId++;
    };

    /**
     * A cross browser compatible indexOf implementation.
     * @method indexOf
     * @param {array} haystack
     * @param {object} needle
     */
    Common.indexOf = function(haystack, needle) {
        if (haystack.indexOf)
            return haystack.indexOf(needle);

        for (var i = 0; i < haystack.length; i++) {
            if (haystack[i] === needle)
                return i;
        }

        return -1;
    };

    var _seededRandom = function() {
        // https://gist.github.com/ngryman/3830489
        Common._seed = (Common._seed * 9301 + 49297) % 233280;
        return Common._seed / 233280;
    };

})();

},{}],18:[function(require,module,exports){
/**
* The `Matter.Engine` module contains methods for creating and manipulating engines.
* An engine is a controller that manages updating the simulation of the world.
* See `Matter.Runner` for an optional game loop utility.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Engine
*/

var Engine = {};

module.exports = Engine;

var World = require('../body/World');
var Sleeping = require('./Sleeping');
var Resolver = require('../collision/Resolver');
var Render = require('../render/Render');
var Pairs = require('../collision/Pairs');
var Metrics = require('./Metrics');
var Grid = require('../collision/Grid');
var Events = require('./Events');
var Composite = require('../body/Composite');
var Constraint = require('../constraint/Constraint');
var Common = require('./Common');
var Body = require('../body/Body');

(function() {

    /**
     * Creates a new engine. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {object} [options]
     * @return {engine} engine
     */
    Engine.create = function(element, options) {
        // options may be passed as the first (and only) argument
        options = Common.isElement(element) ? options : element;
        element = Common.isElement(element) ? element : null;
        options = options || {};

        if (element || options.render) {
            Common.log('Engine.create: engine.render is deprecated (see docs)', 'warn');
        }

        var defaults = {
            positionIterations: 6,
            velocityIterations: 4,
            constraintIterations: 2,
            enableSleeping: false,
            events: [],
            timing: {
                timestamp: 0,
                timeScale: 1
            },
            broadphase: {
                controller: Grid
            }
        };

        var engine = Common.extend(defaults, options);

        // @deprecated
        if (element || engine.render) {
            var renderDefaults = {
                element: element,
                controller: Render
            };
            
            engine.render = Common.extend(renderDefaults, engine.render);
        }

        // @deprecated
        if (engine.render && engine.render.controller) {
            engine.render = engine.render.controller.create(engine.render);
        }

        // @deprecated
        if (engine.render) {
            engine.render.engine = engine;
        }

        engine.world = options.world || World.create(engine.world);
        engine.pairs = Pairs.create();
        engine.broadphase = engine.broadphase.controller.create(engine.broadphase);
        engine.metrics = engine.metrics || { extended: false };

        // @if DEBUG
        engine.metrics = Metrics.create(engine.metrics);
        // @endif

        return engine;
    };

    /**
     * Moves the simulation forward in time by `delta` ms.
     * The `correction` argument is an optional `Number` that specifies the time correction factor to apply to the update.
     * This can help improve the accuracy of the simulation in cases where `delta` is changing between updates.
     * The value of `correction` is defined as `delta / lastDelta`, i.e. the percentage change of `delta` over the last step.
     * Therefore the value is always `1` (no correction) when `delta` constant (or when no correction is desired, which is the default).
     * See the paper on <a href="http://lonesock.net/article/verlet.html">Time Corrected Verlet</a> for more information.
     *
     * Triggers `beforeUpdate` and `afterUpdate` events.
     * Triggers `collisionStart`, `collisionActive` and `collisionEnd` events.
     * @method update
     * @param {engine} engine
     * @param {number} [delta=16.666]
     * @param {number} [correction=1]
     */
    Engine.update = function(engine, delta, correction) {
        delta = delta || 1000 / 60;
        correction = correction || 1;

        var world = engine.world,
            timing = engine.timing,
            broadphase = engine.broadphase,
            broadphasePairs = [],
            i;

        // increment timestamp
        timing.timestamp += delta * timing.timeScale;

        // create an event object
        var event = {
            timestamp: timing.timestamp
        };

        Events.trigger(engine, 'beforeUpdate', event);

        // get lists of all bodies and constraints, no matter what composites they are in
        var allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world);

        // @if DEBUG
        // reset metrics logging
        Metrics.reset(engine.metrics);
        // @endif

        // if sleeping enabled, call the sleeping controller
        if (engine.enableSleeping)
            Sleeping.update(allBodies, timing.timeScale);

        // applies gravity to all bodies
        _bodiesApplyGravity(allBodies, world.gravity);

        // update all body position and rotation by integration
        _bodiesUpdate(allBodies, delta, timing.timeScale, correction, world.bounds);

        // update all constraints
        for (i = 0; i < engine.constraintIterations; i++) {
            Constraint.solveAll(allConstraints, timing.timeScale);
        }
        Constraint.postSolveAll(allBodies);

        // broadphase pass: find potential collision pairs
        if (broadphase.controller) {

            // if world is dirty, we must flush the whole grid
            if (world.isModified)
                broadphase.controller.clear(broadphase);

            // update the grid buckets based on current bodies
            broadphase.controller.update(broadphase, allBodies, engine, world.isModified);
            broadphasePairs = broadphase.pairsList;
        } else {

            // if no broadphase set, we just pass all bodies
            broadphasePairs = allBodies;
        }

        // clear all composite modified flags
        if (world.isModified) {
            Composite.setModified(world, false, false, true);
        }

        // narrowphase pass: find actual collisions, then create or update collision pairs
        var collisions = broadphase.detector(broadphasePairs, engine);

        // update collision pairs
        var pairs = engine.pairs,
            timestamp = timing.timestamp;
        Pairs.update(pairs, collisions, timestamp);
        Pairs.removeOld(pairs, timestamp);

        // wake up bodies involved in collisions
        if (engine.enableSleeping)
            Sleeping.afterCollisions(pairs.list, timing.timeScale);

        // trigger collision events
        if (pairs.collisionStart.length > 0)
            Events.trigger(engine, 'collisionStart', { pairs: pairs.collisionStart });

        // iteratively resolve position between collisions
        Resolver.preSolvePosition(pairs.list);
        for (i = 0; i < engine.positionIterations; i++) {
            Resolver.solvePosition(pairs.list, timing.timeScale);
        }
        Resolver.postSolvePosition(allBodies);

        // iteratively resolve velocity between collisions
        Resolver.preSolveVelocity(pairs.list);
        for (i = 0; i < engine.velocityIterations; i++) {
            Resolver.solveVelocity(pairs.list, timing.timeScale);
        }

        // trigger collision events
        if (pairs.collisionActive.length > 0)
            Events.trigger(engine, 'collisionActive', { pairs: pairs.collisionActive });

        if (pairs.collisionEnd.length > 0)
            Events.trigger(engine, 'collisionEnd', { pairs: pairs.collisionEnd });

        // @if DEBUG
        // update metrics log
        Metrics.update(engine.metrics, engine);
        // @endif

        // clear force buffers
        _bodiesClearForces(allBodies);

        Events.trigger(engine, 'afterUpdate', event);

        return engine;
    };
    
    /**
     * Merges two engines by keeping the configuration of `engineA` but replacing the world with the one from `engineB`.
     * @method merge
     * @param {engine} engineA
     * @param {engine} engineB
     */
    Engine.merge = function(engineA, engineB) {
        Common.extend(engineA, engineB);
        
        if (engineB.world) {
            engineA.world = engineB.world;

            Engine.clear(engineA);

            var bodies = Composite.allBodies(engineA.world);

            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                Sleeping.set(body, false);
                body.id = Common.nextId();
            }
        }
    };

    /**
     * Clears the engine including the world, pairs and broadphase.
     * @method clear
     * @param {engine} engine
     */
    Engine.clear = function(engine) {
        var world = engine.world;
        
        Pairs.clear(engine.pairs);

        var broadphase = engine.broadphase;
        if (broadphase.controller) {
            var bodies = Composite.allBodies(world);
            broadphase.controller.clear(broadphase);
            broadphase.controller.update(broadphase, bodies, engine, true);
        }
    };

    /**
     * Zeroes the `body.force` and `body.torque` force buffers.
     * @method bodiesClearForces
     * @private
     * @param {body[]} bodies
     */
    var _bodiesClearForces = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            // reset force buffers
            body.force.x = 0;
            body.force.y = 0;
            body.torque = 0;
        }
    };

    /**
     * Applys a mass dependant force to all given bodies.
     * @method bodiesApplyGravity
     * @private
     * @param {body[]} bodies
     * @param {vector} gravity
     */
    var _bodiesApplyGravity = function(bodies, gravity) {
        var gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001;

        if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) {
            return;
        }
        
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            // apply gravity
            body.force.y += body.mass * gravity.y * gravityScale;
            body.force.x += body.mass * gravity.x * gravityScale;
        }
    };

    /**
     * Applys `Body.update` to all given `bodies`.
     * @method updateAll
     * @private
     * @param {body[]} bodies
     * @param {number} deltaTime 
     * The amount of time elapsed between updates
     * @param {number} timeScale
     * @param {number} correction 
     * The Verlet correction factor (deltaTime / lastDeltaTime)
     * @param {bounds} worldBounds
     */
    var _bodiesUpdate = function(bodies, deltaTime, timeScale, correction, worldBounds) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            Body.update(body, deltaTime, timeScale, correction);
        }
    };

    /**
     * An alias for `Runner.run`, see `Matter.Runner` for more information.
     * @method run
     * @param {engine} engine
     */

    /**
    * Fired just before an update
    *
    * @event beforeUpdate
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after engine update and all collision events
    *
    * @event afterUpdate
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after engine update, provides a list of all pairs that have started to collide in the current tick (if any)
    *
    * @event collisionStart
    * @param {} event An event object
    * @param {} event.pairs List of affected pairs
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after engine update, provides a list of all pairs that are colliding in the current tick (if any)
    *
    * @event collisionActive
    * @param {} event An event object
    * @param {} event.pairs List of affected pairs
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after engine update, provides a list of all pairs that have ended collision in the current tick (if any)
    *
    * @event collisionEnd
    * @param {} event An event object
    * @param {} event.pairs List of affected pairs
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * An integer `Number` that specifies the number of position iterations to perform each update.
     * The higher the value, the higher quality the simulation will be at the expense of performance.
     *
     * @property positionIterations
     * @type number
     * @default 6
     */

    /**
     * An integer `Number` that specifies the number of velocity iterations to perform each update.
     * The higher the value, the higher quality the simulation will be at the expense of performance.
     *
     * @property velocityIterations
     * @type number
     * @default 4
     */

    /**
     * An integer `Number` that specifies the number of constraint iterations to perform each update.
     * The higher the value, the higher quality the simulation will be at the expense of performance.
     * The default value of `2` is usually very adequate.
     *
     * @property constraintIterations
     * @type number
     * @default 2
     */

    /**
     * A flag that specifies whether the engine should allow sleeping via the `Matter.Sleeping` module.
     * Sleeping can improve stability and performance, but often at the expense of accuracy.
     *
     * @property enableSleeping
     * @type boolean
     * @default false
     */

    /**
     * An `Object` containing properties regarding the timing systems of the engine. 
     *
     * @property timing
     * @type object
     */

    /**
     * A `Number` that specifies the global scaling factor of time for all bodies.
     * A value of `0` freezes the simulation.
     * A value of `0.1` gives a slow-motion effect.
     * A value of `1.2` gives a speed-up effect.
     *
     * @property timing.timeScale
     * @type number
     * @default 1
     */

    /**
     * A `Number` that specifies the current simulation-time in milliseconds starting from `0`. 
     * It is incremented on every `Engine.update` by the given `delta` argument. 
     *
     * @property timing.timestamp
     * @type number
     * @default 0
     */

    /**
     * An instance of a `Render` controller. The default value is a `Matter.Render` instance created by `Engine.create`.
     * One may also develop a custom renderer module based on `Matter.Render` and pass an instance of it to `Engine.create` via `options.render`.
     *
     * A minimal custom renderer object must define at least three functions: `create`, `clear` and `world` (see `Matter.Render`).
     * It is also possible to instead pass the _module_ reference via `options.render.controller` and `Engine.create` will instantiate one for you.
     *
     * @property render
     * @type render
     * @deprecated see Demo.js for an example of creating a renderer
     * @default a Matter.Render instance
     */

    /**
     * An instance of a broadphase controller. The default value is a `Matter.Grid` instance created by `Engine.create`.
     *
     * @property broadphase
     * @type grid
     * @default a Matter.Grid instance
     */

    /**
     * A `World` composite object that will contain all simulated bodies and constraints.
     *
     * @property world
     * @type world
     * @default a Matter.World instance
     */

})();

},{"../body/Body":4,"../body/Composite":5,"../body/World":6,"../collision/Grid":9,"../collision/Pairs":11,"../collision/Resolver":13,"../constraint/Constraint":15,"../render/Render":32,"./Common":17,"./Events":19,"./Metrics":20,"./Sleeping":23}],19:[function(require,module,exports){
/**
* The `Matter.Events` module contains methods to fire and listen to events on other objects.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Events
*/

var Events = {};

module.exports = Events;

var Common = require('./Common');

(function() {

    /**
     * Subscribes a callback function to the given object's `eventName`.
     * @method on
     * @param {} object
     * @param {string} eventNames
     * @param {function} callback
     */
    Events.on = function(object, eventNames, callback) {
        var names = eventNames.split(' '),
            name;

        for (var i = 0; i < names.length; i++) {
            name = names[i];
            object.events = object.events || {};
            object.events[name] = object.events[name] || [];
            object.events[name].push(callback);
        }

        return callback;
    };

    /**
     * Removes the given event callback. If no callback, clears all callbacks in `eventNames`. If no `eventNames`, clears all events.
     * @method off
     * @param {} object
     * @param {string} eventNames
     * @param {function} callback
     */
    Events.off = function(object, eventNames, callback) {
        if (!eventNames) {
            object.events = {};
            return;
        }

        // handle Events.off(object, callback)
        if (typeof eventNames === 'function') {
            callback = eventNames;
            eventNames = Common.keys(object.events).join(' ');
        }

        var names = eventNames.split(' ');

        for (var i = 0; i < names.length; i++) {
            var callbacks = object.events[names[i]],
                newCallbacks = [];

            if (callback && callbacks) {
                for (var j = 0; j < callbacks.length; j++) {
                    if (callbacks[j] !== callback)
                        newCallbacks.push(callbacks[j]);
                }
            }

            object.events[names[i]] = newCallbacks;
        }
    };

    /**
     * Fires all the callbacks subscribed to the given object's `eventName`, in the order they subscribed, if any.
     * @method trigger
     * @param {} object
     * @param {string} eventNames
     * @param {} event
     */
    Events.trigger = function(object, eventNames, event) {
        var names,
            name,
            callbacks,
            eventClone;

        if (object.events) {
            if (!event)
                event = {};

            names = eventNames.split(' ');

            for (var i = 0; i < names.length; i++) {
                name = names[i];
                callbacks = object.events[name];

                if (callbacks) {
                    eventClone = Common.clone(event, false);
                    eventClone.name = name;
                    eventClone.source = object;

                    for (var j = 0; j < callbacks.length; j++) {
                        callbacks[j].apply(object, [eventClone]);
                    }
                }
            }
        }
    };

})();

},{"./Common":17}],20:[function(require,module,exports){
// @if DEBUG
/**
* _Internal Class_, not generally used outside of the engine's internals.
*
*/

var Metrics = {};

module.exports = Metrics;

var Composite = require('../body/Composite');
var Common = require('./Common');

(function() {

    /**
     * Creates a new metrics.
     * @method create
     * @private
     * @return {metrics} A new metrics
     */
    Metrics.create = function(options) {
        var defaults = {
            extended: false,
            narrowDetections: 0,
            narrowphaseTests: 0,
            narrowReuse: 0,
            narrowReuseCount: 0,
            midphaseTests: 0,
            broadphaseTests: 0,
            narrowEff: 0.0001,
            midEff: 0.0001,
            broadEff: 0.0001,
            collisions: 0,
            buckets: 0,
            bodies: 0,
            pairs: 0
        };

        return Common.extend(defaults, false, options);
    };

    /**
     * Resets metrics.
     * @method reset
     * @private
     * @param {metrics} metrics
     */
    Metrics.reset = function(metrics) {
        if (metrics.extended) {
            metrics.narrowDetections = 0;
            metrics.narrowphaseTests = 0;
            metrics.narrowReuse = 0;
            metrics.narrowReuseCount = 0;
            metrics.midphaseTests = 0;
            metrics.broadphaseTests = 0;
            metrics.narrowEff = 0;
            metrics.midEff = 0;
            metrics.broadEff = 0;
            metrics.collisions = 0;
            metrics.buckets = 0;
            metrics.pairs = 0;
            metrics.bodies = 0;
        }
    };

    /**
     * Updates metrics.
     * @method update
     * @private
     * @param {metrics} metrics
     * @param {engine} engine
     */
    Metrics.update = function(metrics, engine) {
        if (metrics.extended) {
            var world = engine.world,
                bodies = Composite.allBodies(world);

            metrics.collisions = metrics.narrowDetections;
            metrics.pairs = engine.pairs.list.length;
            metrics.bodies = bodies.length;
            metrics.midEff = (metrics.narrowDetections / (metrics.midphaseTests || 1)).toFixed(2);
            metrics.narrowEff = (metrics.narrowDetections / (metrics.narrowphaseTests || 1)).toFixed(2);
            metrics.broadEff = (1 - (metrics.broadphaseTests / (bodies.length || 1))).toFixed(2);
            metrics.narrowReuse = (metrics.narrowReuseCount / (metrics.narrowphaseTests || 1)).toFixed(2);
            //var broadphase = engine.broadphase[engine.broadphase.current];
            //if (broadphase.instance)
            //    metrics.buckets = Common.keys(broadphase.instance.buckets).length;
        }
    };

})();
// @endif

},{"../body/Composite":5,"./Common":17}],21:[function(require,module,exports){
/**
* The `Matter.Mouse` module contains methods for creating and manipulating mouse inputs.
*
* @class Mouse
*/

var Mouse = {};

module.exports = Mouse;

var Common = require('../core/Common');

(function() {

    /**
     * Creates a mouse input.
     * @method create
     * @param {HTMLElement} element
     * @return {mouse} A new mouse
     */
    Mouse.create = function(element) {
        var mouse = {};

        if (!element) {
            Common.log('Mouse.create: element was undefined, defaulting to document.body', 'warn');
        }
        
        mouse.element = element || document.body;
        mouse.absolute = { x: 0, y: 0 };
        mouse.position = { x: 0, y: 0 };
        mouse.mousedownPosition = { x: 0, y: 0 };
        mouse.mouseupPosition = { x: 0, y: 0 };
        mouse.offset = { x: 0, y: 0 };
        mouse.scale = { x: 1, y: 1 };
        mouse.wheelDelta = 0;
        mouse.button = -1;
        mouse.pixelRatio = mouse.element.getAttribute('data-pixel-ratio') || 1;

        mouse.sourceEvents = {
            mousemove: null,
            mousedown: null,
            mouseup: null,
            mousewheel: null
        };
        
        mouse.mousemove = function(event) { 
            var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                mouse.button = 0;
                event.preventDefault();
            }

            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.sourceEvents.mousemove = event;
        };
        
        mouse.mousedown = function(event) {
            var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                mouse.button = 0;
                event.preventDefault();
            } else {
                mouse.button = event.button;
            }

            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.mousedownPosition.x = mouse.position.x;
            mouse.mousedownPosition.y = mouse.position.y;
            mouse.sourceEvents.mousedown = event;
        };
        
        mouse.mouseup = function(event) {
            var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                event.preventDefault();
            }
            
            mouse.button = -1;
            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.mouseupPosition.x = mouse.position.x;
            mouse.mouseupPosition.y = mouse.position.y;
            mouse.sourceEvents.mouseup = event;
        };

        mouse.mousewheel = function(event) {
            mouse.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
            event.preventDefault();
        };

        Mouse.setElement(mouse, mouse.element);

        return mouse;
    };

    /**
     * Sets the element the mouse is bound to (and relative to).
     * @method setElement
     * @param {mouse} mouse
     * @param {HTMLElement} element
     */
    Mouse.setElement = function(mouse, element) {
        mouse.element = element;

        element.addEventListener('mousemove', mouse.mousemove);
        element.addEventListener('mousedown', mouse.mousedown);
        element.addEventListener('mouseup', mouse.mouseup);
        
        element.addEventListener('mousewheel', mouse.mousewheel);
        element.addEventListener('DOMMouseScroll', mouse.mousewheel);

        element.addEventListener('touchmove', mouse.mousemove);
        element.addEventListener('touchstart', mouse.mousedown);
        element.addEventListener('touchend', mouse.mouseup);
    };

    /**
     * Clears all captured source events.
     * @method clearSourceEvents
     * @param {mouse} mouse
     */
    Mouse.clearSourceEvents = function(mouse) {
        mouse.sourceEvents.mousemove = null;
        mouse.sourceEvents.mousedown = null;
        mouse.sourceEvents.mouseup = null;
        mouse.sourceEvents.mousewheel = null;
        mouse.wheelDelta = 0;
    };

    /**
     * Sets the mouse position offset.
     * @method setOffset
     * @param {mouse} mouse
     * @param {vector} offset
     */
    Mouse.setOffset = function(mouse, offset) {
        mouse.offset.x = offset.x;
        mouse.offset.y = offset.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };

    /**
     * Sets the mouse position scale.
     * @method setScale
     * @param {mouse} mouse
     * @param {vector} scale
     */
    Mouse.setScale = function(mouse, scale) {
        mouse.scale.x = scale.x;
        mouse.scale.y = scale.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };
    
    /**
     * Gets the mouse position relative to an element given a screen pixel ratio.
     * @method _getRelativeMousePosition
     * @private
     * @param {} event
     * @param {} element
     * @param {number} pixelRatio
     * @return {}
     */
    var _getRelativeMousePosition = function(event, element, pixelRatio) {
        var elementBounds = element.getBoundingClientRect(),
            rootNode = (document.documentElement || document.body.parentNode || document.body),
            scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : rootNode.scrollLeft,
            scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : rootNode.scrollTop,
            touches = event.changedTouches,
            x, y;
        
        if (touches) {
            x = touches[0].pageX - elementBounds.left - scrollX;
            y = touches[0].pageY - elementBounds.top - scrollY;
        } else {
            x = event.pageX - elementBounds.left - scrollX;
            y = event.pageY - elementBounds.top - scrollY;
        }

        return { 
            x: x / (element.clientWidth / element.width * pixelRatio),
            y: y / (element.clientHeight / element.height * pixelRatio)
        };
    };

})();

},{"../core/Common":17}],22:[function(require,module,exports){
/**
* The `Matter.Runner` module is an optional utility which provides a game loop, 
* that handles continuously updating a `Matter.Engine` for you within a browser.
* It is intended for development and debugging purposes, but may also be suitable for simple games.
* If you are using your own game loop instead, then you do not need the `Matter.Runner` module.
* Instead just call `Engine.update(engine, delta)` in your own loop.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Runner
*/

var Runner = {};

module.exports = Runner;

var Events = require('./Events');
var Engine = require('./Engine');
var Common = require('./Common');

(function() {

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame 
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    /**
     * Creates a new Runner. The options parameter is an object that specifies any properties you wish to override the defaults.
     * @method create
     * @param {} options
     */
    Runner.create = function(options) {
        var defaults = {
            fps: 60,
            correction: 1,
            deltaSampleSize: 60,
            counterTimestamp: 0,
            frameCounter: 0,
            deltaHistory: [],
            timePrev: null,
            timeScalePrev: 1,
            frameRequestId: null,
            isFixed: false,
            enabled: true
        };

        var runner = Common.extend(defaults, options);

        runner.delta = runner.delta || 1000 / runner.fps;
        runner.deltaMin = runner.deltaMin || 1000 / runner.fps;
        runner.deltaMax = runner.deltaMax || 1000 / (runner.fps * 0.5);
        runner.fps = 1000 / runner.delta;

        return runner;
    };

    /**
     * Continuously ticks a `Matter.Engine` by calling `Runner.tick` on the `requestAnimationFrame` event.
     * @method run
     * @param {engine} engine
     */
    Runner.run = function(runner, engine) {
        // create runner if engine is first argument
        if (typeof runner.positionIterations !== 'undefined') {
            engine = runner;
            runner = Runner.create();
        }

        (function render(time){
            runner.frameRequestId = _requestAnimationFrame(render);

            if (time && runner.enabled) {
                Runner.tick(runner, engine, time);
            }
        })();

        return runner;
    };

    /**
     * A game loop utility that updates the engine and renderer by one step (a 'tick').
     * Features delta smoothing, time correction and fixed or dynamic timing.
     * Triggers `beforeTick`, `tick` and `afterTick` events on the engine.
     * Consider just `Engine.update(engine, delta)` if you're using your own loop.
     * @method tick
     * @param {runner} runner
     * @param {engine} engine
     * @param {number} time
     */
    Runner.tick = function(runner, engine, time) {
        var timing = engine.timing,
            correction = 1,
            delta;

        // create an event object
        var event = {
            timestamp: timing.timestamp
        };

        Events.trigger(runner, 'beforeTick', event);
        Events.trigger(engine, 'beforeTick', event); // @deprecated

        if (runner.isFixed) {
            // fixed timestep
            delta = runner.delta;
        } else {
            // dynamic timestep based on wall clock between calls
            delta = (time - runner.timePrev) || runner.delta;
            runner.timePrev = time;

            // optimistically filter delta over a few frames, to improve stability
            runner.deltaHistory.push(delta);
            runner.deltaHistory = runner.deltaHistory.slice(-runner.deltaSampleSize);
            delta = Math.min.apply(null, runner.deltaHistory);
            
            // limit delta
            delta = delta < runner.deltaMin ? runner.deltaMin : delta;
            delta = delta > runner.deltaMax ? runner.deltaMax : delta;

            // correction for delta
            correction = delta / runner.delta;

            // update engine timing object
            runner.delta = delta;
        }

        // time correction for time scaling
        if (runner.timeScalePrev !== 0)
            correction *= timing.timeScale / runner.timeScalePrev;

        if (timing.timeScale === 0)
            correction = 0;

        runner.timeScalePrev = timing.timeScale;
        runner.correction = correction;

        // fps counter
        runner.frameCounter += 1;
        if (time - runner.counterTimestamp >= 1000) {
            runner.fps = runner.frameCounter * ((time - runner.counterTimestamp) / 1000);
            runner.counterTimestamp = time;
            runner.frameCounter = 0;
        }

        Events.trigger(runner, 'tick', event);
        Events.trigger(engine, 'tick', event); // @deprecated

        // if world has been modified, clear the render scene graph
        if (engine.world.isModified 
            && engine.render
            && engine.render.controller
            && engine.render.controller.clear) {
            engine.render.controller.clear(engine.render);
        }

        // update
        Events.trigger(runner, 'beforeUpdate', event);
        Engine.update(engine, delta, correction);
        Events.trigger(runner, 'afterUpdate', event);

        // render
        // @deprecated
        if (engine.render && engine.render.controller) {
            Events.trigger(runner, 'beforeRender', event);
            Events.trigger(engine, 'beforeRender', event); // @deprecated

            engine.render.controller.world(engine.render);

            Events.trigger(runner, 'afterRender', event);
            Events.trigger(engine, 'afterRender', event); // @deprecated
        }

        Events.trigger(runner, 'afterTick', event);
        Events.trigger(engine, 'afterTick', event); // @deprecated
    };

    /**
     * Ends execution of `Runner.run` on the given `runner`, by canceling the animation frame request event loop.
     * If you wish to only temporarily pause the engine, see `engine.enabled` instead.
     * @method stop
     * @param {runner} runner
     */
    Runner.stop = function(runner) {
        _cancelAnimationFrame(runner.frameRequestId);
    };

    /**
     * Alias for `Runner.run`.
     * @method start
     * @param {runner} runner
     * @param {engine} engine
     */
    Runner.start = function(runner, engine) {
        Runner.run(runner, engine);
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired at the start of a tick, before any updates to the engine or timing
    *
    * @event beforeTick
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after engine timing updated, but just before update
    *
    * @event tick
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired at the end of a tick, after engine update and after rendering
    *
    * @event afterTick
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired before update
    *
    * @event beforeUpdate
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after update
    *
    * @event afterUpdate
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired before rendering
    *
    * @event beforeRender
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    * @deprecated
    */

    /**
    * Fired after rendering
    *
    * @event afterRender
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    * @deprecated
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A flag that specifies whether the runner is running or not.
     *
     * @property enabled
     * @type boolean
     * @default true
     */

    /**
     * A `Boolean` that specifies if the runner should use a fixed timestep (otherwise it is variable).
     * If timing is fixed, then the apparent simulation speed will change depending on the frame rate (but behaviour will be deterministic).
     * If the timing is variable, then the apparent simulation speed will be constant (approximately, but at the cost of determininism).
     *
     * @property isFixed
     * @type boolean
     * @default false
     */

    /**
     * A `Number` that specifies the time step between updates in milliseconds.
     * If `engine.timing.isFixed` is set to `true`, then `delta` is fixed.
     * If it is `false`, then `delta` can dynamically change to maintain the correct apparent simulation speed.
     *
     * @property delta
     * @type number
     * @default 1000 / 60
     */

})();

},{"./Common":17,"./Engine":18,"./Events":19}],23:[function(require,module,exports){
/**
* The `Matter.Sleeping` module contains methods to manage the sleeping state of bodies.
*
* @class Sleeping
*/

var Sleeping = {};

module.exports = Sleeping;

var Events = require('./Events');

(function() {

    Sleeping._motionWakeThreshold = 0.18;
    Sleeping._motionSleepThreshold = 0.08;
    Sleeping._minBias = 0.9;

    /**
     * Puts bodies to sleep or wakes them up depending on their motion.
     * @method update
     * @param {body[]} bodies
     * @param {number} timeScale
     */
    Sleeping.update = function(bodies, timeScale) {
        var timeFactor = timeScale * timeScale * timeScale;

        // update bodies sleeping status
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;

            // wake up bodies if they have a force applied
            if (body.force.x !== 0 || body.force.y !== 0) {
                Sleeping.set(body, false);
                continue;
            }

            var minMotion = Math.min(body.motion, motion),
                maxMotion = Math.max(body.motion, motion);
        
            // biased average motion estimation between frames
            body.motion = Sleeping._minBias * minMotion + (1 - Sleeping._minBias) * maxMotion;
            
            if (body.sleepThreshold > 0 && body.motion < Sleeping._motionSleepThreshold * timeFactor) {
                body.sleepCounter += 1;
                
                if (body.sleepCounter >= body.sleepThreshold)
                    Sleeping.set(body, true);
            } else if (body.sleepCounter > 0) {
                body.sleepCounter -= 1;
            }
        }
    };

    /**
     * Given a set of colliding pairs, wakes the sleeping bodies involved.
     * @method afterCollisions
     * @param {pair[]} pairs
     * @param {number} timeScale
     */
    Sleeping.afterCollisions = function(pairs, timeScale) {
        var timeFactor = timeScale * timeScale * timeScale;

        // wake up bodies involved in collisions
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            
            // don't wake inactive pairs
            if (!pair.isActive)
                continue;

            var collision = pair.collision,
                bodyA = collision.bodyA.parent, 
                bodyB = collision.bodyB.parent;
        
            // don't wake if at least one body is static
            if ((bodyA.isSleeping && bodyB.isSleeping) || bodyA.isStatic || bodyB.isStatic)
                continue;
        
            if (bodyA.isSleeping || bodyB.isSleeping) {
                var sleepingBody = (bodyA.isSleeping && !bodyA.isStatic) ? bodyA : bodyB,
                    movingBody = sleepingBody === bodyA ? bodyB : bodyA;

                if (!sleepingBody.isStatic && movingBody.motion > Sleeping._motionWakeThreshold * timeFactor) {
                    Sleeping.set(sleepingBody, false);
                }
            }
        }
    };
  
    /**
     * Set a body as sleeping or awake.
     * @method set
     * @param {body} body
     * @param {boolean} isSleeping
     */
    Sleeping.set = function(body, isSleeping) {
        var wasSleeping = body.isSleeping;

        if (isSleeping) {
            body.isSleeping = true;
            body.sleepCounter = body.sleepThreshold;

            body.positionImpulse.x = 0;
            body.positionImpulse.y = 0;

            body.positionPrev.x = body.position.x;
            body.positionPrev.y = body.position.y;

            body.anglePrev = body.angle;
            body.speed = 0;
            body.angularSpeed = 0;
            body.motion = 0;

            if (!wasSleeping) {
                Events.trigger(body, 'sleepStart');
            }
        } else {
            body.isSleeping = false;
            body.sleepCounter = 0;

            if (wasSleeping) {
                Events.trigger(body, 'sleepEnd');
            }
        }
    };

})();

},{"./Events":19}],24:[function(require,module,exports){
/**
* The `Matter.Bodies` module contains factory methods for creating rigid body models 
* with commonly used body configurations (such as rectangles, circles and other polygons).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Bodies
*/

// TODO: true circle bodies

var Bodies = {};

module.exports = Bodies;

var Vertices = require('../geometry/Vertices');
var Common = require('../core/Common');
var Body = require('../body/Body');
var Bounds = require('../geometry/Bounds');
var Vector = require('../geometry/Vector');

(function() {

    /**
     * Creates a new rigid body model with a rectangle hull. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method rectangle
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {object} [options]
     * @return {body} A new rectangle body
     */
    Bodies.rectangle = function(x, y, width, height, options) {
        options = options || {};

        var rectangle = { 
            label: 'Rectangle Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath('L 0 0 L ' + width + ' 0 L ' + width + ' ' + height + ' L 0 ' + height)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            rectangle.vertices = Vertices.chamfer(rectangle.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, rectangle, options));
    };
    
    /**
     * Creates a new rigid body model with a trapezoid hull. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method trapezoid
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} slope
     * @param {object} [options]
     * @return {body} A new trapezoid body
     */
    Bodies.trapezoid = function(x, y, width, height, slope, options) {
        options = options || {};

        slope *= 0.5;
        var roof = (1 - (slope * 2)) * width;
        
        var x1 = width * slope,
            x2 = x1 + roof,
            x3 = x2 + x1,
            verticesPath;

        if (slope < 0.5) {
            verticesPath = 'L 0 0 L ' + x1 + ' ' + (-height) + ' L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
        } else {
            verticesPath = 'L 0 0 L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
        }

        var trapezoid = { 
            label: 'Trapezoid Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(verticesPath)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            trapezoid.vertices = Vertices.chamfer(trapezoid.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, trapezoid, options));
    };

    /**
     * Creates a new rigid body model with a circle hull. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method circle
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {object} [options]
     * @param {number} [maxSides]
     * @return {body} A new circle body
     */
    Bodies.circle = function(x, y, radius, options, maxSides) {
        options = options || {};

        var circle = {
            label: 'Circle Body',
            circleRadius: radius
        };
        
        // approximate circles with polygons until true circles implemented in SAT
        maxSides = maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

        // optimisation: always use even number of sides (half the number of unique axes)
        if (sides % 2 === 1)
            sides += 1;

        return Bodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
    };

    /**
     * Creates a new rigid body model with a regular polygon hull with the given number of sides. 
     * The options parameter is an object that specifies any properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method polygon
     * @param {number} x
     * @param {number} y
     * @param {number} sides
     * @param {number} radius
     * @param {object} [options]
     * @return {body} A new regular polygon body
     */
    Bodies.polygon = function(x, y, sides, radius, options) {
        options = options || {};

        if (sides < 3)
            return Bodies.circle(x, y, radius, options);

        var theta = 2 * Math.PI / sides,
            path = '',
            offset = theta * 0.5;

        for (var i = 0; i < sides; i += 1) {
            var angle = offset + (i * theta),
                xx = Math.cos(angle) * radius,
                yy = Math.sin(angle) * radius;

            path += 'L ' + xx.toFixed(3) + ' ' + yy.toFixed(3) + ' ';
        }

        var polygon = { 
            label: 'Polygon Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(path)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, polygon, options));
    };

    /**
     * Creates a body using the supplied vertices (or an array containing multiple sets of vertices).
     * If the vertices are convex, they will pass through as supplied.
     * Otherwise if the vertices are concave, they will be decomposed if [poly-decomp.js](https://github.com/schteppe/poly-decomp.js) is available.
     * Note that this process is not guaranteed to support complex sets of vertices (e.g. those with holes may fail).
     * By default the decomposition will discard collinear edges (to improve performance).
     * It can also optionally discard any parts that have an area less than `minimumArea`.
     * If the vertices can not be decomposed, the result will fall back to using the convex hull.
     * The options parameter is an object that specifies any `Matter.Body` properties you wish to override the defaults.
     * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
     * @method fromVertices
     * @param {number} x
     * @param {number} y
     * @param [[vector]] vertexSets
     * @param {object} [options]
     * @param {bool} [flagInternal=false]
     * @param {number} [removeCollinear=0.01]
     * @param {number} [minimumArea=10]
     * @return {body}
     */
    Bodies.fromVertices = function(x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea) {
        var body,
            parts,
            isConvex,
            vertices,
            i,
            j,
            k,
            v,
            z;

        options = options || {};
        parts = [];

        flagInternal = typeof flagInternal !== 'undefined' ? flagInternal : false;
        removeCollinear = typeof removeCollinear !== 'undefined' ? removeCollinear : 0.01;
        minimumArea = typeof minimumArea !== 'undefined' ? minimumArea : 10;

        if (!window.decomp) {
            Common.log('Bodies.fromVertices: poly-decomp.js required. Could not decompose vertices. Fallback to convex hull.', 'warn');
        }

        // ensure vertexSets is an array of arrays
        if (!Common.isArray(vertexSets[0])) {
            vertexSets = [vertexSets];
        }

        for (v = 0; v < vertexSets.length; v += 1) {
            vertices = vertexSets[v];
            isConvex = Vertices.isConvex(vertices);

            if (isConvex || !window.decomp) {
                if (isConvex) {
                    vertices = Vertices.clockwiseSort(vertices);
                } else {
                    // fallback to convex hull when decomposition is not possible
                    vertices = Vertices.hull(vertices);
                }

                parts.push({
                    position: { x: x, y: y },
                    vertices: vertices
                });
            } else {
                // initialise a decomposition
                var concave = new decomp.Polygon();
                for (i = 0; i < vertices.length; i++) {
                    concave.vertices.push([vertices[i].x, vertices[i].y]);
                }

                // vertices are concave and simple, we can decompose into parts
                concave.makeCCW();
                if (removeCollinear !== false)
                    concave.removeCollinearPoints(removeCollinear);

                // use the quick decomposition algorithm (Bayazit)
                var decomposed = concave.quickDecomp();

                // for each decomposed chunk
                for (i = 0; i < decomposed.length; i++) {
                    var chunk = decomposed[i],
                        chunkVertices = [];

                    // convert vertices into the correct structure
                    for (j = 0; j < chunk.vertices.length; j++) {
                        chunkVertices.push({ x: chunk.vertices[j][0], y: chunk.vertices[j][1] });
                    }

                    // skip small chunks
                    if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea)
                        continue;

                    // create a compound part
                    parts.push({
                        position: Vertices.centre(chunkVertices),
                        vertices: chunkVertices
                    });
                }
            }
        }

        // create body parts
        for (i = 0; i < parts.length; i++) {
            parts[i] = Body.create(Common.extend(parts[i], options));
        }

        // flag internal edges (coincident part edges)
        if (flagInternal) {
            var coincident_max_dist = 5;

            for (i = 0; i < parts.length; i++) {
                var partA = parts[i];

                for (j = i + 1; j < parts.length; j++) {
                    var partB = parts[j];

                    if (Bounds.overlaps(partA.bounds, partB.bounds)) {
                        var pav = partA.vertices,
                            pbv = partB.vertices;

                        // iterate vertices of both parts
                        for (k = 0; k < partA.vertices.length; k++) {
                            for (z = 0; z < partB.vertices.length; z++) {
                                // find distances between the vertices
                                var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])),
                                    db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));

                                // if both vertices are very close, consider the edge concident (internal)
                                if (da < coincident_max_dist && db < coincident_max_dist) {
                                    pav[k].isInternal = true;
                                    pbv[z].isInternal = true;
                                }
                            }
                        }

                    }
                }
            }
        }

        if (parts.length > 1) {
            // create the parent body to be returned, that contains generated compound parts
            body = Body.create(Common.extend({ parts: parts.slice(0) }, options));
            Body.setPosition(body, { x: x, y: y });

            return body;
        } else {
            return parts[0];
        }
    };

})();
},{"../body/Body":4,"../core/Common":17,"../geometry/Bounds":27,"../geometry/Vector":29,"../geometry/Vertices":30}],25:[function(require,module,exports){
/**
* The `Matter.Composites` module contains factory methods for creating composite bodies
* with commonly used configurations (such as stacks and chains).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composites
*/

var Composites = {};

module.exports = Composites;

var Composite = require('../body/Composite');
var Constraint = require('../constraint/Constraint');
var Common = require('../core/Common');
var Body = require('../body/Body');
var Bodies = require('./Bodies');

(function() {

    /**
     * Create a new composite containing bodies created in the callback in a grid arrangement.
     * This function uses the body's bounds to prevent overlaps.
     * @method stack
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns
     * @param {number} rows
     * @param {number} columnGap
     * @param {number} rowGap
     * @param {function} callback
     * @return {composite} A new composite containing objects created in the callback
     */
    Composites.stack = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
        var stack = Composite.create({ label: 'Stack' }),
            x = xx,
            y = yy,
            lastBody,
            i = 0;

        for (var row = 0; row < rows; row++) {
            var maxHeight = 0;
            
            for (var column = 0; column < columns; column++) {
                var body = callback(x, y, column, row, lastBody, i);
                    
                if (body) {
                    var bodyHeight = body.bounds.max.y - body.bounds.min.y,
                        bodyWidth = body.bounds.max.x - body.bounds.min.x; 

                    if (bodyHeight > maxHeight)
                        maxHeight = bodyHeight;
                    
                    Body.translate(body, { x: bodyWidth * 0.5, y: bodyHeight * 0.5 });

                    x = body.bounds.max.x + columnGap;

                    Composite.addBody(stack, body);
                    
                    lastBody = body;
                    i += 1;
                } else {
                    x += columnGap;
                }
            }
            
            y += maxHeight + rowGap;
            x = xx;
        }

        return stack;
    };
    
    /**
     * Chains all bodies in the given composite together using constraints.
     * @method chain
     * @param {composite} composite
     * @param {number} xOffsetA
     * @param {number} yOffsetA
     * @param {number} xOffsetB
     * @param {number} yOffsetB
     * @param {object} options
     * @return {composite} A new composite containing objects chained together with constraints
     */
    Composites.chain = function(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
        var bodies = composite.bodies;
        
        for (var i = 1; i < bodies.length; i++) {
            var bodyA = bodies[i - 1],
                bodyB = bodies[i],
                bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y,
                bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x, 
                bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y,
                bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
        
            var defaults = {
                bodyA: bodyA,
                pointA: { x: bodyAWidth * xOffsetA, y: bodyAHeight * yOffsetA },
                bodyB: bodyB,
                pointB: { x: bodyBWidth * xOffsetB, y: bodyBHeight * yOffsetB }
            };
            
            var constraint = Common.extend(defaults, options);
        
            Composite.addConstraint(composite, Constraint.create(constraint));
        }

        composite.label += ' Chain';
        
        return composite;
    };

    /**
     * Connects bodies in the composite with constraints in a grid pattern, with optional cross braces.
     * @method mesh
     * @param {composite} composite
     * @param {number} columns
     * @param {number} rows
     * @param {boolean} crossBrace
     * @param {object} options
     * @return {composite} The composite containing objects meshed together with constraints
     */
    Composites.mesh = function(composite, columns, rows, crossBrace, options) {
        var bodies = composite.bodies,
            row,
            col,
            bodyA,
            bodyB,
            bodyC;
        
        for (row = 0; row < rows; row++) {
            for (col = 1; col < columns; col++) {
                bodyA = bodies[(col - 1) + (row * columns)];
                bodyB = bodies[col + (row * columns)];
                Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));
            }

            if (row > 0) {
                for (col = 0; col < columns; col++) {
                    bodyA = bodies[col + ((row - 1) * columns)];
                    bodyB = bodies[col + (row * columns)];
                    Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));

                    if (crossBrace && col > 0) {
                        bodyC = bodies[(col - 1) + ((row - 1) * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
                    }

                    if (crossBrace && col < columns - 1) {
                        bodyC = bodies[(col + 1) + ((row - 1) * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
                    }
                }
            }
        }

        composite.label += ' Mesh';
        
        return composite;
    };
    
    /**
     * Create a new composite containing bodies created in the callback in a pyramid arrangement.
     * This function uses the body's bounds to prevent overlaps.
     * @method pyramid
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns
     * @param {number} rows
     * @param {number} columnGap
     * @param {number} rowGap
     * @param {function} callback
     * @return {composite} A new composite containing objects created in the callback
     */
    Composites.pyramid = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
        return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row, lastBody, i) {
            var actualRows = Math.min(rows, Math.ceil(columns / 2)),
                lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
            
            if (row > actualRows)
                return;
            
            // reverse row order
            row = actualRows - row;
            
            var start = row,
                end = columns - 1 - row;

            if (column < start || column > end)
                return;
            
            // retroactively fix the first body's position, since width was unknown
            if (i === 1) {
                Body.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
            }

            var xOffset = lastBody ? column * lastBodyWidth : 0;
            
            return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
        });
    };

    /**
     * Creates a composite with a Newton's Cradle setup of bodies and constraints.
     * @method newtonsCradle
     * @param {number} xx
     * @param {number} yy
     * @param {number} number
     * @param {number} size
     * @param {number} length
     * @return {composite} A new composite newtonsCradle body
     */
    Composites.newtonsCradle = function(xx, yy, number, size, length) {
        var newtonsCradle = Composite.create({ label: 'Newtons Cradle' });

        for (var i = 0; i < number; i++) {
            var separation = 1.9,
                circle = Bodies.circle(xx + i * (size * separation), yy + length, size, 
                            { inertia: Infinity, restitution: 1, friction: 0, frictionAir: 0.0001, slop: 1 }),
                constraint = Constraint.create({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });

            Composite.addBody(newtonsCradle, circle);
            Composite.addConstraint(newtonsCradle, constraint);
        }

        return newtonsCradle;
    };
    
    /**
     * Creates a composite with simple car setup of bodies and constraints.
     * @method car
     * @param {number} xx
     * @param {number} yy
     * @param {number} width
     * @param {number} height
     * @param {number} wheelSize
     * @return {composite} A new composite car body
     */
    Composites.car = function(xx, yy, width, height, wheelSize) {
        var group = Body.nextGroup(true),
            wheelBase = -20,
            wheelAOffset = -width * 0.5 + wheelBase,
            wheelBOffset = width * 0.5 - wheelBase,
            wheelYOffset = 0;
    
        var car = Composite.create({ label: 'Car' }),
            body = Bodies.trapezoid(xx, yy, width, height, 0.3, { 
                collisionFilter: {
                    group: group
                },
                friction: 0.01,
                chamfer: {
                    radius: 10
                }
            });
    
        var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, { 
            collisionFilter: {
                group: group
            },
            friction: 0.8,
            density: 0.01
        });
                    
        var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, { 
            collisionFilter: {
                group: group
            },
            friction: 0.8,
            density: 0.01
        });
                    
        var axelA = Constraint.create({
            bodyA: body,
            pointA: { x: wheelAOffset, y: wheelYOffset },
            bodyB: wheelA,
            stiffness: 0.2
        });
                        
        var axelB = Constraint.create({
            bodyA: body,
            pointA: { x: wheelBOffset, y: wheelYOffset },
            bodyB: wheelB,
            stiffness: 0.2
        });
        
        Composite.addBody(car, body);
        Composite.addBody(car, wheelA);
        Composite.addBody(car, wheelB);
        Composite.addConstraint(car, axelA);
        Composite.addConstraint(car, axelB);

        return car;
    };

    /**
     * Creates a simple soft body like object.
     * @method softBody
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns
     * @param {number} rows
     * @param {number} columnGap
     * @param {number} rowGap
     * @param {boolean} crossBrace
     * @param {number} particleRadius
     * @param {} particleOptions
     * @param {} constraintOptions
     * @return {composite} A new composite softBody
     */
    Composites.softBody = function(xx, yy, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
        particleOptions = Common.extend({ inertia: Infinity }, particleOptions);
        constraintOptions = Common.extend({ stiffness: 0.4 }, constraintOptions);

        var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y) {
            return Bodies.circle(x, y, particleRadius, particleOptions);
        });

        Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);

        softBody.label = 'Soft Body';

        return softBody;
    };

})();

},{"../body/Body":4,"../body/Composite":5,"../constraint/Constraint":15,"../core/Common":17,"./Bodies":24}],26:[function(require,module,exports){
/**
* The `Matter.Axes` module contains methods for creating and manipulating sets of axes.
*
* @class Axes
*/

var Axes = {};

module.exports = Axes;

var Vector = require('../geometry/Vector');
var Common = require('../core/Common');

(function() {

    /**
     * Creates a new set of axes from the given vertices.
     * @method fromVertices
     * @param {vertices} vertices
     * @return {axes} A new axes from the given vertices
     */
    Axes.fromVertices = function(vertices) {
        var axes = {};

        // find the unique axes, using edge normal gradients
        for (var i = 0; i < vertices.length; i++) {
            var j = (i + 1) % vertices.length, 
                normal = Vector.normalise({ 
                    x: vertices[j].y - vertices[i].y, 
                    y: vertices[i].x - vertices[j].x
                }),
                gradient = (normal.y === 0) ? Infinity : (normal.x / normal.y);
            
            // limit precision
            gradient = gradient.toFixed(3).toString();
            axes[gradient] = normal;
        }

        return Common.values(axes);
    };

    /**
     * Rotates a set of axes by the given angle.
     * @method rotate
     * @param {axes} axes
     * @param {number} angle
     */
    Axes.rotate = function(axes, angle) {
        if (angle === 0)
            return;
        
        var cos = Math.cos(angle),
            sin = Math.sin(angle);

        for (var i = 0; i < axes.length; i++) {
            var axis = axes[i],
                xx;
            xx = axis.x * cos - axis.y * sin;
            axis.y = axis.x * sin + axis.y * cos;
            axis.x = xx;
        }
    };

})();

},{"../core/Common":17,"../geometry/Vector":29}],27:[function(require,module,exports){
/**
* The `Matter.Bounds` module contains methods for creating and manipulating axis-aligned bounding boxes (AABB).
*
* @class Bounds
*/

var Bounds = {};

module.exports = Bounds;

(function() {

    /**
     * Creates a new axis-aligned bounding box (AABB) for the given vertices.
     * @method create
     * @param {vertices} vertices
     * @return {bounds} A new bounds object
     */
    Bounds.create = function(vertices) {
        var bounds = { 
            min: { x: 0, y: 0 }, 
            max: { x: 0, y: 0 }
        };

        if (vertices)
            Bounds.update(bounds, vertices);
        
        return bounds;
    };

    /**
     * Updates bounds using the given vertices and extends the bounds given a velocity.
     * @method update
     * @param {bounds} bounds
     * @param {vertices} vertices
     * @param {vector} velocity
     */
    Bounds.update = function(bounds, vertices, velocity) {
        bounds.min.x = Infinity;
        bounds.max.x = -Infinity;
        bounds.min.y = Infinity;
        bounds.max.y = -Infinity;

        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
            if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
            if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
            if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
        }
        
        if (velocity) {
            if (velocity.x > 0) {
                bounds.max.x += velocity.x;
            } else {
                bounds.min.x += velocity.x;
            }
            
            if (velocity.y > 0) {
                bounds.max.y += velocity.y;
            } else {
                bounds.min.y += velocity.y;
            }
        }
    };

    /**
     * Returns true if the bounds contains the given point.
     * @method contains
     * @param {bounds} bounds
     * @param {vector} point
     * @return {boolean} True if the bounds contain the point, otherwise false
     */
    Bounds.contains = function(bounds, point) {
        return point.x >= bounds.min.x && point.x <= bounds.max.x 
               && point.y >= bounds.min.y && point.y <= bounds.max.y;
    };

    /**
     * Returns true if the two bounds intersect.
     * @method overlaps
     * @param {bounds} boundsA
     * @param {bounds} boundsB
     * @return {boolean} True if the bounds overlap, otherwise false
     */
    Bounds.overlaps = function(boundsA, boundsB) {
        return (boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x
                && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y);
    };

    /**
     * Translates the bounds by the given vector.
     * @method translate
     * @param {bounds} bounds
     * @param {vector} vector
     */
    Bounds.translate = function(bounds, vector) {
        bounds.min.x += vector.x;
        bounds.max.x += vector.x;
        bounds.min.y += vector.y;
        bounds.max.y += vector.y;
    };

    /**
     * Shifts the bounds to the given position.
     * @method shift
     * @param {bounds} bounds
     * @param {vector} position
     */
    Bounds.shift = function(bounds, position) {
        var deltaX = bounds.max.x - bounds.min.x,
            deltaY = bounds.max.y - bounds.min.y;
            
        bounds.min.x = position.x;
        bounds.max.x = position.x + deltaX;
        bounds.min.y = position.y;
        bounds.max.y = position.y + deltaY;
    };
    
})();

},{}],28:[function(require,module,exports){
/**
* The `Matter.Svg` module contains methods for converting SVG images into an array of vector points.
*
* To use this module you also need the SVGPathSeg polyfill: https://github.com/progers/pathseg
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Svg
*/

var Svg = {};

module.exports = Svg;

var Bounds = require('../geometry/Bounds');

(function() {

    /**
     * Converts an SVG path into an array of vector points.
     * If the input path forms a concave shape, you must decompose the result into convex parts before use.
     * See `Bodies.fromVertices` which provides support for this.
     * Note that this function is not guaranteed to support complex paths (such as those with holes).
     * @method pathToVertices
     * @param {SVGPathElement} path
     * @param {Number} [sampleLength=15]
     * @return {Vector[]} points
     */
    Svg.pathToVertices = function(path, sampleLength) {
        // https://github.com/wout/svg.topoly.js/blob/master/svg.topoly.js
        var i, il, total, point, segment, segments, 
            segmentsQueue, lastSegment, 
            lastPoint, segmentIndex, points = [],
            lx, ly, length = 0, x = 0, y = 0;

        sampleLength = sampleLength || 15;

        var addPoint = function(px, py, pathSegType) {
            // all odd-numbered path types are relative except PATHSEG_CLOSEPATH (1)
            var isRelative = pathSegType % 2 === 1 && pathSegType > 1;

            // when the last point doesn't equal the current point add the current point
            if (!lastPoint || px != lastPoint.x || py != lastPoint.y) {
                if (lastPoint && isRelative) {
                    lx = lastPoint.x;
                    ly = lastPoint.y;
                } else {
                    lx = 0;
                    ly = 0;
                }

                var point = {
                    x: lx + px,
                    y: ly + py
                };

                // set last point
                if (isRelative || !lastPoint) {
                    lastPoint = point;
                }

                points.push(point);

                x = lx + px;
                y = ly + py;
            }
        };

        var addSegmentPoint = function(segment) {
            var segType = segment.pathSegTypeAsLetter.toUpperCase();

            // skip path ends
            if (segType === 'Z') 
                return;

            // map segment to x and y
            switch (segType) {

            case 'M':
            case 'L':
            case 'T':
            case 'C':
            case 'S':
            case 'Q':
                x = segment.x;
                y = segment.y;
                break;
            case 'H':
                x = segment.x;
                break;
            case 'V':
                y = segment.y;
                break;
            }

            addPoint(x, y, segment.pathSegType);
        };

        // ensure path is absolute
        _svgPathToAbsolute(path);

        // get total length
        total = path.getTotalLength();

        // queue segments
        segments = [];
        for (i = 0; i < path.pathSegList.numberOfItems; i += 1)
            segments.push(path.pathSegList.getItem(i));

        segmentsQueue = segments.concat();

        // sample through path
        while (length < total) {
            // get segment at position
            segmentIndex = path.getPathSegAtLength(length);
            segment = segments[segmentIndex];

            // new segment
            if (segment != lastSegment) {
                while (segmentsQueue.length && segmentsQueue[0] != segment)
                    addSegmentPoint(segmentsQueue.shift());

                lastSegment = segment;
            }

            // add points in between when curving
            // TODO: adaptive sampling
            switch (segment.pathSegTypeAsLetter.toUpperCase()) {

            case 'C':
            case 'T':
            case 'S':
            case 'Q':
            case 'A':
                point = path.getPointAtLength(length);
                addPoint(point.x, point.y, 0);
                break;

            }

            // increment by sample value
            length += sampleLength;
        }

        // add remaining segments not passed by sampling
        for (i = 0, il = segmentsQueue.length; i < il; ++i)
            addSegmentPoint(segmentsQueue[i]);

        return points;
    };

    var _svgPathToAbsolute = function(path) {
        // http://phrogz.net/convert-svg-path-to-all-absolute-commands
        var x0, y0, x1, y1, x2, y2, segs = path.pathSegList,
            x = 0, y = 0, len = segs.numberOfItems;

        for (var i = 0; i < len; ++i) {
            var seg = segs.getItem(i),
                segType = seg.pathSegTypeAsLetter;

            if (/[MLHVCSQTA]/.test(segType)) {
                if ('x' in seg) x = seg.x;
                if ('y' in seg) y = seg.y;
            } else {
                if ('x1' in seg) x1 = x + seg.x1;
                if ('x2' in seg) x2 = x + seg.x2;
                if ('y1' in seg) y1 = y + seg.y1;
                if ('y2' in seg) y2 = y + seg.y2;
                if ('x' in seg) x += seg.x;
                if ('y' in seg) y += seg.y;

                switch (segType) {

                case 'm':
                    segs.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
                    break;
                case 'l':
                    segs.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
                    break;
                case 'h':
                    segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
                    break;
                case 'v':
                    segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
                    break;
                case 'c':
                    segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
                    break;
                case 's':
                    segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
                    break;
                case 'q':
                    segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
                    break;
                case 't':
                    segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
                    break;
                case 'a':
                    segs.replaceItem(path.createSVGPathSegArcAbs(x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag), i);
                    break;
                case 'z':
                case 'Z':
                    x = x0;
                    y = y0;
                    break;

                }
            }

            if (segType == 'M' || segType == 'm') {
                x0 = x;
                y0 = y;
            }
        }
    };

})();
},{"../geometry/Bounds":27}],29:[function(require,module,exports){
/**
* The `Matter.Vector` module contains methods for creating and manipulating vectors.
* Vectors are the basis of all the geometry related operations in the engine.
* A `Matter.Vector` object is of the form `{ x: 0, y: 0 }`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vector
*/

// TODO: consider params for reusing vector objects

var Vector = {};

module.exports = Vector;

(function() {

    /**
     * Creates a new vector.
     * @method create
     * @param {number} x
     * @param {number} y
     * @return {vector} A new vector
     */
    Vector.create = function(x, y) {
        return { x: x || 0, y: y || 0 };
    };

    /**
     * Returns a new vector with `x` and `y` copied from the given `vector`.
     * @method clone
     * @param {vector} vector
     * @return {vector} A new cloned vector
     */
    Vector.clone = function(vector) {
        return { x: vector.x, y: vector.y };
    };

    /**
     * Returns the magnitude (length) of a vector.
     * @method magnitude
     * @param {vector} vector
     * @return {number} The magnitude of the vector
     */
    Vector.magnitude = function(vector) {
        return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
    };

    /**
     * Returns the magnitude (length) of a vector (therefore saving a `sqrt` operation).
     * @method magnitudeSquared
     * @param {vector} vector
     * @return {number} The squared magnitude of the vector
     */
    Vector.magnitudeSquared = function(vector) {
        return (vector.x * vector.x) + (vector.y * vector.y);
    };

    /**
     * Rotates the vector about (0, 0) by specified angle.
     * @method rotate
     * @param {vector} vector
     * @param {number} angle
     * @return {vector} A new vector rotated about (0, 0)
     */
    Vector.rotate = function(vector, angle) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        return {
            x: vector.x * cos - vector.y * sin,
            y: vector.x * sin + vector.y * cos
        };
    };

    /**
     * Rotates the vector about a specified point by specified angle.
     * @method rotateAbout
     * @param {vector} vector
     * @param {number} angle
     * @param {vector} point
     * @param {vector} [output]
     * @return {vector} A new vector rotated about the point
     */
    Vector.rotateAbout = function(vector, angle, point, output) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        if (!output) output = {};
        var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
        output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
        output.x = x;
        return output;
    };

    /**
     * Normalises a vector (such that its magnitude is `1`).
     * @method normalise
     * @param {vector} vector
     * @return {vector} A new vector normalised
     */
    Vector.normalise = function(vector) {
        var magnitude = Vector.magnitude(vector);
        if (magnitude === 0)
            return { x: 0, y: 0 };
        return { x: vector.x / magnitude, y: vector.y / magnitude };
    };

    /**
     * Returns the dot-product of two vectors.
     * @method dot
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @return {number} The dot product of the two vectors
     */
    Vector.dot = function(vectorA, vectorB) {
        return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);
    };

    /**
     * Returns the cross-product of two vectors.
     * @method cross
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @return {number} The cross product of the two vectors
     */
    Vector.cross = function(vectorA, vectorB) {
        return (vectorA.x * vectorB.y) - (vectorA.y * vectorB.x);
    };

    /**
     * Returns the cross-product of three vectors.
     * @method cross3
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @param {vector} vectorC
     * @return {number} The cross product of the three vectors
     */
    Vector.cross3 = function(vectorA, vectorB, vectorC) {
        return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
    };

    /**
     * Adds the two vectors.
     * @method add
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @param {vector} [output]
     * @return {vector} A new vector of vectorA and vectorB added
     */
    Vector.add = function(vectorA, vectorB, output) {
        if (!output) output = {};
        output.x = vectorA.x + vectorB.x;
        output.y = vectorA.y + vectorB.y;
        return output;
    };

    /**
     * Subtracts the two vectors.
     * @method sub
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @param {vector} [output]
     * @return {vector} A new vector of vectorA and vectorB subtracted
     */
    Vector.sub = function(vectorA, vectorB, output) {
        if (!output) output = {};
        output.x = vectorA.x - vectorB.x;
        output.y = vectorA.y - vectorB.y;
        return output;
    };

    /**
     * Multiplies a vector and a scalar.
     * @method mult
     * @param {vector} vector
     * @param {number} scalar
     * @return {vector} A new vector multiplied by scalar
     */
    Vector.mult = function(vector, scalar) {
        return { x: vector.x * scalar, y: vector.y * scalar };
    };

    /**
     * Divides a vector and a scalar.
     * @method div
     * @param {vector} vector
     * @param {number} scalar
     * @return {vector} A new vector divided by scalar
     */
    Vector.div = function(vector, scalar) {
        return { x: vector.x / scalar, y: vector.y / scalar };
    };

    /**
     * Returns the perpendicular vector. Set `negate` to true for the perpendicular in the opposite direction.
     * @method perp
     * @param {vector} vector
     * @param {bool} [negate=false]
     * @return {vector} The perpendicular vector
     */
    Vector.perp = function(vector, negate) {
        negate = negate === true ? -1 : 1;
        return { x: negate * -vector.y, y: negate * vector.x };
    };

    /**
     * Negates both components of a vector such that it points in the opposite direction.
     * @method neg
     * @param {vector} vector
     * @return {vector} The negated vector
     */
    Vector.neg = function(vector) {
        return { x: -vector.x, y: -vector.y };
    };

    /**
     * Returns the angle in radians between the two vectors relative to the x-axis.
     * @method angle
     * @param {vector} vectorA
     * @param {vector} vectorB
     * @return {number} The angle in radians
     */
    Vector.angle = function(vectorA, vectorB) {
        return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
    };

    /**
     * Temporary vector pool (not thread-safe).
     * @property _temp
     * @type {vector[]}
     * @private
     */
    Vector._temp = [Vector.create(), Vector.create(), 
                    Vector.create(), Vector.create(), 
                    Vector.create(), Vector.create()];

})();
},{}],30:[function(require,module,exports){
/**
* The `Matter.Vertices` module contains methods for creating and manipulating sets of vertices.
* A set of vertices is an array of `Matter.Vector` with additional indexing properties inserted by `Vertices.create`.
* A `Matter.Body` maintains a set of vertices to represent the shape of the object (its convex hull).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vertices
*/

var Vertices = {};

module.exports = Vertices;

var Vector = require('../geometry/Vector');
var Common = require('../core/Common');

(function() {

    /**
     * Creates a new set of `Matter.Body` compatible vertices.
     * The `points` argument accepts an array of `Matter.Vector` points orientated around the origin `(0, 0)`, for example:
     *
     *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
     *
     * The `Vertices.create` method returns a new array of vertices, which are similar to Matter.Vector objects,
     * but with some additional references required for efficient collision detection routines.
     *
     * Note that the `body` argument is not optional, a `Matter.Body` reference must be provided.
     *
     * @method create
     * @param {vector[]} points
     * @param {body} body
     */
    Vertices.create = function(points, body) {
        var vertices = [];

        for (var i = 0; i < points.length; i++) {
            var point = points[i],
                vertex = {
                    x: point.x,
                    y: point.y,
                    index: i,
                    body: body,
                    isInternal: false
                };

            vertices.push(vertex);
        }

        return vertices;
    };

    /**
     * Parses a string containing ordered x y pairs separated by spaces (and optionally commas), 
     * into a `Matter.Vertices` object for the given `Matter.Body`.
     * For parsing SVG paths, see `Svg.pathToVertices`.
     * @method fromPath
     * @param {string} path
     * @param {body} body
     * @return {vertices} vertices
     */
    Vertices.fromPath = function(path, body) {
        var pathPattern = /L?\s*([\-\d\.e]+)[\s,]*([\-\d\.e]+)*/ig,
            points = [];

        path.replace(pathPattern, function(match, x, y) {
            points.push({ x: parseFloat(x), y: parseFloat(y) });
        });

        return Vertices.create(points, body);
    };

    /**
     * Returns the centre (centroid) of the set of vertices.
     * @method centre
     * @param {vertices} vertices
     * @return {vector} The centre point
     */
    Vertices.centre = function(vertices) {
        var area = Vertices.area(vertices, true),
            centre = { x: 0, y: 0 },
            cross,
            temp,
            j;

        for (var i = 0; i < vertices.length; i++) {
            j = (i + 1) % vertices.length;
            cross = Vector.cross(vertices[i], vertices[j]);
            temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross);
            centre = Vector.add(centre, temp);
        }

        return Vector.div(centre, 6 * area);
    };

    /**
     * Returns the average (mean) of the set of vertices.
     * @method mean
     * @param {vertices} vertices
     * @return {vector} The average point
     */
    Vertices.mean = function(vertices) {
        var average = { x: 0, y: 0 };

        for (var i = 0; i < vertices.length; i++) {
            average.x += vertices[i].x;
            average.y += vertices[i].y;
        }

        return Vector.div(average, vertices.length);
    };

    /**
     * Returns the area of the set of vertices.
     * @method area
     * @param {vertices} vertices
     * @param {bool} signed
     * @return {number} The area
     */
    Vertices.area = function(vertices, signed) {
        var area = 0,
            j = vertices.length - 1;

        for (var i = 0; i < vertices.length; i++) {
            area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
            j = i;
        }

        if (signed)
            return area / 2;

        return Math.abs(area) / 2;
    };

    /**
     * Returns the moment of inertia (second moment of area) of the set of vertices given the total mass.
     * @method inertia
     * @param {vertices} vertices
     * @param {number} mass
     * @return {number} The polygon's moment of inertia
     */
    Vertices.inertia = function(vertices, mass) {
        var numerator = 0,
            denominator = 0,
            v = vertices,
            cross,
            j;

        // find the polygon's moment of inertia, using second moment of area
        // http://www.physicsforums.com/showthread.php?t=25293
        for (var n = 0; n < v.length; n++) {
            j = (n + 1) % v.length;
            cross = Math.abs(Vector.cross(v[j], v[n]));
            numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
            denominator += cross;
        }

        return (mass / 6) * (numerator / denominator);
    };

    /**
     * Translates the set of vertices in-place.
     * @method translate
     * @param {vertices} vertices
     * @param {vector} vector
     * @param {number} scalar
     */
    Vertices.translate = function(vertices, vector, scalar) {
        var i;
        if (scalar) {
            for (i = 0; i < vertices.length; i++) {
                vertices[i].x += vector.x * scalar;
                vertices[i].y += vector.y * scalar;
            }
        } else {
            for (i = 0; i < vertices.length; i++) {
                vertices[i].x += vector.x;
                vertices[i].y += vector.y;
            }
        }

        return vertices;
    };

    /**
     * Rotates the set of vertices in-place.
     * @method rotate
     * @param {vertices} vertices
     * @param {number} angle
     * @param {vector} point
     */
    Vertices.rotate = function(vertices, angle, point) {
        if (angle === 0)
            return;

        var cos = Math.cos(angle),
            sin = Math.sin(angle);

        for (var i = 0; i < vertices.length; i++) {
            var vertice = vertices[i],
                dx = vertice.x - point.x,
                dy = vertice.y - point.y;
                
            vertice.x = point.x + (dx * cos - dy * sin);
            vertice.y = point.y + (dx * sin + dy * cos);
        }

        return vertices;
    };

    /**
     * Returns `true` if the `point` is inside the set of `vertices`.
     * @method contains
     * @param {vertices} vertices
     * @param {vector} point
     * @return {boolean} True if the vertices contains point, otherwise false
     */
    Vertices.contains = function(vertices, point) {
        for (var i = 0; i < vertices.length; i++) {
            var vertice = vertices[i],
                nextVertice = vertices[(i + 1) % vertices.length];
            if ((point.x - vertice.x) * (nextVertice.y - vertice.y) + (point.y - vertice.y) * (vertice.x - nextVertice.x) > 0) {
                return false;
            }
        }

        return true;
    };

    /**
     * Scales the vertices from a point (default is centre) in-place.
     * @method scale
     * @param {vertices} vertices
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} point
     */
    Vertices.scale = function(vertices, scaleX, scaleY, point) {
        if (scaleX === 1 && scaleY === 1)
            return vertices;

        point = point || Vertices.centre(vertices);

        var vertex,
            delta;

        for (var i = 0; i < vertices.length; i++) {
            vertex = vertices[i];
            delta = Vector.sub(vertex, point);
            vertices[i].x = point.x + delta.x * scaleX;
            vertices[i].y = point.y + delta.y * scaleY;
        }

        return vertices;
    };

    /**
     * Chamfers a set of vertices by giving them rounded corners, returns a new set of vertices.
     * The radius parameter is a single number or an array to specify the radius for each vertex.
     * @method chamfer
     * @param {vertices} vertices
     * @param {number[]} radius
     * @param {number} quality
     * @param {number} qualityMin
     * @param {number} qualityMax
     */
    Vertices.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
        radius = radius || [8];

        if (!radius.length)
            radius = [radius];

        // quality defaults to -1, which is auto
        quality = (typeof quality !== 'undefined') ? quality : -1;
        qualityMin = qualityMin || 2;
        qualityMax = qualityMax || 14;

        var newVertices = [];

        for (var i = 0; i < vertices.length; i++) {
            var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1],
                vertex = vertices[i],
                nextVertex = vertices[(i + 1) % vertices.length],
                currentRadius = radius[i < radius.length ? i : radius.length - 1];

            if (currentRadius === 0) {
                newVertices.push(vertex);
                continue;
            }

            var prevNormal = Vector.normalise({ 
                x: vertex.y - prevVertex.y, 
                y: prevVertex.x - vertex.x
            });

            var nextNormal = Vector.normalise({ 
                x: nextVertex.y - vertex.y, 
                y: vertex.x - nextVertex.x
            });

            var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)),
                radiusVector = Vector.mult(Common.clone(prevNormal), currentRadius),
                midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), 0.5)),
                scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));

            var precision = quality;

            if (quality === -1) {
                // automatically decide precision
                precision = Math.pow(currentRadius, 0.32) * 1.75;
            }

            precision = Common.clamp(precision, qualityMin, qualityMax);

            // use an even value for precision, more likely to reduce axes by using symmetry
            if (precision % 2 === 1)
                precision += 1;

            var alpha = Math.acos(Vector.dot(prevNormal, nextNormal)),
                theta = alpha / precision;

            for (var j = 0; j < precision; j++) {
                newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
            }
        }

        return newVertices;
    };

    /**
     * Sorts the input vertices into clockwise order in place.
     * @method clockwiseSort
     * @param {vertices} vertices
     * @return {vertices} vertices
     */
    Vertices.clockwiseSort = function(vertices) {
        var centre = Vertices.mean(vertices);

        vertices.sort(function(vertexA, vertexB) {
            return Vector.angle(centre, vertexA) - Vector.angle(centre, vertexB);
        });

        return vertices;
    };

    /**
     * Returns true if the vertices form a convex shape (vertices must be in clockwise order).
     * @method isConvex
     * @param {vertices} vertices
     * @return {bool} `true` if the `vertices` are convex, `false` if not (or `null` if not computable).
     */
    Vertices.isConvex = function(vertices) {
        // http://paulbourke.net/geometry/polygonmesh/

        var flag = 0,
            n = vertices.length,
            i,
            j,
            k,
            z;

        if (n < 3)
            return null;

        for (i = 0; i < n; i++) {
            j = (i + 1) % n;
            k = (i + 2) % n;
            z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
            z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);

            if (z < 0) {
                flag |= 1;
            } else if (z > 0) {
                flag |= 2;
            }

            if (flag === 3) {
                return false;
            }
        }

        if (flag !== 0){
            return true;
        } else {
            return null;
        }
    };

    /**
     * Returns the convex hull of the input vertices as a new array of points.
     * @method hull
     * @param {vertices} vertices
     * @return [vertex] vertices
     */
    Vertices.hull = function(vertices) {
        // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain

        var upper = [],
            lower = [], 
            vertex,
            i;

        // sort vertices on x-axis (y-axis for ties)
        vertices = vertices.slice(0);
        vertices.sort(function(vertexA, vertexB) {
            var dx = vertexA.x - vertexB.x;
            return dx !== 0 ? dx : vertexA.y - vertexB.y;
        });

        // build lower hull
        for (i = 0; i < vertices.length; i++) {
            vertex = vertices[i];

            while (lower.length >= 2 
                   && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
                lower.pop();
            }

            lower.push(vertex);
        }

        // build upper hull
        for (i = vertices.length - 1; i >= 0; i--) {
            vertex = vertices[i];

            while (upper.length >= 2 
                   && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
                upper.pop();
            }

            upper.push(vertex);
        }

        // concatenation of the lower and upper hulls gives the convex hull
        // omit last points because they are repeated at the beginning of the other list
        upper.pop();
        lower.pop();

        return upper.concat(lower);
    };

})();

},{"../core/Common":17,"../geometry/Vector":29}],31:[function(require,module,exports){
var Matter = module.exports = {};
Matter.version = 'master';

Matter.Body = require('../body/Body');
Matter.Composite = require('../body/Composite');
Matter.World = require('../body/World');

Matter.Contact = require('../collision/Contact');
Matter.Detector = require('../collision/Detector');
Matter.Grid = require('../collision/Grid');
Matter.Pairs = require('../collision/Pairs');
Matter.Pair = require('../collision/Pair');
Matter.Query = require('../collision/Query');
Matter.Resolver = require('../collision/Resolver');
Matter.SAT = require('../collision/SAT');

Matter.Constraint = require('../constraint/Constraint');
Matter.MouseConstraint = require('../constraint/MouseConstraint');

Matter.Common = require('../core/Common');
Matter.Engine = require('../core/Engine');
Matter.Events = require('../core/Events');
Matter.Mouse = require('../core/Mouse');
Matter.Runner = require('../core/Runner');
Matter.Sleeping = require('../core/Sleeping');

// @if DEBUG
Matter.Metrics = require('../core/Metrics');
// @endif

Matter.Bodies = require('../factory/Bodies');
Matter.Composites = require('../factory/Composites');

Matter.Axes = require('../geometry/Axes');
Matter.Bounds = require('../geometry/Bounds');
Matter.Svg = require('../geometry/Svg');
Matter.Vector = require('../geometry/Vector');
Matter.Vertices = require('../geometry/Vertices');

Matter.Render = require('../render/Render');
Matter.RenderPixi = require('../render/RenderPixi');

// aliases

Matter.World.add = Matter.Composite.add;
Matter.World.remove = Matter.Composite.remove;
Matter.World.addComposite = Matter.Composite.addComposite;
Matter.World.addBody = Matter.Composite.addBody;
Matter.World.addConstraint = Matter.Composite.addConstraint;
Matter.World.clear = Matter.Composite.clear;
Matter.Engine.run = Matter.Runner.run;

},{"../body/Body":4,"../body/Composite":5,"../body/World":6,"../collision/Contact":7,"../collision/Detector":8,"../collision/Grid":9,"../collision/Pair":10,"../collision/Pairs":11,"../collision/Query":12,"../collision/Resolver":13,"../collision/SAT":14,"../constraint/Constraint":15,"../constraint/MouseConstraint":16,"../core/Common":17,"../core/Engine":18,"../core/Events":19,"../core/Metrics":20,"../core/Mouse":21,"../core/Runner":22,"../core/Sleeping":23,"../factory/Bodies":24,"../factory/Composites":25,"../geometry/Axes":26,"../geometry/Bounds":27,"../geometry/Svg":28,"../geometry/Vector":29,"../geometry/Vertices":30,"../render/Render":32,"../render/RenderPixi":33}],32:[function(require,module,exports){
/**
* The `Matter.Render` module is a simple HTML5 canvas based renderer for visualising instances of `Matter.Engine`.
* It is intended for development and debugging purposes, but may also be suitable for simple games.
* It includes a number of drawing options including wireframe, vector with support for sprites and viewports.
*
* @class Render
*/

var Render = {};

module.exports = Render;

var Common = require('../core/Common');
var Composite = require('../body/Composite');
var Bounds = require('../geometry/Bounds');
var Events = require('../core/Events');
var Grid = require('../collision/Grid');
var Vector = require('../geometry/Vector');

(function() {
    
    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame 
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    /**
     * Creates a new renderer. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {object} [options]
     * @return {render} A new renderer
     */
    Render.create = function(options) {
        var defaults = {
            controller: Render,
            engine: null,
            element: null,
            canvas: null,
            mouse: null,
            frameRequestId: null,
            options: {
                width: 800,
                height: 600,
                pixelRatio: 1,
                background: '#fafafa',
                wireframeBackground: '#222',
                hasBounds: !!options.bounds,
                enabled: true,
                wireframes: true,
                showSleeping: true,
                showDebug: false,
                showBroadphase: false,
                showBounds: false,
                showVelocity: false,
                showCollisions: false,
                showSeparations: false,
                showAxes: false,
                showPositions: false,
                showAngleIndicator: false,
                showIds: false,
                showShadows: false,
                showVertexNumbers: false,
                showConvexHulls: false,
                showInternalEdges: false,
                showMousePosition: false
            }
        };

        var render = Common.extend(defaults, options);

        if (render.canvas) {
            render.canvas.width = render.options.width || render.canvas.width;
            render.canvas.height = render.options.height || render.canvas.height;
        }

        render.mouse = options.mouse;
        render.engine = options.engine;
        render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
        render.context = render.canvas.getContext('2d');
        render.textures = {};

        render.bounds = render.bounds || { 
            min: { 
                x: 0,
                y: 0
            }, 
            max: { 
                x: render.canvas.width,
                y: render.canvas.height
            }
        };

        if (render.options.pixelRatio !== 1) {
            Render.setPixelRatio(render, render.options.pixelRatio);
        }

        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else {
            Common.log('Render.create: options.element was undefined, render.canvas was created but not appended', 'warn');
        }

        return render;
    };

    /**
     * Continuously updates the render canvas on the `requestAnimationFrame` event.
     * @method run
     * @param {render} render
     */
    Render.run = function(render) {
        (function loop(time){
            render.frameRequestId = _requestAnimationFrame(loop);
            Render.world(render);
        })();
    };

    /**
     * Ends execution of `Render.run` on the given `render`, by canceling the animation frame request event loop.
     * @method stop
     * @param {render} render
     */
    Render.stop = function(render) {
        _cancelAnimationFrame(render.frameRequestId);
    };

    /**
     * Sets the pixel ratio of the renderer and updates the canvas.
     * To automatically detect the correct ratio, pass the string `'auto'` for `pixelRatio`.
     * @method setPixelRatio
     * @param {render} render
     * @param {number} pixelRatio
     */
    Render.setPixelRatio = function(render, pixelRatio) {
        var options = render.options,
            canvas = render.canvas;

        if (pixelRatio === 'auto') {
            pixelRatio = _getPixelRatio(canvas);
        }

        options.pixelRatio = pixelRatio;
        canvas.setAttribute('data-pixel-ratio', pixelRatio);
        canvas.width = options.width * pixelRatio;
        canvas.height = options.height * pixelRatio;
        canvas.style.width = options.width + 'px';
        canvas.style.height = options.height + 'px';
        render.context.scale(pixelRatio, pixelRatio);
    };

    /**
     * Renders the given `engine`'s `Matter.World` object.
     * This is the entry point for all rendering and should be called every time the scene changes.
     * @method world
     * @param {render} render
     */
    Render.world = function(render) {
        var engine = render.engine,
            world = engine.world,
            canvas = render.canvas,
            context = render.context,
            options = render.options,
            allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world),
            background = options.wireframes ? options.wireframeBackground : options.background,
            bodies = [],
            constraints = [],
            i;

        var event = {
            timestamp: engine.timing.timestamp
        };

        Events.trigger(render, 'beforeRender', event);

        // apply background if it has changed
        if (render.currentBackground !== background)
            _applyBackground(render, background);

        // clear the canvas with a transparent fill, to allow the canvas background to show
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = "transparent";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = 'source-over';

        // handle bounds
        if (options.hasBounds) {
            var boundsWidth = render.bounds.max.x - render.bounds.min.x,
                boundsHeight = render.bounds.max.y - render.bounds.min.y,
                boundsScaleX = boundsWidth / options.width,
                boundsScaleY = boundsHeight / options.height;

            // filter out bodies that are not in view
            for (i = 0; i < allBodies.length; i++) {
                var body = allBodies[i];
                if (Bounds.overlaps(body.bounds, render.bounds))
                    bodies.push(body);
            }

            // filter out constraints that are not in view
            for (i = 0; i < allConstraints.length; i++) {
                var constraint = allConstraints[i],
                    bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB,
                    pointAWorld = constraint.pointA,
                    pointBWorld = constraint.pointB;

                if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

                if (!pointAWorld || !pointBWorld)
                    continue;

                if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
                    constraints.push(constraint);
            }

            // transform the view
            context.scale(1 / boundsScaleX, 1 / boundsScaleY);
            context.translate(-render.bounds.min.x, -render.bounds.min.y);
        } else {
            constraints = allConstraints;
            bodies = allBodies;
        }

        if (!options.wireframes || (engine.enableSleeping && options.showSleeping)) {
            // fully featured rendering of bodies
            Render.bodies(render, bodies, context);
        } else {
            if (options.showConvexHulls)
                Render.bodyConvexHulls(render, bodies, context);

            // optimised method for wireframes only
            Render.bodyWireframes(render, bodies, context);
        }

        if (options.showBounds)
            Render.bodyBounds(render, bodies, context);

        if (options.showAxes || options.showAngleIndicator)
            Render.bodyAxes(render, bodies, context);
        
        if (options.showPositions)
            Render.bodyPositions(render, bodies, context);

        if (options.showVelocity)
            Render.bodyVelocity(render, bodies, context);

        if (options.showIds)
            Render.bodyIds(render, bodies, context);

        if (options.showSeparations)
            Render.separations(render, engine.pairs.list, context);

        if (options.showCollisions)
            Render.collisions(render, engine.pairs.list, context);

        if (options.showVertexNumbers)
            Render.vertexNumbers(render, bodies, context);

        if (options.showMousePosition)
            Render.mousePosition(render, render.mouse, context);

        Render.constraints(constraints, context);

        if (options.showBroadphase && engine.broadphase.controller === Grid)
            Render.grid(render, engine.broadphase, context);

        if (options.showDebug)
            Render.debug(render, context);

        if (options.hasBounds) {
            // revert view transforms
            context.setTransform(options.pixelRatio, 0, 0, options.pixelRatio, 0, 0);
        }

        Events.trigger(render, 'afterRender', event);
    };

    /**
     * Description
     * @private
     * @method debug
     * @param {render} render
     * @param {RenderingContext} context
     */
    Render.debug = function(render, context) {
        var c = context,
            engine = render.engine,
            world = engine.world,
            metrics = engine.metrics,
            options = render.options,
            bodies = Composite.allBodies(world),
            space = "    ";

        if (engine.timing.timestamp - (render.debugTimestamp || 0) >= 500) {
            var text = "";

            if (metrics.timing) {
                text += "fps: " + Math.round(metrics.timing.fps) + space;
            }

            // @if DEBUG
            if (metrics.extended) {
                if (metrics.timing) {
                    text += "delta: " + metrics.timing.delta.toFixed(3) + space;
                    text += "correction: " + metrics.timing.correction.toFixed(3) + space;
                }

                text += "bodies: " + bodies.length + space;

                if (engine.broadphase.controller === Grid)
                    text += "buckets: " + metrics.buckets + space;

                text += "\n";

                text += "collisions: " + metrics.collisions + space;
                text += "pairs: " + engine.pairs.list.length + space;
                text += "broad: " + metrics.broadEff + space;
                text += "mid: " + metrics.midEff + space;
                text += "narrow: " + metrics.narrowEff + space;
            }
            // @endif            

            render.debugString = text;
            render.debugTimestamp = engine.timing.timestamp;
        }

        if (render.debugString) {
            c.font = "12px Arial";

            if (options.wireframes) {
                c.fillStyle = 'rgba(255,255,255,0.5)';
            } else {
                c.fillStyle = 'rgba(0,0,0,0.5)';
            }

            var split = render.debugString.split('\n');

            for (var i = 0; i < split.length; i++) {
                c.fillText(split[i], 50, 50 + i * 18);
            }
        }
    };

    /**
     * Description
     * @private
     * @method constraints
     * @param {constraint[]} constraints
     * @param {RenderingContext} context
     */
    Render.constraints = function(constraints, context) {
        var c = context;

        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];

            if (!constraint.render.visible || !constraint.pointA || !constraint.pointB)
                continue;

            var bodyA = constraint.bodyA,
                bodyB = constraint.bodyB;

            if (bodyA) {
                c.beginPath();
                c.moveTo(bodyA.position.x + constraint.pointA.x, bodyA.position.y + constraint.pointA.y);
            } else {
                c.beginPath();
                c.moveTo(constraint.pointA.x, constraint.pointA.y);
            }

            if (bodyB) {
                c.lineTo(bodyB.position.x + constraint.pointB.x, bodyB.position.y + constraint.pointB.y);
            } else {
                c.lineTo(constraint.pointB.x, constraint.pointB.y);
            }

            c.lineWidth = constraint.render.lineWidth;
            c.strokeStyle = constraint.render.strokeStyle;
            c.stroke();
        }
    };
    
    /**
     * Description
     * @private
     * @method bodyShadows
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyShadows = function(render, bodies, context) {
        var c = context,
            engine = render.engine;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (!body.render.visible)
                continue;

            if (body.circleRadius) {
                c.beginPath();
                c.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
                c.closePath();
            } else {
                c.beginPath();
                c.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (var j = 1; j < body.vertices.length; j++) {
                    c.lineTo(body.vertices[j].x, body.vertices[j].y);
                }
                c.closePath();
            }

            var distanceX = body.position.x - render.options.width * 0.5,
                distanceY = body.position.y - render.options.height * 0.2,
                distance = Math.abs(distanceX) + Math.abs(distanceY);

            c.shadowColor = 'rgba(0,0,0,0.15)';
            c.shadowOffsetX = 0.05 * distanceX;
            c.shadowOffsetY = 0.05 * distanceY;
            c.shadowBlur = 1 + 12 * Math.min(1, distance / 1000);

            c.fill();

            c.shadowColor = null;
            c.shadowOffsetX = null;
            c.shadowOffsetY = null;
            c.shadowBlur = null;
        }
    };

    /**
     * Description
     * @private
     * @method bodies
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodies = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            showInternalEdges = options.showInternalEdges || !options.wireframes,
            body,
            part,
            i,
            k;

        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // handle compound parts
            for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                part = body.parts[k];

                if (!part.render.visible)
                    continue;

                if (options.showSleeping && body.isSleeping) {
                    c.globalAlpha = 0.5 * part.render.opacity;
                } else if (part.render.opacity !== 1) {
                    c.globalAlpha = part.render.opacity;
                }

                if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
                    // part sprite
                    var sprite = part.render.sprite,
                        texture = _getTexture(render, sprite.texture);

                    c.translate(part.position.x, part.position.y); 
                    c.rotate(part.angle);

                    c.drawImage(
                        texture,
                        texture.width * -sprite.xOffset * sprite.xScale, 
                        texture.height * -sprite.yOffset * sprite.yScale, 
                        texture.width * sprite.xScale, 
                        texture.height * sprite.yScale
                    );

                    // revert translation, hopefully faster than save / restore
                    c.rotate(-part.angle);
                    c.translate(-part.position.x, -part.position.y); 
                } else {
                    // part polygon
                    if (part.circleRadius) {
                        c.beginPath();
                        c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
                    } else {
                        c.beginPath();
                        c.moveTo(part.vertices[0].x, part.vertices[0].y);

                        for (var j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                c.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                                c.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }

                            if (part.vertices[j].isInternal && !showInternalEdges) {
                                c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                        }
                        
                        c.lineTo(part.vertices[0].x, part.vertices[0].y);
                        c.closePath();
                    }

                    if (!options.wireframes) {
                        c.fillStyle = part.render.fillStyle;
                        c.lineWidth = part.render.lineWidth;
                        c.strokeStyle = part.render.strokeStyle;
                        c.fill();
                    } else {
                        c.lineWidth = 1;
                        c.strokeStyle = '#bbb';
                    }

                    c.stroke();
                }

                c.globalAlpha = 1;
            }
        }
    };

    /**
     * Optimised method for drawing body wireframes in one pass
     * @private
     * @method bodyWireframes
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyWireframes = function(render, bodies, context) {
        var c = context,
            showInternalEdges = render.options.showInternalEdges,
            body,
            part,
            i,
            j,
            k;

        c.beginPath();

        // render all bodies
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // handle compound parts
            for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                part = body.parts[k];

                c.moveTo(part.vertices[0].x, part.vertices[0].y);

                for (j = 1; j < part.vertices.length; j++) {
                    if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                        c.lineTo(part.vertices[j].x, part.vertices[j].y);
                    } else {
                        c.moveTo(part.vertices[j].x, part.vertices[j].y);
                    }

                    if (part.vertices[j].isInternal && !showInternalEdges) {
                        c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                    }
                }
                
                c.lineTo(part.vertices[0].x, part.vertices[0].y);
            }
        }

        c.lineWidth = 1;
        c.strokeStyle = '#bbb';
        c.stroke();
    };

    /**
     * Optimised method for drawing body convex hull wireframes in one pass
     * @private
     * @method bodyConvexHulls
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyConvexHulls = function(render, bodies, context) {
        var c = context,
            body,
            part,
            i,
            j,
            k;

        c.beginPath();

        // render convex hulls
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible || body.parts.length === 1)
                continue;

            c.moveTo(body.vertices[0].x, body.vertices[0].y);

            for (j = 1; j < body.vertices.length; j++) {
                c.lineTo(body.vertices[j].x, body.vertices[j].y);
            }
            
            c.lineTo(body.vertices[0].x, body.vertices[0].y);
        }

        c.lineWidth = 1;
        c.strokeStyle = 'rgba(255,255,255,0.2)';
        c.stroke();
    };

    /**
     * Renders body vertex numbers.
     * @private
     * @method vertexNumbers
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.vertexNumbers = function(render, bodies, context) {
        var c = context,
            i,
            j,
            k;

        for (i = 0; i < bodies.length; i++) {
            var parts = bodies[i].parts;
            for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                var part = parts[k];
                for (j = 0; j < part.vertices.length; j++) {
                    c.fillStyle = 'rgba(255,255,255,0.2)';
                    c.fillText(i + '_' + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
                }
            }
        }
    };

    /**
     * Renders mouse position.
     * @private
     * @method mousePosition
     * @param {render} render
     * @param {mouse} mouse
     * @param {RenderingContext} context
     */
    Render.mousePosition = function(render, mouse, context) {
        var c = context;
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.fillText(mouse.position.x + '  ' + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
    };

    /**
     * Draws body bounds
     * @private
     * @method bodyBounds
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyBounds = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options;

        c.beginPath();

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.render.visible) {
                var parts = bodies[i].parts;
                for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    var part = parts[j];
                    c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                }
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,255,255,0.08)';
        } else {
            c.strokeStyle = 'rgba(0,0,0,0.1)';
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Draws body angle indicators and axes
     * @private
     * @method bodyAxes
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyAxes = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            part,
            i,
            j,
            k;

        c.beginPath();

        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                parts = body.parts;

            if (!body.render.visible)
                continue;

            if (options.showAxes) {
                // render all axes
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    part = parts[j];
                    for (k = 0; k < part.axes.length; k++) {
                        var axis = part.axes[k];
                        c.moveTo(part.position.x, part.position.y);
                        c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
                    }
                }
            } else {
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    part = parts[j];
                    for (k = 0; k < part.axes.length; k++) {
                        // render a single axis indicator
                        c.moveTo(part.position.x, part.position.y);
                        c.lineTo((part.vertices[0].x + part.vertices[part.vertices.length-1].x) / 2, 
                                 (part.vertices[0].y + part.vertices[part.vertices.length-1].y) / 2);
                    }
                }
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'indianred';
        } else {
            c.strokeStyle = 'rgba(0,0,0,0.8)';
            c.globalCompositeOperation = 'overlay';
        }

        c.lineWidth = 1;
        c.stroke();
        c.globalCompositeOperation = 'source-over';
    };

    /**
     * Draws body positions
     * @private
     * @method bodyPositions
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyPositions = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            body,
            part,
            i,
            k;

        c.beginPath();

        // render current positions
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // handle compound parts
            for (k = 0; k < body.parts.length; k++) {
                part = body.parts[k];
                c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
                c.closePath();
            }
        }

        if (options.wireframes) {
            c.fillStyle = 'indianred';
        } else {
            c.fillStyle = 'rgba(0,0,0,0.5)';
        }
        c.fill();

        c.beginPath();

        // render previous positions
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];
            if (body.render.visible) {
                c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
                c.closePath();
            }
        }

        c.fillStyle = 'rgba(255,165,0,0.8)';
        c.fill();
    };

    /**
     * Draws body velocity
     * @private
     * @method bodyVelocity
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyVelocity = function(render, bodies, context) {
        var c = context;

        c.beginPath();

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (!body.render.visible)
                continue;

            c.moveTo(body.position.x, body.position.y);
            c.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y + (body.position.y - body.positionPrev.y) * 2);
        }

        c.lineWidth = 3;
        c.strokeStyle = 'cornflowerblue';
        c.stroke();
    };

    /**
     * Draws body ids
     * @private
     * @method bodyIds
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    Render.bodyIds = function(render, bodies, context) {
        var c = context,
            i,
            j;

        for (i = 0; i < bodies.length; i++) {
            if (!bodies[i].render.visible)
                continue;

            var parts = bodies[i].parts;
            for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                var part = parts[j];
                c.font = "12px Arial";
                c.fillStyle = 'rgba(255,255,255,0.5)';
                c.fillText(part.id, part.position.x + 10, part.position.y - 10);
            }
        }
    };

    /**
     * Description
     * @private
     * @method collisions
     * @param {render} render
     * @param {pair[]} pairs
     * @param {RenderingContext} context
     */
    Render.collisions = function(render, pairs, context) {
        var c = context,
            options = render.options,
            pair,
            collision,
            corrected,
            bodyA,
            bodyB,
            i,
            j;

        c.beginPath();

        // render collision positions
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;
            for (j = 0; j < pair.activeContacts.length; j++) {
                var contact = pair.activeContacts[j],
                    vertex = contact.vertex;
                c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
            }
        }

        if (options.wireframes) {
            c.fillStyle = 'rgba(255,255,255,0.7)';
        } else {
            c.fillStyle = 'orange';
        }
        c.fill();

        c.beginPath();
            
        // render collision normals
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;

            if (pair.activeContacts.length > 0) {
                var normalPosX = pair.activeContacts[0].vertex.x,
                    normalPosY = pair.activeContacts[0].vertex.y;

                if (pair.activeContacts.length === 2) {
                    normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                    normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                }
                
                if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                    c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
                } else {
                    c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
                }

                c.lineTo(normalPosX, normalPosY);
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,165,0,0.7)';
        } else {
            c.strokeStyle = 'orange';
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Description
     * @private
     * @method separations
     * @param {render} render
     * @param {pair[]} pairs
     * @param {RenderingContext} context
     */
    Render.separations = function(render, pairs, context) {
        var c = context,
            options = render.options,
            pair,
            collision,
            corrected,
            bodyA,
            bodyB,
            i,
            j;

        c.beginPath();

        // render separations
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            var k = 1;

            if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
            if (bodyB.isStatic) k = 0;

            c.moveTo(bodyB.position.x, bodyB.position.y);
            c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);

            k = 1;

            if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
            if (bodyA.isStatic) k = 0;

            c.moveTo(bodyA.position.x, bodyA.position.y);
            c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,165,0,0.5)';
        } else {
            c.strokeStyle = 'orange';
        }
        c.stroke();
    };

    /**
     * Description
     * @private
     * @method grid
     * @param {render} render
     * @param {grid} grid
     * @param {RenderingContext} context
     */
    Render.grid = function(render, grid, context) {
        var c = context,
            options = render.options;

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,180,0,0.1)';
        } else {
            c.strokeStyle = 'rgba(255,180,0,0.5)';
        }

        c.beginPath();

        var bucketKeys = Common.keys(grid.buckets);

        for (var i = 0; i < bucketKeys.length; i++) {
            var bucketId = bucketKeys[i];

            if (grid.buckets[bucketId].length < 2)
                continue;

            var region = bucketId.split(',');
            c.rect(0.5 + parseInt(region[0], 10) * grid.bucketWidth, 
                    0.5 + parseInt(region[1], 10) * grid.bucketHeight, 
                    grid.bucketWidth, 
                    grid.bucketHeight);
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Description
     * @private
     * @method inspector
     * @param {inspector} inspector
     * @param {RenderingContext} context
     */
    Render.inspector = function(inspector, context) {
        var engine = inspector.engine,
            selected = inspector.selected,
            render = inspector.render,
            options = render.options,
            bounds;

        if (options.hasBounds) {
            var boundsWidth = render.bounds.max.x - render.bounds.min.x,
                boundsHeight = render.bounds.max.y - render.bounds.min.y,
                boundsScaleX = boundsWidth / render.options.width,
                boundsScaleY = boundsHeight / render.options.height;
            
            context.scale(1 / boundsScaleX, 1 / boundsScaleY);
            context.translate(-render.bounds.min.x, -render.bounds.min.y);
        }

        for (var i = 0; i < selected.length; i++) {
            var item = selected[i].data;

            context.translate(0.5, 0.5);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255,165,0,0.9)';
            context.setLineDash([1,2]);

            switch (item.type) {

            case 'body':

                // render body selections
                bounds = item.bounds;
                context.beginPath();
                context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3), 
                             Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
                context.closePath();
                context.stroke();

                break;

            case 'constraint':

                // render constraint selections
                var point = item.pointA;
                if (item.bodyA)
                    point = item.pointB;
                context.beginPath();
                context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                context.closePath();
                context.stroke();

                break;

            }

            context.setLineDash([]);
            context.translate(-0.5, -0.5);
        }

        // render selection region
        if (inspector.selectStart !== null) {
            context.translate(0.5, 0.5);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255,165,0,0.6)';
            context.fillStyle = 'rgba(255,165,0,0.1)';
            bounds = inspector.selectBounds;
            context.beginPath();
            context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y), 
                         Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
            context.closePath();
            context.stroke();
            context.fill();
            context.translate(-0.5, -0.5);
        }

        if (options.hasBounds)
            context.setTransform(1, 0, 0, 1, 0, 0);
    };

    /**
     * Description
     * @method _createCanvas
     * @private
     * @param {} width
     * @param {} height
     * @return canvas
     */
    var _createCanvas = function(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function() { return false; };
        canvas.onselectstart = function() { return false; };
        return canvas;
    };

    /**
     * Gets the pixel ratio of the canvas.
     * @method _getPixelRatio
     * @private
     * @param {HTMLElement} canvas
     * @return {Number} pixel ratio
     */
    var _getPixelRatio = function(canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                                      || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                                      || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
    };

    /**
     * Gets the requested texture (an Image) via its path
     * @method _getTexture
     * @private
     * @param {render} render
     * @param {string} imagePath
     * @return {Image} texture
     */
    var _getTexture = function(render, imagePath) {
        var image = render.textures[imagePath];

        if (image)
            return image;

        image = render.textures[imagePath] = new Image();
        image.src = imagePath;

        return image;
    };

    /**
     * Applies the background to the canvas using CSS.
     * @method applyBackground
     * @private
     * @param {render} render
     * @param {string} background
     */
    var _applyBackground = function(render, background) {
        var cssBackground = background;

        if (/(jpg|gif|png)$/.test(background))
            cssBackground = 'url(' + background + ')';

        render.canvas.style.background = cssBackground;
        render.canvas.style.backgroundSize = "contain";
        render.currentBackground = background;
    };

    /*
    *
    *  Events Documentation
    *
    */

    /**
    * Fired before rendering
    *
    * @event beforeRender
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /**
    * Fired after rendering
    *
    * @event afterRender
    * @param {} event An event object
    * @param {number} event.timestamp The engine.timing.timestamp of the event
    * @param {} event.source The source object of the event
    * @param {} event.name The name of the event
    */

    /*
    *
    *  Properties Documentation
    *
    */

    /**
     * A back-reference to the `Matter.Render` module.
     *
     * @property controller
     * @type render
     */

    /**
     * A reference to the `Matter.Engine` instance to be used.
     *
     * @property engine
     * @type engine
     */

    /**
     * A reference to the element where the canvas is to be inserted (if `render.canvas` has not been specified)
     *
     * @property element
     * @type HTMLElement
     * @default null
     */

    /**
     * The canvas element to render to. If not specified, one will be created if `render.element` has been specified.
     *
     * @property canvas
     * @type HTMLCanvasElement
     * @default null
     */

    /**
     * The configuration options of the renderer.
     *
     * @property options
     * @type {}
     */

    /**
     * The target width in pixels of the `render.canvas` to be created.
     *
     * @property options.width
     * @type number
     * @default 800
     */

    /**
     * The target height in pixels of the `render.canvas` to be created.
     *
     * @property options.height
     * @type number
     * @default 600
     */

    /**
     * A flag that specifies if `render.bounds` should be used when rendering.
     *
     * @property options.hasBounds
     * @type boolean
     * @default false
     */

    /**
     * A `Bounds` object that specifies the drawing view region. 
     * Rendering will be automatically transformed and scaled to fit within the canvas size (`render.options.width` and `render.options.height`).
     * This allows for creating views that can pan or zoom around the scene.
     * You must also set `render.options.hasBounds` to `true` to enable bounded rendering.
     *
     * @property bounds
     * @type bounds
     */

    /**
     * The 2d rendering context from the `render.canvas` element.
     *
     * @property context
     * @type CanvasRenderingContext2D
     */

    /**
     * The sprite texture cache.
     *
     * @property textures
     * @type {}
     */

})();

},{"../body/Composite":5,"../collision/Grid":9,"../core/Common":17,"../core/Events":19,"../geometry/Bounds":27,"../geometry/Vector":29}],33:[function(require,module,exports){
/**
* The `Matter.RenderPixi` module is an example renderer using pixi.js.
* See also `Matter.Render` for a canvas based renderer.
*
* @class RenderPixi
* @deprecated the Matter.RenderPixi module will soon be removed from the Matter.js core.
* It will likely be moved to its own repository (but maintenance will be limited).
*/

var RenderPixi = {};

module.exports = RenderPixi;

var Composite = require('../body/Composite');
var Common = require('../core/Common');

(function() {

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame 
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }
    
    /**
     * Creates a new Pixi.js WebGL renderer
     * @method create
     * @param {object} options
     * @return {RenderPixi} A new renderer
     * @deprecated
     */
    RenderPixi.create = function(options) {
        Common.log('RenderPixi.create: Matter.RenderPixi is deprecated (see docs)', 'warn');

        var defaults = {
            controller: RenderPixi,
            engine: null,
            element: null,
            frameRequestId: null,
            canvas: null,
            renderer: null,
            container: null,
            spriteContainer: null,
            pixiOptions: null,
            options: {
                width: 800,
                height: 600,
                background: '#fafafa',
                wireframeBackground: '#222',
                hasBounds: false,
                enabled: true,
                wireframes: true,
                showSleeping: true,
                showDebug: false,
                showBroadphase: false,
                showBounds: false,
                showVelocity: false,
                showCollisions: false,
                showAxes: false,
                showPositions: false,
                showAngleIndicator: false,
                showIds: false,
                showShadows: false
            }
        };

        var render = Common.extend(defaults, options),
            transparent = !render.options.wireframes && render.options.background === 'transparent';

        // init pixi
        render.pixiOptions = render.pixiOptions || {
            view: render.canvas,
            transparent: transparent,
            antialias: true,
            backgroundColor: options.background
        };

        render.mouse = options.mouse;
        render.engine = options.engine;
        render.renderer = render.renderer || new PIXI.WebGLRenderer(render.options.width, render.options.height, render.pixiOptions);
        render.container = render.container || new PIXI.Container();
        render.spriteContainer = render.spriteContainer || new PIXI.Container();
        render.canvas = render.canvas || render.renderer.view;
        render.bounds = render.bounds || { 
            min: {
                x: 0,
                y: 0
            }, 
            max: { 
                x: render.options.width,
                y: render.options.height
            }
        };

        // caches
        render.textures = {};
        render.sprites = {};
        render.primitives = {};

        // use a sprite batch for performance
        render.container.addChild(render.spriteContainer);

        // insert canvas
        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else {
            Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
        }

        // prevent menus on canvas
        render.canvas.oncontextmenu = function() { return false; };
        render.canvas.onselectstart = function() { return false; };

        return render;
    };

    /**
     * Continuously updates the render canvas on the `requestAnimationFrame` event.
     * @method run
     * @param {render} render
     * @deprecated
     */
    RenderPixi.run = function(render) {
        (function loop(time){
            render.frameRequestId = _requestAnimationFrame(loop);
            RenderPixi.world(render);
        })();
    };

    /**
     * Ends execution of `Render.run` on the given `render`, by canceling the animation frame request event loop.
     * @method stop
     * @param {render} render
     * @deprecated
     */
    RenderPixi.stop = function(render) {
        _cancelAnimationFrame(render.frameRequestId);
    };

    /**
     * Clears the scene graph
     * @method clear
     * @param {RenderPixi} render
     * @deprecated
     */
    RenderPixi.clear = function(render) {
        var container = render.container,
            spriteContainer = render.spriteContainer;

        // clear stage container
        while (container.children[0]) { 
            container.removeChild(container.children[0]); 
        }

        // clear sprite batch
        while (spriteContainer.children[0]) { 
            spriteContainer.removeChild(spriteContainer.children[0]); 
        }

        var bgSprite = render.sprites['bg-0'];

        // clear caches
        render.textures = {};
        render.sprites = {};
        render.primitives = {};

        // set background sprite
        render.sprites['bg-0'] = bgSprite;
        if (bgSprite)
            container.addChildAt(bgSprite, 0);

        // add sprite batch back into container
        render.container.addChild(render.spriteContainer);

        // reset background state
        render.currentBackground = null;

        // reset bounds transforms
        container.scale.set(1, 1);
        container.position.set(0, 0);
    };

    /**
     * Sets the background of the canvas 
     * @method setBackground
     * @param {RenderPixi} render
     * @param {string} background
     * @deprecated
     */
    RenderPixi.setBackground = function(render, background) {
        if (render.currentBackground !== background) {
            var isColor = background.indexOf && background.indexOf('#') !== -1,
                bgSprite = render.sprites['bg-0'];

            if (isColor) {
                // if solid background color
                var color = Common.colorToNumber(background);
                render.renderer.backgroundColor = color;

                // remove background sprite if existing
                if (bgSprite)
                    render.container.removeChild(bgSprite); 
            } else {
                // initialise background sprite if needed
                if (!bgSprite) {
                    var texture = _getTexture(render, background);

                    bgSprite = render.sprites['bg-0'] = new PIXI.Sprite(texture);
                    bgSprite.position.x = 0;
                    bgSprite.position.y = 0;
                    render.container.addChildAt(bgSprite, 0);
                }
            }

            render.currentBackground = background;
        }
    };

    /**
     * Description
     * @method world
     * @param {engine} engine
     * @deprecated
     */
    RenderPixi.world = function(render) {
        var engine = render.engine,
            world = engine.world,
            renderer = render.renderer,
            container = render.container,
            options = render.options,
            bodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world),
            constraints = [],
            i;

        if (options.wireframes) {
            RenderPixi.setBackground(render, options.wireframeBackground);
        } else {
            RenderPixi.setBackground(render, options.background);
        }

        // handle bounds
        var boundsWidth = render.bounds.max.x - render.bounds.min.x,
            boundsHeight = render.bounds.max.y - render.bounds.min.y,
            boundsScaleX = boundsWidth / render.options.width,
            boundsScaleY = boundsHeight / render.options.height;

        if (options.hasBounds) {
            // Hide bodies that are not in view
            for (i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                body.render.sprite.visible = Bounds.overlaps(body.bounds, render.bounds);
            }

            // filter out constraints that are not in view
            for (i = 0; i < allConstraints.length; i++) {
                var constraint = allConstraints[i],
                    bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB,
                    pointAWorld = constraint.pointA,
                    pointBWorld = constraint.pointB;

                if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

                if (!pointAWorld || !pointBWorld)
                    continue;

                if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
                    constraints.push(constraint);
            }

            // transform the view
            container.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
            container.position.set(-render.bounds.min.x * (1 / boundsScaleX), -render.bounds.min.y * (1 / boundsScaleY));
        } else {
            constraints = allConstraints;
        }

        for (i = 0; i < bodies.length; i++)
            RenderPixi.body(render, bodies[i]);

        for (i = 0; i < constraints.length; i++)
            RenderPixi.constraint(render, constraints[i]);

        renderer.render(container);
    };


    /**
     * Description
     * @method constraint
     * @param {engine} engine
     * @param {constraint} constraint
     * @deprecated
     */
    RenderPixi.constraint = function(render, constraint) {
        var engine = render.engine,
            bodyA = constraint.bodyA,
            bodyB = constraint.bodyB,
            pointA = constraint.pointA,
            pointB = constraint.pointB,
            container = render.container,
            constraintRender = constraint.render,
            primitiveId = 'c-' + constraint.id,
            primitive = render.primitives[primitiveId];

        // initialise constraint primitive if not existing
        if (!primitive)
            primitive = render.primitives[primitiveId] = new PIXI.Graphics();

        // don't render if constraint does not have two end points
        if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
            primitive.clear();
            return;
        }

        // add to scene graph if not already there
        if (Common.indexOf(container.children, primitive) === -1)
            container.addChild(primitive);

        // render the constraint on every update, since they can change dynamically
        primitive.clear();
        primitive.beginFill(0, 0);
        primitive.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);
        
        if (bodyA) {
            primitive.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
        } else {
            primitive.moveTo(pointA.x, pointA.y);
        }

        if (bodyB) {
            primitive.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
        } else {
            primitive.lineTo(pointB.x, pointB.y);
        }

        primitive.endFill();
    };
    
    /**
     * Description
     * @method body
     * @param {engine} engine
     * @param {body} body
     * @deprecated
     */
    RenderPixi.body = function(render, body) {
        var engine = render.engine,
            bodyRender = body.render;

        if (!bodyRender.visible)
            return;

        if (bodyRender.sprite && bodyRender.sprite.texture) {
            var spriteId = 'b-' + body.id,
                sprite = render.sprites[spriteId],
                spriteContainer = render.spriteContainer;

            // initialise body sprite if not existing
            if (!sprite)
                sprite = render.sprites[spriteId] = _createBodySprite(render, body);

            // add to scene graph if not already there
            if (Common.indexOf(spriteContainer.children, sprite) === -1)
                spriteContainer.addChild(sprite);

            // update body sprite
            sprite.position.x = body.position.x;
            sprite.position.y = body.position.y;
            sprite.rotation = body.angle;
            sprite.scale.x = bodyRender.sprite.xScale || 1;
            sprite.scale.y = bodyRender.sprite.yScale || 1;
        } else {
            var primitiveId = 'b-' + body.id,
                primitive = render.primitives[primitiveId],
                container = render.container;

            // initialise body primitive if not existing
            if (!primitive) {
                primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
                primitive.initialAngle = body.angle;
            }

            // add to scene graph if not already there
            if (Common.indexOf(container.children, primitive) === -1)
                container.addChild(primitive);

            // update body primitive
            primitive.position.x = body.position.x;
            primitive.position.y = body.position.y;
            primitive.rotation = body.angle - primitive.initialAngle;
        }
    };

    /**
     * Creates a body sprite
     * @method _createBodySprite
     * @private
     * @param {RenderPixi} render
     * @param {body} body
     * @return {PIXI.Sprite} sprite
     * @deprecated
     */
    var _createBodySprite = function(render, body) {
        var bodyRender = body.render,
            texturePath = bodyRender.sprite.texture,
            texture = _getTexture(render, texturePath),
            sprite = new PIXI.Sprite(texture);

        sprite.anchor.x = body.render.sprite.xOffset;
        sprite.anchor.y = body.render.sprite.yOffset;

        return sprite;
    };

    /**
     * Creates a body primitive
     * @method _createBodyPrimitive
     * @private
     * @param {RenderPixi} render
     * @param {body} body
     * @return {PIXI.Graphics} graphics
     * @deprecated
     */
    var _createBodyPrimitive = function(render, body) {
        var bodyRender = body.render,
            options = render.options,
            primitive = new PIXI.Graphics(),
            fillStyle = Common.colorToNumber(bodyRender.fillStyle),
            strokeStyle = Common.colorToNumber(bodyRender.strokeStyle),
            strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle),
            strokeStyleWireframe = Common.colorToNumber('#bbb'),
            strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C'),
            part;

        primitive.clear();

        // handle compound parts
        for (var k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
            part = body.parts[k];

            if (!options.wireframes) {
                primitive.beginFill(fillStyle, 1);
                primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
            } else {
                primitive.beginFill(0, 0);
                primitive.lineStyle(1, strokeStyleWireframe, 1);
            }

            primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);

            for (var j = 1; j < part.vertices.length; j++) {
                primitive.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
            }

            primitive.lineTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);

            primitive.endFill();

            // angle indicator
            if (options.showAngleIndicator || options.showAxes) {
                primitive.beginFill(0, 0);

                if (options.wireframes) {
                    primitive.lineStyle(1, strokeStyleWireframeIndicator, 1);
                } else {
                    primitive.lineStyle(1, strokeStyleIndicator);
                }

                primitive.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
                primitive.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length-1].x) / 2 - body.position.x), 
                                 ((part.vertices[0].y + part.vertices[part.vertices.length-1].y) / 2 - body.position.y));

                primitive.endFill();
            }
        }

        return primitive;
    };

    /**
     * Gets the requested texture (a PIXI.Texture) via its path
     * @method _getTexture
     * @private
     * @param {RenderPixi} render
     * @param {string} imagePath
     * @return {PIXI.Texture} texture
     * @deprecated
     */
    var _getTexture = function(render, imagePath) {
        var texture = render.textures[imagePath];

        if (!texture)
            texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);

        return texture;
    };

})();

},{"../body/Composite":5,"../core/Common":17}],34:[function(require,module,exports){
module.exports={"Tide":{"startDate_LOCAL":1462603412,"Error":"","TideStation":"T%2Dstreet","dataPoints":[{"Localtime":"2016-05-07 12:00:00","time":1462604400,"type":"NORMAL","utctime":"May 07, 2016 07:00:00","Rawtime":"May 07, 2016 00:00:00","height":4.289762},{"Localtime":"2016-05-07 01:00:00","time":1462608000,"type":"NORMAL","utctime":"May 07, 2016 08:00:00","Rawtime":"May 07, 2016 01:00:00","height":2.518884},{"Localtime":"2016-05-07 02:00:00","time":1462611600,"type":"NORMAL","utctime":"May 07, 2016 09:00:00","Rawtime":"May 07, 2016 02:00:00","height":0.737547},{"Localtime":"2016-05-07 03:00:00","time":1462615200,"type":"NORMAL","utctime":"May 07, 2016 10:00:00","Rawtime":"May 07, 2016 03:00:00","height":-0.685558},{"Localtime":"2016-05-07 04:00:00","time":1462618800,"type":"NORMAL","utctime":"May 07, 2016 11:00:00","Rawtime":"May 07, 2016 04:00:00","height":-1.458447},{"Localtime":"2016-05-07 04:28:14","time":1462620494,"type":"Low","utctime":"May 07, 2016 11:28:14","Rawtime":"May 07, 2016 04:28:14","height":-1.55},{"Localtime":"2016-05-07 05:00:00","time":1462622400,"type":"NORMAL","utctime":"May 07, 2016 12:00:00","Rawtime":"May 07, 2016 05:00:00","height":-1.432456},{"Localtime":"2016-05-07 05:56:04","time":1462625764,"type":"Sunrise","utctime":"May 07, 2016 12:56:04","Rawtime":"May 07, 2016 05:56:04","height":0},{"Localtime":"2016-05-07 06:00:00","time":1462626000,"type":"NORMAL","utctime":"May 07, 2016 13:00:00","Rawtime":"May 07, 2016 06:00:00","height":-0.645008},{"Localtime":"2016-05-07 07:00:00","time":1462629600,"type":"NORMAL","utctime":"May 07, 2016 14:00:00","Rawtime":"May 07, 2016 07:00:00","height":0.681178},{"Localtime":"2016-05-07 08:00:00","time":1462633200,"type":"NORMAL","utctime":"May 07, 2016 15:00:00","Rawtime":"May 07, 2016 08:00:00","height":2.193312},{"Localtime":"2016-05-07 09:00:00","time":1462636800,"type":"NORMAL","utctime":"May 07, 2016 16:00:00","Rawtime":"May 07, 2016 09:00:00","height":3.515583},{"Localtime":"2016-05-07 10:00:00","time":1462640400,"type":"NORMAL","utctime":"May 07, 2016 17:00:00","Rawtime":"May 07, 2016 10:00:00","height":4.319719},{"Localtime":"2016-05-07 10:41:59","time":1462642919,"type":"High","utctime":"May 07, 2016 17:41:59","Rawtime":"May 07, 2016 10:41:59","height":4.49},{"Localtime":"2016-05-07 11:00:00","time":1462644000,"type":"NORMAL","utctime":"May 07, 2016 18:00:00","Rawtime":"May 07, 2016 11:00:00","height":4.454503},{"Localtime":"2016-05-07 12:00:00","time":1462647600,"type":"NORMAL","utctime":"May 07, 2016 19:00:00","Rawtime":"May 07, 2016 12:00:00","height":3.966016},{"Localtime":"2016-05-07 01:00:00","time":1462651200,"type":"NORMAL","utctime":"May 07, 2016 20:00:00","Rawtime":"May 07, 2016 13:00:00","height":3.055459},{"Localtime":"2016-05-07 02:00:00","time":1462654800,"type":"NORMAL","utctime":"May 07, 2016 21:00:00","Rawtime":"May 07, 2016 14:00:00","height":2.01708},{"Localtime":"2016-05-07 03:00:00","time":1462658400,"type":"NORMAL","utctime":"May 07, 2016 22:00:00","Rawtime":"May 07, 2016 15:00:00","height":1.167286},{"Localtime":"2016-05-07 04:00:00","time":1462662000,"type":"NORMAL","utctime":"May 07, 2016 23:00:00","Rawtime":"May 07, 2016 16:00:00","height":0.779115},{"Localtime":"2016-05-07 04:08:26","time":1462662506,"type":"Low","utctime":"May 07, 2016 23:08:26","Rawtime":"May 07, 2016 16:08:26","height":0.77},{"Localtime":"2016-05-07 05:00:00","time":1462665600,"type":"NORMAL","utctime":"May 08, 2016 00:00:00","Rawtime":"May 07, 2016 17:00:00","height":1.022068},{"Localtime":"2016-05-07 06:00:00","time":1462669200,"type":"NORMAL","utctime":"May 08, 2016 01:00:00","Rawtime":"May 07, 2016 18:00:00","height":1.901393},{"Localtime":"2016-05-07 07:00:00","time":1462672800,"type":"NORMAL","utctime":"May 08, 2016 02:00:00","Rawtime":"May 07, 2016 19:00:00","height":3.221955},{"Localtime":"2016-05-07 07:38:17","time":1462675097,"type":"Sunset","utctime":"May 08, 2016 02:38:17","Rawtime":"May 07, 2016 19:38:17","height":0},{"Localtime":"2016-05-07 08:00:00","time":1462676400,"type":"NORMAL","utctime":"May 08, 2016 03:00:00","Rawtime":"May 07, 2016 20:00:00","height":4.646991},{"Localtime":"2016-05-07 09:00:00","time":1462680000,"type":"NORMAL","utctime":"May 08, 2016 04:00:00","Rawtime":"May 07, 2016 21:00:00","height":5.810131},{"Localtime":"2016-05-07 10:00:00","time":1462683600,"type":"NORMAL","utctime":"May 08, 2016 05:00:00","Rawtime":"May 07, 2016 22:00:00","height":6.393953},{"Localtime":"2016-05-07 10:17:04","time":1462684624,"type":"High","utctime":"May 08, 2016 05:17:04","Rawtime":"May 07, 2016 22:17:04","height":6.43},{"Localtime":"2016-05-07 11:00:00","time":1462687200,"type":"NORMAL","utctime":"May 08, 2016 06:00:00","Rawtime":"May 07, 2016 23:00:00","height":6.223983},{"Localtime":"2016-05-08 12:00:00","time":1462690800,"type":"NORMAL","utctime":"May 08, 2016 07:00:00","Rawtime":"May 08, 2016 00:00:00","height":5.307096},{"Localtime":"2016-05-08 01:00:00","time":1462694400,"type":"NORMAL","utctime":"May 08, 2016 08:00:00","Rawtime":"May 08, 2016 01:00:00","height":3.820063},{"Localtime":"2016-05-08 02:00:00","time":1462698000,"type":"NORMAL","utctime":"May 08, 2016 09:00:00","Rawtime":"May 08, 2016 02:00:00","height":2.060306},{"Localtime":"2016-05-08 03:00:00","time":1462701600,"type":"NORMAL","utctime":"May 08, 2016 10:00:00","Rawtime":"May 08, 2016 03:00:00","height":0.381959},{"Localtime":"2016-05-08 04:00:00","time":1462705200,"type":"NORMAL","utctime":"May 08, 2016 11:00:00","Rawtime":"May 08, 2016 04:00:00","height":-0.880255},{"Localtime":"2016-05-08 05:00:00","time":1462708800,"type":"NORMAL","utctime":"May 08, 2016 12:00:00","Rawtime":"May 08, 2016 05:00:00","height":-1.479837},{"Localtime":"2016-05-08 05:17:00","time":1462709820,"type":"Low","utctime":"May 08, 2016 12:17:00","Rawtime":"May 08, 2016 05:17:00","height":-1.51},{"Localtime":"2016-05-08 05:55:11","time":1462712111,"type":"Sunrise","utctime":"May 08, 2016 12:55:11","Rawtime":"May 08, 2016 05:55:11","height":0},{"Localtime":"2016-05-08 06:00:00","time":1462712400,"type":"NORMAL","utctime":"May 08, 2016 13:00:00","Rawtime":"May 08, 2016 06:00:00","height":-1.316115},{"Localtime":"2016-05-08 07:00:00","time":1462716000,"type":"NORMAL","utctime":"May 08, 2016 14:00:00","Rawtime":"May 08, 2016 07:00:00","height":-0.465436},{"Localtime":"2016-05-08 08:00:00","time":1462719600,"type":"NORMAL","utctime":"May 08, 2016 15:00:00","Rawtime":"May 08, 2016 08:00:00","height":0.833909},{"Localtime":"2016-05-08 09:00:00","time":1462723200,"type":"NORMAL","utctime":"May 08, 2016 16:00:00","Rawtime":"May 08, 2016 09:00:00","height":2.241483},{"Localtime":"2016-05-08 10:00:00","time":1462726800,"type":"NORMAL","utctime":"May 08, 2016 17:00:00","Rawtime":"May 08, 2016 10:00:00","height":3.421141},{"Localtime":"2016-05-08 11:00:00","time":1462730400,"type":"NORMAL","utctime":"May 08, 2016 18:00:00","Rawtime":"May 08, 2016 11:00:00","height":4.092849},{"Localtime":"2016-05-08 11:35:55","time":1462732555,"type":"High","utctime":"May 08, 2016 18:35:55","Rawtime":"May 08, 2016 11:35:55","height":4.2},{"Localtime":"2016-05-08 12:00:00","time":1462734000,"type":"NORMAL","utctime":"May 08, 2016 19:00:00","Rawtime":"May 08, 2016 12:00:00","height":4.155077},{"Localtime":"2016-05-08 01:00:00","time":1462737600,"type":"NORMAL","utctime":"May 08, 2016 20:00:00","Rawtime":"May 08, 2016 13:00:00","height":3.682596},{"Localtime":"2016-05-08 02:00:00","time":1462741200,"type":"NORMAL","utctime":"May 08, 2016 21:00:00","Rawtime":"May 08, 2016 14:00:00","height":2.879287},{"Localtime":"2016-05-08 03:00:00","time":1462744800,"type":"NORMAL","utctime":"May 08, 2016 22:00:00","Rawtime":"May 08, 2016 15:00:00","height":2.01903},{"Localtime":"2016-05-08 04:00:00","time":1462748400,"type":"NORMAL","utctime":"May 08, 2016 23:00:00","Rawtime":"May 08, 2016 16:00:00","height":1.378088},{"Localtime":"2016-05-08 04:51:52","time":1462751512,"type":"Low","utctime":"May 08, 2016 23:51:52","Rawtime":"May 08, 2016 16:51:52","height":1.18},{"Localtime":"2016-05-08 05:00:00","time":1462752000,"type":"NORMAL","utctime":"May 09, 2016 00:00:00","Rawtime":"May 08, 2016 17:00:00","height":1.181717},{"Localtime":"2016-05-08 06:00:00","time":1462755600,"type":"NORMAL","utctime":"May 09, 2016 01:00:00","Rawtime":"May 08, 2016 18:00:00","height":1.552635},{"Localtime":"2016-05-08 07:00:00","time":1462759200,"type":"NORMAL","utctime":"May 09, 2016 02:00:00","Rawtime":"May 08, 2016 19:00:00","height":2.458651},{"Localtime":"2016-05-08 07:39:02","time":1462761542,"type":"Sunset","utctime":"May 09, 2016 02:39:02","Rawtime":"May 08, 2016 19:39:02","height":0},{"Localtime":"2016-05-08 08:00:00","time":1462762800,"type":"NORMAL","utctime":"May 09, 2016 03:00:00","Rawtime":"May 08, 2016 20:00:00","height":3.674381},{"Localtime":"2016-05-08 09:00:00","time":1462766400,"type":"NORMAL","utctime":"May 09, 2016 04:00:00","Rawtime":"May 08, 2016 21:00:00","height":4.901699},{"Localtime":"2016-05-08 10:00:00","time":1462770000,"type":"NORMAL","utctime":"May 09, 2016 05:00:00","Rawtime":"May 08, 2016 22:00:00","height":5.815005},{"Localtime":"2016-05-08 11:00:00","time":1462773600,"type":"NORMAL","utctime":"May 09, 2016 06:00:00","Rawtime":"May 08, 2016 23:00:00","height":6.157739},{"Localtime":"2016-05-08 11:00:31","time":1462773631,"type":"High","utctime":"May 09, 2016 06:00:31","Rawtime":"May 08, 2016 23:00:31","height":6.16},{"Localtime":"2016-05-09 12:00:00","time":1462777200,"type":"NORMAL","utctime":"May 09, 2016 07:00:00","Rawtime":"May 09, 2016 00:00:00","height":5.811769},{"Localtime":"2016-05-09 01:00:00","time":1462780800,"type":"NORMAL","utctime":"May 09, 2016 08:00:00","Rawtime":"May 09, 2016 01:00:00","height":4.820442},{"Localtime":"2016-05-09 02:00:00","time":1462784400,"type":"NORMAL","utctime":"May 09, 2016 09:00:00","Rawtime":"May 09, 2016 02:00:00","height":3.369412},{"Localtime":"2016-05-09 03:00:00","time":1462788000,"type":"NORMAL","utctime":"May 09, 2016 10:00:00","Rawtime":"May 09, 2016 03:00:00","height":1.739803},{"Localtime":"2016-05-09 04:00:00","time":1462791600,"type":"NORMAL","utctime":"May 09, 2016 11:00:00","Rawtime":"May 09, 2016 04:00:00","height":0.247863},{"Localtime":"2016-05-09 05:00:00","time":1462795200,"type":"NORMAL","utctime":"May 09, 2016 12:00:00","Rawtime":"May 09, 2016 05:00:00","height":-0.818536},{"Localtime":"2016-05-09 05:54:21","time":1462798461,"type":"Sunrise","utctime":"May 09, 2016 12:54:21","Rawtime":"May 09, 2016 05:54:21","height":0},{"Localtime":"2016-05-09 06:00:00","time":1462798800,"type":"NORMAL","utctime":"May 09, 2016 13:00:00","Rawtime":"May 09, 2016 06:00:00","height":-1.263003},{"Localtime":"2016-05-09 06:08:50","time":1462799330,"type":"Low","utctime":"May 09, 2016 13:08:50","Rawtime":"May 09, 2016 06:08:50","height":-1.27},{"Localtime":"2016-05-09 07:00:00","time":1462802400,"type":"NORMAL","utctime":"May 09, 2016 14:00:00","Rawtime":"May 09, 2016 07:00:00","height":-1.024474},{"Localtime":"2016-05-09 08:00:00","time":1462806000,"type":"NORMAL","utctime":"May 09, 2016 15:00:00","Rawtime":"May 09, 2016 08:00:00","height":-0.197189},{"Localtime":"2016-05-09 09:00:00","time":1462809600,"type":"NORMAL","utctime":"May 09, 2016 16:00:00","Rawtime":"May 09, 2016 09:00:00","height":0.990933},{"Localtime":"2016-05-09 10:00:00","time":1462813200,"type":"NORMAL","utctime":"May 09, 2016 17:00:00","Rawtime":"May 09, 2016 10:00:00","height":2.236866},{"Localtime":"2016-05-09 11:00:00","time":1462816800,"type":"NORMAL","utctime":"May 09, 2016 18:00:00","Rawtime":"May 09, 2016 11:00:00","height":3.255878},{"Localtime":"2016-05-09 12:00:00","time":1462820400,"type":"NORMAL","utctime":"May 09, 2016 19:00:00","Rawtime":"May 09, 2016 12:00:00","height":3.821713},{"Localtime":"2016-05-09 12:35:11","time":1462822511,"type":"High","utctime":"May 09, 2016 19:35:11","Rawtime":"May 09, 2016 12:35:11","height":3.91},{"Localtime":"2016-05-09 01:00:00","time":1462824000,"type":"NORMAL","utctime":"May 09, 2016 20:00:00","Rawtime":"May 09, 2016 13:00:00","height":3.866798},{"Localtime":"2016-05-09 02:00:00","time":1462827600,"type":"NORMAL","utctime":"May 09, 2016 21:00:00","Rawtime":"May 09, 2016 14:00:00","height":3.473398},{"Localtime":"2016-05-09 03:00:00","time":1462831200,"type":"NORMAL","utctime":"May 09, 2016 22:00:00","Rawtime":"May 09, 2016 15:00:00","height":2.826387},{"Localtime":"2016-05-09 04:00:00","time":1462834800,"type":"NORMAL","utctime":"May 09, 2016 23:00:00","Rawtime":"May 09, 2016 16:00:00","height":2.161775},{"Localtime":"2016-05-09 05:00:00","time":1462838400,"type":"NORMAL","utctime":"May 10, 2016 00:00:00","Rawtime":"May 09, 2016 17:00:00","height":1.705724},{"Localtime":"2016-05-09 05:40:02","time":1462840802,"type":"Low","utctime":"May 10, 2016 00:40:02","Rawtime":"May 09, 2016 17:40:02","height":1.61},{"Localtime":"2016-05-09 06:00:00","time":1462842000,"type":"NORMAL","utctime":"May 10, 2016 01:00:00","Rawtime":"May 09, 2016 18:00:00","height":1.634599},{"Localtime":"2016-05-09 07:00:00","time":1462845600,"type":"NORMAL","utctime":"May 10, 2016 02:00:00","Rawtime":"May 09, 2016 19:00:00","height":2.035327},{"Localtime":"2016-05-09 07:39:47","time":1462847987,"type":"Sunset","utctime":"May 10, 2016 02:39:47","Rawtime":"May 09, 2016 19:39:47","height":0},{"Localtime":"2016-05-09 08:00:00","time":1462849200,"type":"NORMAL","utctime":"May 10, 2016 03:00:00","Rawtime":"May 09, 2016 20:00:00","height":2.851303},{"Localtime":"2016-05-09 09:00:00","time":1462852800,"type":"NORMAL","utctime":"May 10, 2016 04:00:00","Rawtime":"May 09, 2016 21:00:00","height":3.877981},{"Localtime":"2016-05-09 10:00:00","time":1462856400,"type":"NORMAL","utctime":"May 10, 2016 05:00:00","Rawtime":"May 09, 2016 22:00:00","height":4.860747},{"Localtime":"2016-05-09 11:00:00","time":1462860000,"type":"NORMAL","utctime":"May 10, 2016 06:00:00","Rawtime":"May 09, 2016 23:00:00","height":5.532546},{"Localtime":"2016-05-09 11:47:15","time":1462862835,"type":"High","utctime":"May 10, 2016 06:47:15","Rawtime":"May 09, 2016 23:47:15","height":5.71},{"Localtime":"2016-05-10 12:00:00","time":1462863600,"type":"NORMAL","utctime":"May 10, 2016 07:00:00","Rawtime":"May 10, 2016 00:00:00","height":5.696385},{"Localtime":"2016-05-10 01:00:00","time":1462867200,"type":"NORMAL","utctime":"May 10, 2016 08:00:00","Rawtime":"May 10, 2016 01:00:00","height":5.27476},{"Localtime":"2016-05-10 02:00:00","time":1462870800,"type":"NORMAL","utctime":"May 10, 2016 09:00:00","Rawtime":"May 10, 2016 02:00:00","height":4.324639},{"Localtime":"2016-05-10 03:00:00","time":1462874400,"type":"NORMAL","utctime":"May 10, 2016 10:00:00","Rawtime":"May 10, 2016 03:00:00","height":3.017094},{"Localtime":"2016-05-10 04:00:00","time":1462878000,"type":"NORMAL","utctime":"May 10, 2016 11:00:00","Rawtime":"May 10, 2016 04:00:00","height":1.594733},{"Localtime":"2016-05-10 05:00:00","time":1462881600,"type":"NORMAL","utctime":"May 10, 2016 12:00:00","Rawtime":"May 10, 2016 05:00:00","height":0.324822},{"Localtime":"2016-05-10 05:53:32","time":1462884812,"type":"Sunrise","utctime":"May 10, 2016 12:53:32","Rawtime":"May 10, 2016 05:53:32","height":0},{"Localtime":"2016-05-10 06:00:00","time":1462885200,"type":"NORMAL","utctime":"May 10, 2016 13:00:00","Rawtime":"May 10, 2016 06:00:00","height":-0.556568},{"Localtime":"2016-05-10 07:00:00","time":1462888800,"type":"NORMAL","utctime":"May 10, 2016 14:00:00","Rawtime":"May 10, 2016 07:00:00","height":-0.895207},{"Localtime":"2016-05-10 07:04:39","time":1462889079,"type":"Low","utctime":"May 10, 2016 14:04:39","Rawtime":"May 10, 2016 07:04:39","height":-0.9},{"Localtime":"2016-05-10 08:00:00","time":1462892400,"type":"NORMAL","utctime":"May 10, 2016 15:00:00","Rawtime":"May 10, 2016 08:00:00","height":-0.652357},{"Localtime":"2016-05-10 09:00:00","time":1462896000,"type":"NORMAL","utctime":"May 10, 2016 16:00:00","Rawtime":"May 10, 2016 09:00:00","height":0.082725},{"Localtime":"2016-05-10 10:00:00","time":1462899600,"type":"NORMAL","utctime":"May 10, 2016 17:00:00","Rawtime":"May 10, 2016 10:00:00","height":1.113578},{"Localtime":"2016-05-10 11:00:00","time":1462903200,"type":"NORMAL","utctime":"May 10, 2016 18:00:00","Rawtime":"May 10, 2016 11:00:00","height":2.187786},{"Localtime":"2016-05-10 12:00:00","time":1462906800,"type":"NORMAL","utctime":"May 10, 2016 19:00:00","Rawtime":"May 10, 2016 12:00:00","height":3.072183},{"Localtime":"2016-05-10 01:00:00","time":1462910400,"type":"NORMAL","utctime":"May 10, 2016 20:00:00","Rawtime":"May 10, 2016 13:00:00","height":3.584953},{"Localtime":"2016-05-10 01:42:22","time":1462912942,"type":"High","utctime":"May 10, 2016 20:42:22","Rawtime":"May 10, 2016 13:42:22","height":3.69},{"Localtime":"2016-05-10 02:00:00","time":1462914000,"type":"NORMAL","utctime":"May 10, 2016 21:00:00","Rawtime":"May 10, 2016 14:00:00","height":3.670871},{"Localtime":"2016-05-10 03:00:00","time":1462917600,"type":"NORMAL","utctime":"May 10, 2016 22:00:00","Rawtime":"May 10, 2016 15:00:00","height":3.398482},{"Localtime":"2016-05-10 04:00:00","time":1462921200,"type":"NORMAL","utctime":"May 10, 2016 23:00:00","Rawtime":"May 10, 2016 16:00:00","height":2.918219},{"Localtime":"2016-05-10 05:00:00","time":1462924800,"type":"NORMAL","utctime":"May 11, 2016 00:00:00","Rawtime":"May 10, 2016 17:00:00","height":2.417341},{"Localtime":"2016-05-10 06:00:00","time":1462928400,"type":"NORMAL","utctime":"May 11, 2016 01:00:00","Rawtime":"May 10, 2016 18:00:00","height":2.080843},{"Localtime":"2016-05-10 06:37:01","time":1462930621,"type":"Low","utctime":"May 11, 2016 01:37:01","Rawtime":"May 10, 2016 18:37:01","height":2.02},{"Localtime":"2016-05-10 07:00:00","time":1462932000,"type":"NORMAL","utctime":"May 11, 2016 02:00:00","Rawtime":"May 10, 2016 19:00:00","height":2.051721},{"Localtime":"2016-05-10 07:40:32","time":1462934432,"type":"Sunset","utctime":"May 11, 2016 02:40:32","Rawtime":"May 10, 2016 19:40:32","height":0},{"Localtime":"2016-05-10 08:00:00","time":1462935600,"type":"NORMAL","utctime":"May 11, 2016 03:00:00","Rawtime":"May 10, 2016 20:00:00","height":2.381809},{"Localtime":"2016-05-10 09:00:00","time":1462939200,"type":"NORMAL","utctime":"May 11, 2016 04:00:00","Rawtime":"May 10, 2016 21:00:00","height":3.018406},{"Localtime":"2016-05-10 10:00:00","time":1462942800,"type":"NORMAL","utctime":"May 11, 2016 05:00:00","Rawtime":"May 10, 2016 22:00:00","height":3.813128},{"Localtime":"2016-05-10 11:00:00","time":1462946400,"type":"NORMAL","utctime":"May 11, 2016 06:00:00","Rawtime":"May 10, 2016 23:00:00","height":4.558118},{"Localtime":"2016-05-11 12:00:00","time":1462950000,"type":"NORMAL","utctime":"May 11, 2016 07:00:00","Rawtime":"May 11, 2016 00:00:00","height":5.044231},{"Localtime":"2016-05-11 12:40:06","time":1462952406,"type":"High","utctime":"May 11, 2016 07:40:06","Rawtime":"May 11, 2016 00:40:06","height":5.15},{"Localtime":"2016-05-11 01:00:00","time":1462953600,"type":"NORMAL","utctime":"May 11, 2016 08:00:00","Rawtime":"May 11, 2016 01:00:00","height":5.118615},{"Localtime":"2016-05-11 02:00:00","time":1462957200,"type":"NORMAL","utctime":"May 11, 2016 09:00:00","Rawtime":"May 11, 2016 02:00:00","height":4.723292},{"Localtime":"2016-05-11 03:00:00","time":1462960800,"type":"NORMAL","utctime":"May 11, 2016 10:00:00","Rawtime":"May 11, 2016 03:00:00","height":3.906037},{"Localtime":"2016-05-11 04:00:00","time":1462964400,"type":"NORMAL","utctime":"May 11, 2016 11:00:00","Rawtime":"May 11, 2016 04:00:00","height":2.80574},{"Localtime":"2016-05-11 05:00:00","time":1462968000,"type":"NORMAL","utctime":"May 11, 2016 12:00:00","Rawtime":"May 11, 2016 05:00:00","height":1.615688},{"Localtime":"2016-05-11 05:52:44","time":1462971164,"type":"Sunrise","utctime":"May 11, 2016 12:52:44","Rawtime":"May 11, 2016 05:52:44","height":0},{"Localtime":"2016-05-11 06:00:00","time":1462971600,"type":"NORMAL","utctime":"May 11, 2016 13:00:00","Rawtime":"May 11, 2016 06:00:00","height":0.554163},{"Localtime":"2016-05-11 07:00:00","time":1462975200,"type":"NORMAL","utctime":"May 11, 2016 14:00:00","Rawtime":"May 11, 2016 07:00:00","height":-0.187318},{"Localtime":"2016-05-11 08:00:00","time":1462978800,"type":"NORMAL","utctime":"May 11, 2016 15:00:00","Rawtime":"May 11, 2016 08:00:00","height":-0.480013},{"Localtime":"2016-05-11 08:05:54","time":1462979154,"type":"Low","utctime":"May 11, 2016 15:05:54","Rawtime":"May 11, 2016 08:05:54","height":-0.48},{"Localtime":"2016-05-11 09:00:00","time":1462982400,"type":"NORMAL","utctime":"May 11, 2016 16:00:00","Rawtime":"May 11, 2016 09:00:00","height":-0.287749},{"Localtime":"2016-05-11 10:00:00","time":1462986000,"type":"NORMAL","utctime":"May 11, 2016 17:00:00","Rawtime":"May 11, 2016 10:00:00","height":0.32317},{"Localtime":"2016-05-11 11:00:00","time":1462989600,"type":"NORMAL","utctime":"May 11, 2016 18:00:00","Rawtime":"May 11, 2016 11:00:00","height":1.199012},{"Localtime":"2016-05-11 12:00:00","time":1462993200,"type":"NORMAL","utctime":"May 11, 2016 19:00:00","Rawtime":"May 11, 2016 12:00:00","height":2.136562},{"Localtime":"2016-05-11 01:00:00","time":1462996800,"type":"NORMAL","utctime":"May 11, 2016 20:00:00","Rawtime":"May 11, 2016 13:00:00","height":2.94164},{"Localtime":"2016-05-11 02:00:00","time":1463000400,"type":"NORMAL","utctime":"May 11, 2016 21:00:00","Rawtime":"May 11, 2016 14:00:00","height":3.459062},{"Localtime":"2016-05-11 02:59:36","time":1463003976,"type":"High","utctime":"May 11, 2016 21:59:36","Rawtime":"May 11, 2016 14:59:36","height":3.63},{"Localtime":"2016-05-11 03:00:00","time":1463004000,"type":"NORMAL","utctime":"May 11, 2016 22:00:00","Rawtime":"May 11, 2016 15:00:00","height":3.625535},{"Localtime":"2016-05-11 04:00:00","time":1463007600,"type":"NORMAL","utctime":"May 11, 2016 23:00:00","Rawtime":"May 11, 2016 16:00:00","height":3.480071},{"Localtime":"2016-05-11 05:00:00","time":1463011200,"type":"NORMAL","utctime":"May 12, 2016 00:00:00","Rawtime":"May 11, 2016 17:00:00","height":3.133015},{"Localtime":"2016-05-11 06:00:00","time":1463014800,"type":"NORMAL","utctime":"May 12, 2016 01:00:00","Rawtime":"May 11, 2016 18:00:00","height":2.731618},{"Localtime":"2016-05-11 07:00:00","time":1463018400,"type":"NORMAL","utctime":"May 12, 2016 02:00:00","Rawtime":"May 11, 2016 19:00:00","height":2.424937},{"Localtime":"2016-05-11 07:41:17","time":1463020877,"type":"Sunset","utctime":"May 12, 2016 02:41:17","Rawtime":"May 11, 2016 19:41:17","height":0},{"Localtime":"2016-05-11 07:52:53","time":1463021573,"type":"Low","utctime":"May 12, 2016 02:52:53","Rawtime":"May 11, 2016 19:52:53","height":2.33},{"Localtime":"2016-05-11 08:00:00","time":1463022000,"type":"NORMAL","utctime":"May 12, 2016 03:00:00","Rawtime":"May 11, 2016 20:00:00","height":2.333259},{"Localtime":"2016-05-11 09:00:00","time":1463025600,"type":"NORMAL","utctime":"May 12, 2016 04:00:00","Rawtime":"May 11, 2016 21:00:00","height":2.51359},{"Localtime":"2016-05-11 10:00:00","time":1463029200,"type":"NORMAL","utctime":"May 12, 2016 05:00:00","Rawtime":"May 11, 2016 22:00:00","height":2.941609},{"Localtime":"2016-05-11 11:00:00","time":1463032800,"type":"NORMAL","utctime":"May 12, 2016 06:00:00","Rawtime":"May 11, 2016 23:00:00","height":3.514878},{"Localtime":"2016-05-12 12:00:00","time":1463036400,"type":"NORMAL","utctime":"May 12, 2016 07:00:00","Rawtime":"May 12, 2016 00:00:00","height":4.077797},{"Localtime":"2016-05-12 01:00:00","time":1463040000,"type":"NORMAL","utctime":"May 12, 2016 08:00:00","Rawtime":"May 12, 2016 01:00:00","height":4.464067},{"Localtime":"2016-05-12 01:43:40","time":1463042620,"type":"High","utctime":"May 12, 2016 08:43:40","Rawtime":"May 12, 2016 01:43:40","height":4.56},{"Localtime":"2016-05-12 02:00:00","time":1463043600,"type":"NORMAL","utctime":"May 12, 2016 09:00:00","Rawtime":"May 12, 2016 02:00:00","height":4.542669},{"Localtime":"2016-05-12 03:00:00","time":1463047200,"type":"NORMAL","utctime":"May 12, 2016 10:00:00","Rawtime":"May 12, 2016 03:00:00","height":4.253039},{"Localtime":"2016-05-12 04:00:00","time":1463050800,"type":"NORMAL","utctime":"May 12, 2016 11:00:00","Rawtime":"May 12, 2016 04:00:00","height":3.617607},{"Localtime":"2016-05-12 05:00:00","time":1463054400,"type":"NORMAL","utctime":"May 12, 2016 12:00:00","Rawtime":"May 12, 2016 05:00:00","height":2.734845},{"Localtime":"2016-05-12 05:51:58","time":1463057518,"type":"Sunrise","utctime":"May 12, 2016 12:51:58","Rawtime":"May 12, 2016 05:51:58","height":0},{"Localtime":"2016-05-12 06:00:00","time":1463058000,"type":"NORMAL","utctime":"May 12, 2016 13:00:00","Rawtime":"May 12, 2016 06:00:00","height":1.752425},{"Localtime":"2016-05-12 07:00:00","time":1463061600,"type":"NORMAL","utctime":"May 12, 2016 14:00:00","Rawtime":"May 12, 2016 07:00:00","height":0.848414},{"Localtime":"2016-05-12 08:00:00","time":1463065200,"type":"NORMAL","utctime":"May 12, 2016 15:00:00","Rawtime":"May 12, 2016 08:00:00","height":0.188229},{"Localtime":"2016-05-12 09:00:00","time":1463068800,"type":"NORMAL","utctime":"May 12, 2016 16:00:00","Rawtime":"May 12, 2016 09:00:00","height":-0.106506},{"Localtime":"2016-05-12 09:12:35","time":1463069555,"type":"Low","utctime":"May 12, 2016 16:12:35","Rawtime":"May 12, 2016 09:12:35","height":-0.12},{"Localtime":"2016-05-12 10:00:00","time":1463072400,"type":"NORMAL","utctime":"May 12, 2016 17:00:00","Rawtime":"May 12, 2016 10:00:00","height":0.01395},{"Localtime":"2016-05-12 11:00:00","time":1463076000,"type":"NORMAL","utctime":"May 12, 2016 18:00:00","Rawtime":"May 12, 2016 11:00:00","height":0.51464},{"Localtime":"2016-05-12 12:00:00","time":1463079600,"type":"NORMAL","utctime":"May 12, 2016 19:00:00","Rawtime":"May 12, 2016 12:00:00","height":1.281039},{"Localtime":"2016-05-12 01:00:00","time":1463083200,"type":"NORMAL","utctime":"May 12, 2016 20:00:00","Rawtime":"May 12, 2016 13:00:00","height":2.146235},{"Localtime":"2016-05-12 02:00:00","time":1463086800,"type":"NORMAL","utctime":"May 12, 2016 21:00:00","Rawtime":"May 12, 2016 14:00:00","height":2.935276},{"Localtime":"2016-05-12 03:00:00","time":1463090400,"type":"NORMAL","utctime":"May 12, 2016 22:00:00","Rawtime":"May 12, 2016 15:00:00","height":3.496908},{"Localtime":"2016-05-12 04:00:00","time":1463094000,"type":"NORMAL","utctime":"May 12, 2016 23:00:00","Rawtime":"May 12, 2016 16:00:00","height":3.747454},{"Localtime":"2016-05-12 04:17:58","time":1463095078,"type":"High","utctime":"May 12, 2016 23:17:58","Rawtime":"May 12, 2016 16:17:58","height":3.76},{"Localtime":"2016-05-12 05:00:00","time":1463097600,"type":"NORMAL","utctime":"May 13, 2016 00:00:00","Rawtime":"May 12, 2016 17:00:00","height":3.691738},{"Localtime":"2016-05-12 06:00:00","time":1463101200,"type":"NORMAL","utctime":"May 13, 2016 01:00:00","Rawtime":"May 12, 2016 18:00:00","height":3.405389},{"Localtime":"2016-05-12 07:00:00","time":1463104800,"type":"NORMAL","utctime":"May 13, 2016 02:00:00","Rawtime":"May 12, 2016 19:00:00","height":3.009426},{"Localtime":"2016-05-12 07:42:01","time":1463107321,"type":"Sunset","utctime":"May 13, 2016 02:42:01","Rawtime":"May 12, 2016 19:42:01","height":0},{"Localtime":"2016-05-12 08:00:00","time":1463108400,"type":"NORMAL","utctime":"May 13, 2016 03:00:00","Rawtime":"May 12, 2016 20:00:00","height":2.639471},{"Localtime":"2016-05-12 09:00:00","time":1463112000,"type":"NORMAL","utctime":"May 13, 2016 04:00:00","Rawtime":"May 12, 2016 21:00:00","height":2.415403},{"Localtime":"2016-05-12 09:32:03","time":1463113923,"type":"Low","utctime":"May 13, 2016 04:32:03","Rawtime":"May 12, 2016 21:32:03","height":2.38},{"Localtime":"2016-05-12 10:00:00","time":1463115600,"type":"NORMAL","utctime":"May 13, 2016 05:00:00","Rawtime":"May 12, 2016 22:00:00","height":2.415424},{"Localtime":"2016-05-12 11:00:00","time":1463119200,"type":"NORMAL","utctime":"May 13, 2016 06:00:00","Rawtime":"May 12, 2016 23:00:00","height":2.650858},{"Localtime":"2016-05-13 12:00:00","time":1463122800,"type":"NORMAL","utctime":"May 13, 2016 07:00:00","Rawtime":"May 13, 2016 00:00:00","height":3.062498},{"Localtime":"2016-05-13 01:00:00","time":1463126400,"type":"NORMAL","utctime":"May 13, 2016 08:00:00","Rawtime":"May 13, 2016 01:00:00","height":3.531145},{"Localtime":"2016-05-13 02:00:00","time":1463130000,"type":"NORMAL","utctime":"May 13, 2016 09:00:00","Rawtime":"May 13, 2016 02:00:00","height":3.910482},{"Localtime":"2016-05-13 03:00:00","time":1463133600,"type":"NORMAL","utctime":"May 13, 2016 10:00:00","Rawtime":"May 13, 2016 03:00:00","height":4.06852},{"Localtime":"2016-05-13 03:02:52","time":1463133772,"type":"High","utctime":"May 13, 2016 10:02:52","Rawtime":"May 13, 2016 03:02:52","height":4.07},{"Localtime":"2016-05-13 04:00:00","time":1463137200,"type":"NORMAL","utctime":"May 13, 2016 11:00:00","Rawtime":"May 13, 2016 04:00:00","height":3.924311},{"Localtime":"2016-05-13 05:00:00","time":1463140800,"type":"NORMAL","utctime":"May 13, 2016 12:00:00","Rawtime":"May 13, 2016 05:00:00","height":3.468901},{"Localtime":"2016-05-13 05:51:12","time":1463143872,"type":"Sunrise","utctime":"May 13, 2016 12:51:12","Rawtime":"May 13, 2016 05:51:12","height":0},{"Localtime":"2016-05-13 06:00:00","time":1463144400,"type":"NORMAL","utctime":"May 13, 2016 13:00:00","Rawtime":"May 13, 2016 06:00:00","height":2.765735},{"Localtime":"2016-05-13 07:00:00","time":1463148000,"type":"NORMAL","utctime":"May 13, 2016 14:00:00","Rawtime":"May 13, 2016 07:00:00","height":1.930031},{"Localtime":"2016-05-13 08:00:00","time":1463151600,"type":"NORMAL","utctime":"May 13, 2016 15:00:00","Rawtime":"May 13, 2016 08:00:00","height":1.118187},{"Localtime":"2016-05-13 09:00:00","time":1463155200,"type":"NORMAL","utctime":"May 13, 2016 16:00:00","Rawtime":"May 13, 2016 09:00:00","height":0.489718},{"Localtime":"2016-05-13 10:00:00","time":1463158800,"type":"NORMAL","utctime":"May 13, 2016 17:00:00","Rawtime":"May 13, 2016 10:00:00","height":0.17445},{"Localtime":"2016-05-13 10:19:53","time":1463159993,"type":"Low","utctime":"May 13, 2016 17:19:53","Rawtime":"May 13, 2016 10:19:53","height":0.15},{"Localtime":"2016-05-13 11:00:00","time":1463162400,"type":"NORMAL","utctime":"May 13, 2016 18:00:00","Rawtime":"May 13, 2016 11:00:00","height":0.242827},{"Localtime":"2016-05-13 12:00:00","time":1463166000,"type":"NORMAL","utctime":"May 13, 2016 19:00:00","Rawtime":"May 13, 2016 12:00:00","height":0.687103},{"Localtime":"2016-05-13 01:00:00","time":1463169600,"type":"NORMAL","utctime":"May 13, 2016 20:00:00","Rawtime":"May 13, 2016 13:00:00","height":1.417672},{"Localtime":"2016-05-13 02:00:00","time":1463173200,"type":"NORMAL","utctime":"May 13, 2016 21:00:00","Rawtime":"May 13, 2016 14:00:00","height":2.281171},{"Localtime":"2016-05-13 03:00:00","time":1463176800,"type":"NORMAL","utctime":"May 13, 2016 22:00:00","Rawtime":"May 13, 2016 15:00:00","height":3.100889},{"Localtime":"2016-05-13 04:00:00","time":1463180400,"type":"NORMAL","utctime":"May 13, 2016 23:00:00","Rawtime":"May 13, 2016 16:00:00","height":3.710649},{"Localtime":"2016-05-13 05:00:00","time":1463184000,"type":"NORMAL","utctime":"May 14, 2016 00:00:00","Rawtime":"May 13, 2016 17:00:00","height":4.004917},{"Localtime":"2016-05-13 05:21:53","time":1463185313,"type":"High","utctime":"May 14, 2016 00:21:53","Rawtime":"May 13, 2016 17:21:53","height":4.03},{"Localtime":"2016-05-13 06:00:00","time":1463187600,"type":"NORMAL","utctime":"May 14, 2016 01:00:00","Rawtime":"May 13, 2016 18:00:00","height":3.962677},{"Localtime":"2016-05-13 07:00:00","time":1463191200,"type":"NORMAL","utctime":"May 14, 2016 02:00:00","Rawtime":"May 13, 2016 19:00:00","height":3.641821},{"Localtime":"2016-05-13 07:42:46","time":1463193766,"type":"Sunset","utctime":"May 14, 2016 02:42:46","Rawtime":"May 13, 2016 19:42:46","height":0},{"Localtime":"2016-05-13 08:00:00","time":1463194800,"type":"NORMAL","utctime":"May 14, 2016 03:00:00","Rawtime":"May 13, 2016 20:00:00","height":3.157864},{"Localtime":"2016-05-13 09:00:00","time":1463198400,"type":"NORMAL","utctime":"May 14, 2016 04:00:00","Rawtime":"May 13, 2016 21:00:00","height":2.654424},{"Localtime":"2016-05-13 10:00:00","time":1463202000,"type":"NORMAL","utctime":"May 14, 2016 05:00:00","Rawtime":"May 13, 2016 22:00:00","height":2.270115},{"Localtime":"2016-05-13 11:00:00","time":1463205600,"type":"NORMAL","utctime":"May 14, 2016 06:00:00","Rawtime":"May 13, 2016 23:00:00","height":2.11091},{"Localtime":"2016-05-13 11:07:26","time":1463206046,"type":"Low","utctime":"May 14, 2016 06:07:26","Rawtime":"May 13, 2016 23:07:26","height":2.11},{"Localtime":"2016-05-14 12:00:00","time":1463209200,"type":"NORMAL","utctime":"May 14, 2016 07:00:00","Rawtime":"May 14, 2016 00:00:00","height":2.218647},{"Localtime":"2016-05-14 01:00:00","time":1463212800,"type":"NORMAL","utctime":"May 14, 2016 08:00:00","Rawtime":"May 14, 2016 01:00:00","height":2.558987},{"Localtime":"2016-05-14 02:00:00","time":1463216400,"type":"NORMAL","utctime":"May 14, 2016 09:00:00","Rawtime":"May 14, 2016 02:00:00","height":3.029843},{"Localtime":"2016-05-14 03:00:00","time":1463220000,"type":"NORMAL","utctime":"May 14, 2016 10:00:00","Rawtime":"May 14, 2016 03:00:00","height":3.479962},{"Localtime":"2016-05-14 04:00:00","time":1463223600,"type":"NORMAL","utctime":"May 14, 2016 11:00:00","Rawtime":"May 14, 2016 04:00:00","height":3.756949},{"Localtime":"2016-05-14 04:29:34","time":1463225374,"type":"High","utctime":"May 14, 2016 11:29:34","Rawtime":"May 14, 2016 04:29:34","height":3.79},{"Localtime":"2016-05-14 05:00:00","time":1463227200,"type":"NORMAL","utctime":"May 14, 2016 12:00:00","Rawtime":"May 14, 2016 05:00:00","height":3.752179},{"Localtime":"2016-05-14 05:50:29","time":1463230229,"type":"Sunrise","utctime":"May 14, 2016 12:50:29","Rawtime":"May 14, 2016 05:50:29","height":0},{"Localtime":"2016-05-14 06:00:00","time":1463230800,"type":"NORMAL","utctime":"May 14, 2016 13:00:00","Rawtime":"May 14, 2016 06:00:00","height":3.430281},{"Localtime":"2016-05-14 07:00:00","time":1463234400,"type":"NORMAL","utctime":"May 14, 2016 14:00:00","Rawtime":"May 14, 2016 07:00:00","height":2.835367},{"Localtime":"2016-05-14 08:00:00","time":1463238000,"type":"NORMAL","utctime":"May 14, 2016 15:00:00","Rawtime":"May 14, 2016 08:00:00","height":2.073039},{"Localtime":"2016-05-14 09:00:00","time":1463241600,"type":"NORMAL","utctime":"May 14, 2016 16:00:00","Rawtime":"May 14, 2016 09:00:00","height":1.296992},{"Localtime":"2016-05-14 10:00:00","time":1463245200,"type":"NORMAL","utctime":"May 14, 2016 17:00:00","Rawtime":"May 14, 2016 10:00:00","height":0.677814},{"Localtime":"2016-05-14 11:00:00","time":1463248800,"type":"NORMAL","utctime":"May 14, 2016 18:00:00","Rawtime":"May 14, 2016 11:00:00","height":0.360482},{"Localtime":"2016-05-14 11:19:43","time":1463249983,"type":"Low","utctime":"May 14, 2016 18:19:43","Rawtime":"May 14, 2016 11:19:43","height":0.34},{"Localtime":"2016-05-14 12:00:00","time":1463252400,"type":"NORMAL","utctime":"May 14, 2016 19:00:00","Rawtime":"May 14, 2016 12:00:00","height":0.432538},{"Localtime":"2016-05-14 01:00:00","time":1463256000,"type":"NORMAL","utctime":"May 14, 2016 20:00:00","Rawtime":"May 14, 2016 13:00:00","height":0.898239},{"Localtime":"2016-05-14 02:00:00","time":1463259600,"type":"NORMAL","utctime":"May 14, 2016 21:00:00","Rawtime":"May 14, 2016 14:00:00","height":1.66998},{"Localtime":"2016-05-14 03:00:00","time":1463263200,"type":"NORMAL","utctime":"May 14, 2016 22:00:00","Rawtime":"May 14, 2016 15:00:00","height":2.584393},{"Localtime":"2016-05-14 04:00:00","time":1463266800,"type":"NORMAL","utctime":"May 14, 2016 23:00:00","Rawtime":"May 14, 2016 16:00:00","height":3.444612},{"Localtime":"2016-05-14 05:00:00","time":1463270400,"type":"NORMAL","utctime":"May 15, 2016 00:00:00","Rawtime":"May 14, 2016 17:00:00","height":4.064149},{"Localtime":"2016-05-14 06:00:00","time":1463274000,"type":"NORMAL","utctime":"May 15, 2016 01:00:00","Rawtime":"May 14, 2016 18:00:00","height":4.323767},{"Localtime":"2016-05-14 06:09:45","time":1463274585,"type":"High","utctime":"May 15, 2016 01:09:45","Rawtime":"May 14, 2016 18:09:45","height":4.33},{"Localtime":"2016-05-14 07:00:00","time":1463277600,"type":"NORMAL","utctime":"May 15, 2016 02:00:00","Rawtime":"May 14, 2016 19:00:00","height":4.19646},{"Localtime":"2016-05-14 07:43:30","time":1463280210,"type":"Sunset","utctime":"May 15, 2016 02:43:30","Rawtime":"May 14, 2016 19:43:30","height":0},{"Localtime":"2016-05-14 08:00:00","time":1463281200,"type":"NORMAL","utctime":"May 15, 2016 03:00:00","Rawtime":"May 14, 2016 20:00:00","height":3.745886},{"Localtime":"2016-05-14 09:00:00","time":1463284800,"type":"NORMAL","utctime":"May 15, 2016 04:00:00","Rawtime":"May 14, 2016 21:00:00","height":3.10434},{"Localtime":"2016-05-14 10:00:00","time":1463288400,"type":"NORMAL","utctime":"May 15, 2016 05:00:00","Rawtime":"May 14, 2016 22:00:00","height":2.44061},{"Localtime":"2016-05-14 11:00:00","time":1463292000,"type":"NORMAL","utctime":"May 15, 2016 06:00:00","Rawtime":"May 14, 2016 23:00:00","height":1.922004},{"Localtime":"2016-05-15 12:00:00","time":1463295600,"type":"NORMAL","utctime":"May 15, 2016 07:00:00","Rawtime":"May 15, 2016 00:00:00","height":1.666346},{"Localtime":"2016-05-15 12:17:18","time":1463296638,"type":"Low","utctime":"May 15, 2016 07:17:18","Rawtime":"May 15, 2016 00:17:18","height":1.65},{"Localtime":"2016-05-15 01:00:00","time":1463299200,"type":"NORMAL","utctime":"May 15, 2016 08:00:00","Rawtime":"May 15, 2016 01:00:00","height":1.736395},{"Localtime":"2016-05-15 02:00:00","time":1463302800,"type":"NORMAL","utctime":"May 15, 2016 09:00:00","Rawtime":"May 15, 2016 02:00:00","height":2.107844},{"Localtime":"2016-05-15 03:00:00","time":1463306400,"type":"NORMAL","utctime":"May 15, 2016 10:00:00","Rawtime":"May 15, 2016 03:00:00","height":2.664734},{"Localtime":"2016-05-15 04:00:00","time":1463310000,"type":"NORMAL","utctime":"May 15, 2016 11:00:00","Rawtime":"May 15, 2016 04:00:00","height":3.228661},{"Localtime":"2016-05-15 05:00:00","time":1463313600,"type":"NORMAL","utctime":"May 15, 2016 12:00:00","Rawtime":"May 15, 2016 05:00:00","height":3.620053},{"Localtime":"2016-05-15 05:45:13","time":1463316313,"type":"High","utctime":"May 15, 2016 12:45:13","Rawtime":"May 15, 2016 05:45:13","height":3.72},{"Localtime":"2016-05-15 05:49:46","time":1463316586,"type":"Sunrise","utctime":"May 15, 2016 12:49:46","Rawtime":"May 15, 2016 05:49:46","height":0},{"Localtime":"2016-05-15 06:00:00","time":1463317200,"type":"NORMAL","utctime":"May 15, 2016 13:00:00","Rawtime":"May 15, 2016 06:00:00","height":3.707178},{"Localtime":"2016-05-15 07:00:00","time":1463320800,"type":"NORMAL","utctime":"May 15, 2016 14:00:00","Rawtime":"May 15, 2016 07:00:00","height":3.44419},{"Localtime":"2016-05-15 08:00:00","time":1463324400,"type":"NORMAL","utctime":"May 15, 2016 15:00:00","Rawtime":"May 15, 2016 08:00:00","height":2.877897},{"Localtime":"2016-05-15 09:00:00","time":1463328000,"type":"NORMAL","utctime":"May 15, 2016 16:00:00","Rawtime":"May 15, 2016 09:00:00","height":2.125937},{"Localtime":"2016-05-15 10:00:00","time":1463331600,"type":"NORMAL","utctime":"May 15, 2016 17:00:00","Rawtime":"May 15, 2016 10:00:00","height":1.357283},{"Localtime":"2016-05-15 11:00:00","time":1463335200,"type":"NORMAL","utctime":"May 15, 2016 18:00:00","Rawtime":"May 15, 2016 11:00:00","height":0.760363},{"Localtime":"2016-05-15 12:00:00","time":1463338800,"type":"NORMAL","utctime":"May 15, 2016 19:00:00","Rawtime":"May 15, 2016 12:00:00","height":0.49252},{"Localtime":"2016-05-15 12:09:11","time":1463339351,"type":"Low","utctime":"May 15, 2016 19:09:11","Rawtime":"May 15, 2016 12:09:11","height":0.49},{"Localtime":"2016-05-15 01:00:00","time":1463342400,"type":"NORMAL","utctime":"May 15, 2016 20:00:00","Rawtime":"May 15, 2016 13:00:00","height":0.644297},{"Localtime":"2016-05-15 02:00:00","time":1463346000,"type":"NORMAL","utctime":"May 15, 2016 21:00:00","Rawtime":"May 15, 2016 14:00:00","height":1.210239},{"Localtime":"2016-05-15 03:00:00","time":1463349600,"type":"NORMAL","utctime":"May 15, 2016 22:00:00","Rawtime":"May 15, 2016 15:00:00","height":2.079837},{"Localtime":"2016-05-15 04:00:00","time":1463353200,"type":"NORMAL","utctime":"May 15, 2016 23:00:00","Rawtime":"May 15, 2016 16:00:00","height":3.059853},{"Localtime":"2016-05-15 05:00:00","time":1463356800,"type":"NORMAL","utctime":"May 16, 2016 00:00:00","Rawtime":"May 15, 2016 17:00:00","height":3.924977},{"Localtime":"2016-05-15 06:00:00","time":1463360400,"type":"NORMAL","utctime":"May 16, 2016 01:00:00","Rawtime":"May 15, 2016 18:00:00","height":4.478186},{"Localtime":"2016-05-15 06:47:02","time":1463363222,"type":"High","utctime":"May 16, 2016 01:47:02","Rawtime":"May 15, 2016 18:47:02","height":4.62},{"Localtime":"2016-05-15 07:00:00","time":1463364000,"type":"NORMAL","utctime":"May 16, 2016 02:00:00","Rawtime":"May 15, 2016 19:00:00","height":4.60478},{"Localtime":"2016-05-15 07:44:14","time":1463366654,"type":"Sunset","utctime":"May 16, 2016 02:44:14","Rawtime":"May 15, 2016 19:44:14","height":0},{"Localtime":"2016-05-15 08:00:00","time":1463367600,"type":"NORMAL","utctime":"May 16, 2016 03:00:00","Rawtime":"May 15, 2016 20:00:00","height":4.296421},{"Localtime":"2016-05-15 09:00:00","time":1463371200,"type":"NORMAL","utctime":"May 16, 2016 04:00:00","Rawtime":"May 15, 2016 21:00:00","height":3.645935},{"Localtime":"2016-05-15 10:00:00","time":1463374800,"type":"NORMAL","utctime":"May 16, 2016 05:00:00","Rawtime":"May 15, 2016 22:00:00","height":2.818459},{"Localtime":"2016-05-15 11:00:00","time":1463378400,"type":"NORMAL","utctime":"May 16, 2016 06:00:00","Rawtime":"May 15, 2016 23:00:00","height":2.015687},{"Localtime":"2016-05-16 12:00:00","time":1463382000,"type":"NORMAL","utctime":"May 16, 2016 07:00:00","Rawtime":"May 16, 2016 00:00:00","height":1.420761},{"Localtime":"2016-05-16 01:00:00","time":1463385600,"type":"NORMAL","utctime":"May 16, 2016 08:00:00","Rawtime":"May 16, 2016 01:00:00","height":1.168134},{"Localtime":"2016-05-16 01:08:24","time":1463386104,"type":"Low","utctime":"May 16, 2016 08:08:24","Rawtime":"May 16, 2016 01:08:24","height":1.16},{"Localtime":"2016-05-16 02:00:00","time":1463389200,"type":"NORMAL","utctime":"May 16, 2016 09:00:00","Rawtime":"May 16, 2016 02:00:00","height":1.312029},{"Localtime":"2016-05-16 03:00:00","time":1463392800,"type":"NORMAL","utctime":"May 16, 2016 10:00:00","Rawtime":"May 16, 2016 03:00:00","height":1.80237},{"Localtime":"2016-05-16 04:00:00","time":1463396400,"type":"NORMAL","utctime":"May 16, 2016 11:00:00","Rawtime":"May 16, 2016 04:00:00","height":2.489735},{"Localtime":"2016-05-16 05:00:00","time":1463400000,"type":"NORMAL","utctime":"May 16, 2016 12:00:00","Rawtime":"May 16, 2016 05:00:00","height":3.166463},{"Localtime":"2016-05-16 05:49:05","time":1463402945,"type":"Sunrise","utctime":"May 16, 2016 12:49:05","Rawtime":"May 16, 2016 05:49:05","height":0},{"Localtime":"2016-05-16 06:00:00","time":1463403600,"type":"NORMAL","utctime":"May 16, 2016 13:00:00","Rawtime":"May 16, 2016 06:00:00","height":3.625689},{"Localtime":"2016-05-16 06:46:05","time":1463406365,"type":"High","utctime":"May 16, 2016 13:46:05","Rawtime":"May 16, 2016 06:46:05","height":3.74},{"Localtime":"2016-05-16 07:00:00","time":1463407200,"type":"NORMAL","utctime":"May 16, 2016 14:00:00","Rawtime":"May 16, 2016 07:00:00","height":3.729494},{"Localtime":"2016-05-16 08:00:00","time":1463410800,"type":"NORMAL","utctime":"May 16, 2016 15:00:00","Rawtime":"May 16, 2016 08:00:00","height":3.444762},{"Localtime":"2016-05-16 09:00:00","time":1463414400,"type":"NORMAL","utctime":"May 16, 2016 16:00:00","Rawtime":"May 16, 2016 09:00:00","height":2.842549},{"Localtime":"2016-05-16 10:00:00","time":1463418000,"type":"NORMAL","utctime":"May 16, 2016 17:00:00","Rawtime":"May 16, 2016 10:00:00","height":2.067608},{"Localtime":"2016-05-16 11:00:00","time":1463421600,"type":"NORMAL","utctime":"May 16, 2016 18:00:00","Rawtime":"May 16, 2016 11:00:00","height":1.314359},{"Localtime":"2016-05-16 12:00:00","time":1463425200,"type":"NORMAL","utctime":"May 16, 2016 19:00:00","Rawtime":"May 16, 2016 12:00:00","height":0.785126},{"Localtime":"2016-05-16 12:50:09","time":1463428209,"type":"Low","utctime":"May 16, 2016 19:50:09","Rawtime":"May 16, 2016 12:50:09","height":0.63},{"Localtime":"2016-05-16 01:00:00","time":1463428800,"type":"NORMAL","utctime":"May 16, 2016 20:00:00","Rawtime":"May 16, 2016 13:00:00","height":0.637072},{"Localtime":"2016-05-16 02:00:00","time":1463432400,"type":"NORMAL","utctime":"May 16, 2016 21:00:00","Rawtime":"May 16, 2016 14:00:00","height":0.944002},{"Localtime":"2016-05-16 03:00:00","time":1463436000,"type":"NORMAL","utctime":"May 16, 2016 22:00:00","Rawtime":"May 16, 2016 15:00:00","height":1.666528},{"Localtime":"2016-05-16 04:00:00","time":1463439600,"type":"NORMAL","utctime":"May 16, 2016 23:00:00","Rawtime":"May 16, 2016 16:00:00","height":2.650776},{"Localtime":"2016-05-16 05:00:00","time":1463443200,"type":"NORMAL","utctime":"May 17, 2016 00:00:00","Rawtime":"May 16, 2016 17:00:00","height":3.66222},{"Localtime":"2016-05-16 06:00:00","time":1463446800,"type":"NORMAL","utctime":"May 17, 2016 01:00:00","Rawtime":"May 16, 2016 18:00:00","height":4.458813},{"Localtime":"2016-05-16 07:00:00","time":1463450400,"type":"NORMAL","utctime":"May 17, 2016 02:00:00","Rawtime":"May 16, 2016 19:00:00","height":4.850162},{"Localtime":"2016-05-16 07:18:00","time":1463451480,"type":"High","utctime":"May 17, 2016 02:18:00","Rawtime":"May 16, 2016 19:18:00","height":4.87},{"Localtime":"2016-05-16 07:44:57","time":1463453097,"type":"Sunset","utctime":"May 17, 2016 02:44:57","Rawtime":"May 16, 2016 19:44:57","height":0},{"Localtime":"2016-05-16 08:00:00","time":1463454000,"type":"NORMAL","utctime":"May 17, 2016 03:00:00","Rawtime":"May 16, 2016 20:00:00","height":4.749873},{"Localtime":"2016-05-16 09:00:00","time":1463457600,"type":"NORMAL","utctime":"May 17, 2016 04:00:00","Rawtime":"May 16, 2016 21:00:00","height":4.191944},{"Localtime":"2016-05-16 10:00:00","time":1463461200,"type":"NORMAL","utctime":"May 17, 2016 05:00:00","Rawtime":"May 16, 2016 22:00:00","height":3.313813},{"Localtime":"2016-05-16 11:00:00","time":1463464800,"type":"NORMAL","utctime":"May 17, 2016 06:00:00","Rawtime":"May 16, 2016 23:00:00","height":2.321121},{"Localtime":"2016-05-17 12:00:00","time":1463468400,"type":"NORMAL","utctime":"May 17, 2016 07:00:00","Rawtime":"May 17, 2016 00:00:00","height":1.440536},{"Localtime":"2016-05-17 01:00:00","time":1463472000,"type":"NORMAL","utctime":"May 17, 2016 08:00:00","Rawtime":"May 17, 2016 01:00:00","height":0.864263},{"Localtime":"2016-05-17 01:49:00","time":1463474940,"type":"Low","utctime":"May 17, 2016 08:49:00","Rawtime":"May 17, 2016 01:49:00","height":0.71},{"Localtime":"2016-05-17 02:00:00","time":1463475600,"type":"NORMAL","utctime":"May 17, 2016 09:00:00","Rawtime":"May 17, 2016 02:00:00","height":0.718953},{"Localtime":"2016-05-17 03:00:00","time":1463479200,"type":"NORMAL","utctime":"May 17, 2016 10:00:00","Rawtime":"May 17, 2016 03:00:00","height":1.026089},{"Localtime":"2016-05-17 04:00:00","time":1463482800,"type":"NORMAL","utctime":"May 17, 2016 11:00:00","Rawtime":"May 17, 2016 04:00:00","height":1.688493},{"Localtime":"2016-05-17 05:00:00","time":1463486400,"type":"NORMAL","utctime":"May 17, 2016 12:00:00","Rawtime":"May 17, 2016 05:00:00","height":2.510654},{"Localtime":"2016-05-17 05:48:26","time":1463489306,"type":"Sunrise","utctime":"May 17, 2016 12:48:26","Rawtime":"May 17, 2016 05:48:26","height":0},{"Localtime":"2016-05-17 06:00:00","time":1463490000,"type":"NORMAL","utctime":"May 17, 2016 13:00:00","Rawtime":"May 17, 2016 06:00:00","height":3.25726},{"Localtime":"2016-05-17 07:00:00","time":1463493600,"type":"NORMAL","utctime":"May 17, 2016 14:00:00","Rawtime":"May 17, 2016 07:00:00","height":3.709824},{"Localtime":"2016-05-17 07:35:29","time":1463495729,"type":"High","utctime":"May 17, 2016 14:35:29","Rawtime":"May 17, 2016 07:35:29","height":3.79},{"Localtime":"2016-05-17 08:00:00","time":1463497200,"type":"NORMAL","utctime":"May 17, 2016 15:00:00","Rawtime":"May 17, 2016 08:00:00","height":3.749286},{"Localtime":"2016-05-17 09:00:00","time":1463500800,"type":"NORMAL","utctime":"May 17, 2016 16:00:00","Rawtime":"May 17, 2016 09:00:00","height":3.378436},{"Localtime":"2016-05-17 10:00:00","time":1463504400,"type":"NORMAL","utctime":"May 17, 2016 17:00:00","Rawtime":"May 17, 2016 10:00:00","height":2.70743},{"Localtime":"2016-05-17 11:00:00","time":1463508000,"type":"NORMAL","utctime":"May 17, 2016 18:00:00","Rawtime":"May 17, 2016 11:00:00","height":1.914608},{"Localtime":"2016-05-17 12:00:00","time":1463511600,"type":"NORMAL","utctime":"May 17, 2016 19:00:00","Rawtime":"May 17, 2016 12:00:00","height":1.218042},{"Localtime":"2016-05-17 01:00:00","time":1463515200,"type":"NORMAL","utctime":"May 17, 2016 20:00:00","Rawtime":"May 17, 2016 13:00:00","height":0.820876},{"Localtime":"2016-05-17 01:25:00","time":1463516700,"type":"Low","utctime":"May 17, 2016 20:25:00","Rawtime":"May 17, 2016 13:25:00","height":0.78},{"Localtime":"2016-05-17 02:00:00","time":1463518800,"type":"NORMAL","utctime":"May 17, 2016 21:00:00","Rawtime":"May 17, 2016 14:00:00","height":0.862866},{"Localtime":"2016-05-17 03:00:00","time":1463522400,"type":"NORMAL","utctime":"May 17, 2016 22:00:00","Rawtime":"May 17, 2016 15:00:00","height":1.378327},{"Localtime":"2016-05-17 04:00:00","time":1463526000,"type":"NORMAL","utctime":"May 17, 2016 23:00:00","Rawtime":"May 17, 2016 16:00:00","height":2.274129},{"Localtime":"2016-05-17 05:00:00","time":1463529600,"type":"NORMAL","utctime":"May 18, 2016 00:00:00","Rawtime":"May 17, 2016 17:00:00","height":3.337766},{"Localtime":"2016-05-17 06:00:00","time":1463533200,"type":"NORMAL","utctime":"May 18, 2016 01:00:00","Rawtime":"May 17, 2016 18:00:00","height":4.308375},{"Localtime":"2016-05-17 07:00:00","time":1463536800,"type":"NORMAL","utctime":"May 18, 2016 02:00:00","Rawtime":"May 17, 2016 19:00:00","height":4.942255},{"Localtime":"2016-05-17 07:45:39","time":1463539539,"type":"High","utctime":"May 18, 2016 02:45:39","Rawtime":"May 17, 2016 19:45:39","height":5.1},{"Localtime":"2016-05-17 07:45:41","time":1463539541,"type":"Sunset","utctime":"May 18, 2016 02:45:41","Rawtime":"May 17, 2016 19:45:41","height":0},{"Localtime":"2016-05-17 08:00:00","time":1463540400,"type":"NORMAL","utctime":"May 18, 2016 03:00:00","Rawtime":"May 17, 2016 20:00:00","height":5.08045},{"Localtime":"2016-05-17 09:00:00","time":1463544000,"type":"NORMAL","utctime":"May 18, 2016 04:00:00","Rawtime":"May 17, 2016 21:00:00","height":4.688141},{"Localtime":"2016-05-17 10:00:00","time":1463547600,"type":"NORMAL","utctime":"May 18, 2016 05:00:00","Rawtime":"May 17, 2016 22:00:00","height":3.856249},{"Localtime":"2016-05-17 11:00:00","time":1463551200,"type":"NORMAL","utctime":"May 18, 2016 06:00:00","Rawtime":"May 17, 2016 23:00:00","height":2.773079},{"Localtime":"2016-05-18 12:00:00","time":1463554800,"type":"NORMAL","utctime":"May 18, 2016 07:00:00","Rawtime":"May 18, 2016 00:00:00","height":1.679198},{"Localtime":"2016-05-18 01:00:00","time":1463558400,"type":"NORMAL","utctime":"May 18, 2016 08:00:00","Rawtime":"May 18, 2016 01:00:00","height":0.811903},{"Localtime":"2016-05-18 02:00:00","time":1463562000,"type":"NORMAL","utctime":"May 18, 2016 09:00:00","Rawtime":"May 18, 2016 02:00:00","height":0.357415},{"Localtime":"2016-05-18 02:24:01","time":1463563441,"type":"Low","utctime":"May 18, 2016 09:24:01","Rawtime":"May 18, 2016 02:24:01","height":0.32},{"Localtime":"2016-05-18 03:00:00","time":1463565600,"type":"NORMAL","utctime":"May 18, 2016 10:00:00","Rawtime":"May 18, 2016 03:00:00","height":0.407796},{"Localtime":"2016-05-18 04:00:00","time":1463569200,"type":"NORMAL","utctime":"May 18, 2016 11:00:00","Rawtime":"May 18, 2016 04:00:00","height":0.930624},{"Localtime":"2016-05-18 05:00:00","time":1463572800,"type":"NORMAL","utctime":"May 18, 2016 12:00:00","Rawtime":"May 18, 2016 05:00:00","height":1.77026},{"Localtime":"2016-05-18 05:47:48","time":1463575668,"type":"Sunrise","utctime":"May 18, 2016 12:47:48","Rawtime":"May 18, 2016 05:47:48","height":0},{"Localtime":"2016-05-18 06:00:00","time":1463576400,"type":"NORMAL","utctime":"May 18, 2016 13:00:00","Rawtime":"May 18, 2016 06:00:00","height":2.687749},{"Localtime":"2016-05-18 07:00:00","time":1463580000,"type":"NORMAL","utctime":"May 18, 2016 14:00:00","Rawtime":"May 18, 2016 07:00:00","height":3.431406},{"Localtime":"2016-05-18 08:00:00","time":1463583600,"type":"NORMAL","utctime":"May 18, 2016 15:00:00","Rawtime":"May 18, 2016 08:00:00","height":3.796263},{"Localtime":"2016-05-18 08:18:01","time":1463584681,"type":"High","utctime":"May 18, 2016 15:18:01","Rawtime":"May 18, 2016 08:18:01","height":3.82},{"Localtime":"2016-05-18 09:00:00","time":1463587200,"type":"NORMAL","utctime":"May 18, 2016 16:00:00","Rawtime":"May 18, 2016 09:00:00","height":3.707484},{"Localtime":"2016-05-18 10:00:00","time":1463590800,"type":"NORMAL","utctime":"May 18, 2016 17:00:00","Rawtime":"May 18, 2016 10:00:00","height":3.219143},{"Localtime":"2016-05-18 11:00:00","time":1463594400,"type":"NORMAL","utctime":"May 18, 2016 18:00:00","Rawtime":"May 18, 2016 11:00:00","height":2.485196},{"Localtime":"2016-05-18 12:00:00","time":1463598000,"type":"NORMAL","utctime":"May 18, 2016 19:00:00","Rawtime":"May 18, 2016 12:00:00","height":1.71478},{"Localtime":"2016-05-18 01:00:00","time":1463601600,"type":"NORMAL","utctime":"May 18, 2016 20:00:00","Rawtime":"May 18, 2016 13:00:00","height":1.136217},{"Localtime":"2016-05-18 01:55:57","time":1463604957,"type":"Low","utctime":"May 18, 2016 20:55:57","Rawtime":"May 18, 2016 13:55:57","height":0.94},{"Localtime":"2016-05-18 02:00:00","time":1463605200,"type":"NORMAL","utctime":"May 18, 2016 21:00:00","Rawtime":"May 18, 2016 14:00:00","height":0.937155},{"Localtime":"2016-05-18 03:00:00","time":1463608800,"type":"NORMAL","utctime":"May 18, 2016 22:00:00","Rawtime":"May 18, 2016 15:00:00","height":1.219202},{"Localtime":"2016-05-18 04:00:00","time":1463612400,"type":"NORMAL","utctime":"May 18, 2016 23:00:00","Rawtime":"May 18, 2016 16:00:00","height":1.958071},{"Localtime":"2016-05-18 05:00:00","time":1463616000,"type":"NORMAL","utctime":"May 19, 2016 00:00:00","Rawtime":"May 18, 2016 17:00:00","height":2.991219},{"Localtime":"2016-05-18 06:00:00","time":1463619600,"type":"NORMAL","utctime":"May 19, 2016 01:00:00","Rawtime":"May 18, 2016 18:00:00","height":4.059824},{"Localtime":"2016-05-18 07:00:00","time":1463623200,"type":"NORMAL","utctime":"May 19, 2016 02:00:00","Rawtime":"May 18, 2016 19:00:00","height":4.894292},{"Localtime":"2016-05-18 07:46:23","time":1463625983,"type":"Sunset","utctime":"May 19, 2016 02:46:23","Rawtime":"May 18, 2016 19:46:23","height":0},{"Localtime":"2016-05-18 08:00:00","time":1463626800,"type":"NORMAL","utctime":"May 19, 2016 03:00:00","Rawtime":"May 18, 2016 20:00:00","height":5.275171},{"Localtime":"2016-05-18 08:11:27","time":1463627487,"type":"High","utctime":"May 19, 2016 03:11:27","Rawtime":"May 18, 2016 20:11:27","height":5.29},{"Localtime":"2016-05-18 09:00:00","time":1463630400,"type":"NORMAL","utctime":"May 19, 2016 04:00:00","Rawtime":"May 18, 2016 21:00:00","height":5.09773},{"Localtime":"2016-05-18 10:00:00","time":1463634000,"type":"NORMAL","utctime":"May 19, 2016 05:00:00","Rawtime":"May 18, 2016 22:00:00","height":4.393292},{"Localtime":"2016-05-18 11:00:00","time":1463637600,"type":"NORMAL","utctime":"May 19, 2016 06:00:00","Rawtime":"May 18, 2016 23:00:00","height":3.313907},{"Localtime":"2016-05-19 12:00:00","time":1463641200,"type":"NORMAL","utctime":"May 19, 2016 07:00:00","Rawtime":"May 19, 2016 00:00:00","height":2.091836},{"Localtime":"2016-05-19 01:00:00","time":1463644800,"type":"NORMAL","utctime":"May 19, 2016 08:00:00","Rawtime":"May 19, 2016 01:00:00","height":0.989243},{"Localtime":"2016-05-19 02:00:00","time":1463648400,"type":"NORMAL","utctime":"May 19, 2016 09:00:00","Rawtime":"May 19, 2016 02:00:00","height":0.23753},{"Localtime":"2016-05-19 02:56:48","time":1463651808,"type":"Low","utctime":"May 19, 2016 09:56:48","Rawtime":"May 19, 2016 02:56:48","height":-0.01},{"Localtime":"2016-05-19 03:00:00","time":1463652000,"type":"NORMAL","utctime":"May 19, 2016 10:00:00","Rawtime":"May 19, 2016 03:00:00","height":-0.007631},{"Localtime":"2016-05-19 04:00:00","time":1463655600,"type":"NORMAL","utctime":"May 19, 2016 11:00:00","Rawtime":"May 19, 2016 04:00:00","height":0.290453},{"Localtime":"2016-05-19 05:00:00","time":1463659200,"type":"NORMAL","utctime":"May 19, 2016 12:00:00","Rawtime":"May 19, 2016 05:00:00","height":1.03336},{"Localtime":"2016-05-19 05:47:11","time":1463662031,"type":"Sunrise","utctime":"May 19, 2016 12:47:11","Rawtime":"May 19, 2016 05:47:11","height":0},{"Localtime":"2016-05-19 06:00:00","time":1463662800,"type":"NORMAL","utctime":"May 19, 2016 13:00:00","Rawtime":"May 19, 2016 06:00:00","height":2.008074},{"Localtime":"2016-05-19 07:00:00","time":1463666400,"type":"NORMAL","utctime":"May 19, 2016 14:00:00","Rawtime":"May 19, 2016 07:00:00","height":2.949985},{"Localtime":"2016-05-19 08:00:00","time":1463670000,"type":"NORMAL","utctime":"May 19, 2016 15:00:00","Rawtime":"May 19, 2016 08:00:00","height":3.607122},{"Localtime":"2016-05-19 08:56:46","time":1463673406,"type":"High","utctime":"May 19, 2016 15:56:46","Rawtime":"May 19, 2016 08:56:46","height":3.82},{"Localtime":"2016-05-19 09:00:00","time":1463673600,"type":"NORMAL","utctime":"May 19, 2016 16:00:00","Rawtime":"May 19, 2016 09:00:00","height":3.819473},{"Localtime":"2016-05-19 10:00:00","time":1463677200,"type":"NORMAL","utctime":"May 19, 2016 17:00:00","Rawtime":"May 19, 2016 10:00:00","height":3.57219},{"Localtime":"2016-05-19 11:00:00","time":1463680800,"type":"NORMAL","utctime":"May 19, 2016 18:00:00","Rawtime":"May 19, 2016 11:00:00","height":2.974737},{"Localtime":"2016-05-19 12:00:00","time":1463684400,"type":"NORMAL","utctime":"May 19, 2016 19:00:00","Rawtime":"May 19, 2016 12:00:00","height":2.218461},{"Localtime":"2016-05-19 01:00:00","time":1463688000,"type":"NORMAL","utctime":"May 19, 2016 20:00:00","Rawtime":"May 19, 2016 13:00:00","height":1.532975},{"Localtime":"2016-05-19 02:00:00","time":1463691600,"type":"NORMAL","utctime":"May 19, 2016 21:00:00","Rawtime":"May 19, 2016 14:00:00","height":1.136387},{"Localtime":"2016-05-19 02:24:27","time":1463693067,"type":"Low","utctime":"May 19, 2016 21:24:27","Rawtime":"May 19, 2016 14:24:27","height":1.1},{"Localtime":"2016-05-19 03:00:00","time":1463695200,"type":"NORMAL","utctime":"May 19, 2016 22:00:00","Rawtime":"May 19, 2016 15:00:00","height":1.18394},{"Localtime":"2016-05-19 04:00:00","time":1463698800,"type":"NORMAL","utctime":"May 19, 2016 23:00:00","Rawtime":"May 19, 2016 16:00:00","height":1.720529},{"Localtime":"2016-05-19 05:00:00","time":1463702400,"type":"NORMAL","utctime":"May 20, 2016 00:00:00","Rawtime":"May 19, 2016 17:00:00","height":2.650189},{"Localtime":"2016-05-19 06:00:00","time":1463706000,"type":"NORMAL","utctime":"May 20, 2016 01:00:00","Rawtime":"May 19, 2016 18:00:00","height":3.739321},{"Localtime":"2016-05-19 07:00:00","time":1463709600,"type":"NORMAL","utctime":"May 20, 2016 02:00:00","Rawtime":"May 19, 2016 19:00:00","height":4.717116},{"Localtime":"2016-05-19 07:47:06","time":1463712426,"type":"Sunset","utctime":"May 20, 2016 02:47:06","Rawtime":"May 19, 2016 19:47:06","height":0},{"Localtime":"2016-05-19 08:00:00","time":1463713200,"type":"NORMAL","utctime":"May 20, 2016 03:00:00","Rawtime":"May 19, 2016 20:00:00","height":5.322709},{"Localtime":"2016-05-19 08:36:47","time":1463715407,"type":"High","utctime":"May 20, 2016 03:36:47","Rawtime":"May 19, 2016 20:36:47","height":5.43},{"Localtime":"2016-05-19 09:00:00","time":1463716800,"type":"NORMAL","utctime":"May 20, 2016 04:00:00","Rawtime":"May 19, 2016 21:00:00","height":5.387504},{"Localtime":"2016-05-19 10:00:00","time":1463720400,"type":"NORMAL","utctime":"May 20, 2016 05:00:00","Rawtime":"May 19, 2016 22:00:00","height":4.876089},{"Localtime":"2016-05-19 11:00:00","time":1463724000,"type":"NORMAL","utctime":"May 20, 2016 06:00:00","Rawtime":"May 19, 2016 23:00:00","height":3.88892},{"Localtime":"2016-05-20 12:00:00","time":1463727600,"type":"NORMAL","utctime":"May 20, 2016 07:00:00","Rawtime":"May 20, 2016 00:00:00","height":2.631981},{"Localtime":"2016-05-20 01:00:00","time":1463731200,"type":"NORMAL","utctime":"May 20, 2016 08:00:00","Rawtime":"May 20, 2016 01:00:00","height":1.367573},{"Localtime":"2016-05-20 02:00:00","time":1463734800,"type":"NORMAL","utctime":"May 20, 2016 09:00:00","Rawtime":"May 20, 2016 02:00:00","height":0.357896},{"Localtime":"2016-05-20 03:00:00","time":1463738400,"type":"NORMAL","utctime":"May 20, 2016 10:00:00","Rawtime":"May 20, 2016 03:00:00","height":-0.190082},{"Localtime":"2016-05-20 03:28:23","time":1463740103,"type":"Low","utctime":"May 20, 2016 10:28:23","Rawtime":"May 20, 2016 03:28:23","height":-0.25},{"Localtime":"2016-05-20 04:00:00","time":1463742000,"type":"NORMAL","utctime":"May 20, 2016 11:00:00","Rawtime":"May 20, 2016 04:00:00","height":-0.173321},{"Localtime":"2016-05-20 05:00:00","time":1463745600,"type":"NORMAL","utctime":"May 20, 2016 12:00:00","Rawtime":"May 20, 2016 05:00:00","height":0.376977},{"Localtime":"2016-05-20 05:46:36","time":1463748396,"type":"Sunrise","utctime":"May 20, 2016 12:46:36","Rawtime":"May 20, 2016 05:46:36","height":0},{"Localtime":"2016-05-20 06:00:00","time":1463749200,"type":"NORMAL","utctime":"May 20, 2016 13:00:00","Rawtime":"May 20, 2016 06:00:00","height":1.296806},{"Localtime":"2016-05-20 07:00:00","time":1463752800,"type":"NORMAL","utctime":"May 20, 2016 14:00:00","Rawtime":"May 20, 2016 07:00:00","height":2.331276},{"Localtime":"2016-05-20 08:00:00","time":1463756400,"type":"NORMAL","utctime":"May 20, 2016 15:00:00","Rawtime":"May 20, 2016 08:00:00","height":3.213498},{"Localtime":"2016-05-20 09:00:00","time":1463760000,"type":"NORMAL","utctime":"May 20, 2016 16:00:00","Rawtime":"May 20, 2016 09:00:00","height":3.715294},{"Localtime":"2016-05-20 09:33:14","time":1463761994,"type":"High","utctime":"May 20, 2016 16:33:14","Rawtime":"May 20, 2016 09:33:14","height":3.79},{"Localtime":"2016-05-20 10:00:00","time":1463763600,"type":"NORMAL","utctime":"May 20, 2016 17:00:00","Rawtime":"May 20, 2016 10:00:00","height":3.74309},{"Localtime":"2016-05-20 11:00:00","time":1463767200,"type":"NORMAL","utctime":"May 20, 2016 18:00:00","Rawtime":"May 20, 2016 11:00:00","height":3.346666},{"Localtime":"2016-05-20 12:00:00","time":1463770800,"type":"NORMAL","utctime":"May 20, 2016 19:00:00","Rawtime":"May 20, 2016 12:00:00","height":2.683256},{"Localtime":"2016-05-20 01:00:00","time":1463774400,"type":"NORMAL","utctime":"May 20, 2016 20:00:00","Rawtime":"May 20, 2016 13:00:00","height":1.968756},{"Localtime":"2016-05-20 02:00:00","time":1463778000,"type":"NORMAL","utctime":"May 20, 2016 21:00:00","Rawtime":"May 20, 2016 14:00:00","height":1.432928},{"Localtime":"2016-05-20 02:51:59","time":1463781119,"type":"Low","utctime":"May 20, 2016 21:51:59","Rawtime":"May 20, 2016 14:51:59","height":1.26},{"Localtime":"2016-05-20 03:00:00","time":1463781600,"type":"NORMAL","utctime":"May 20, 2016 22:00:00","Rawtime":"May 20, 2016 15:00:00","height":1.267632},{"Localtime":"2016-05-20 04:00:00","time":1463785200,"type":"NORMAL","utctime":"May 20, 2016 23:00:00","Rawtime":"May 20, 2016 16:00:00","height":1.578194},{"Localtime":"2016-05-20 05:00:00","time":1463788800,"type":"NORMAL","utctime":"May 21, 2016 00:00:00","Rawtime":"May 20, 2016 17:00:00","height":2.340646},{"Localtime":"2016-05-20 06:00:00","time":1463792400,"type":"NORMAL","utctime":"May 21, 2016 01:00:00","Rawtime":"May 20, 2016 18:00:00","height":3.375942},{"Localtime":"2016-05-20 07:00:00","time":1463796000,"type":"NORMAL","utctime":"May 21, 2016 02:00:00","Rawtime":"May 20, 2016 19:00:00","height":4.426601},{"Localtime":"2016-05-20 07:47:48","time":1463798868,"type":"Sunset","utctime":"May 21, 2016 02:47:48","Rawtime":"May 20, 2016 19:47:48","height":0},{"Localtime":"2016-05-20 08:00:00","time":1463799600,"type":"NORMAL","utctime":"May 21, 2016 03:00:00","Rawtime":"May 20, 2016 20:00:00","height":5.216781},{"Localtime":"2016-05-20 09:00:00","time":1463803200,"type":"NORMAL","utctime":"May 21, 2016 04:00:00","Rawtime":"May 20, 2016 21:00:00","height":5.526775},{"Localtime":"2016-05-20 09:02:38","time":1463803358,"type":"High","utctime":"May 21, 2016 04:02:38","Rawtime":"May 20, 2016 21:02:38","height":5.53},{"Localtime":"2016-05-20 10:00:00","time":1463806800,"type":"NORMAL","utctime":"May 21, 2016 05:00:00","Rawtime":"May 20, 2016 22:00:00","height":5.254931},{"Localtime":"2016-05-20 11:00:00","time":1463810400,"type":"NORMAL","utctime":"May 21, 2016 06:00:00","Rawtime":"May 20, 2016 23:00:00","height":4.439423},{"Localtime":"2016-05-21 12:00:00","time":1463814000,"type":"NORMAL","utctime":"May 21, 2016 07:00:00","Rawtime":"May 21, 2016 00:00:00","height":3.241457},{"Localtime":"2016-05-21 01:00:00","time":1463817600,"type":"NORMAL","utctime":"May 21, 2016 08:00:00","Rawtime":"May 21, 2016 01:00:00","height":1.904899},{"Localtime":"2016-05-21 02:00:00","time":1463821200,"type":"NORMAL","utctime":"May 21, 2016 09:00:00","Rawtime":"May 21, 2016 02:00:00","height":0.701683},{"Localtime":"2016-05-21 03:00:00","time":1463824800,"type":"NORMAL","utctime":"May 21, 2016 10:00:00","Rawtime":"May 21, 2016 03:00:00","height":-0.125456},{"Localtime":"2016-05-21 03:59:57","time":1463828397,"type":"Low","utctime":"May 21, 2016 10:59:57","Rawtime":"May 21, 2016 03:59:57","height":-0.42},{"Localtime":"2016-05-21 04:00:00","time":1463828400,"type":"NORMAL","utctime":"May 21, 2016 11:00:00","Rawtime":"May 21, 2016 04:00:00","height":-0.415347},{"Localtime":"2016-05-21 05:00:00","time":1463832000,"type":"NORMAL","utctime":"May 21, 2016 12:00:00","Rawtime":"May 21, 2016 05:00:00","height":-0.129849},{"Localtime":"2016-05-21 05:46:02","time":1463834762,"type":"Sunrise","utctime":"May 21, 2016 12:46:02","Rawtime":"May 21, 2016 05:46:02","height":0},{"Localtime":"2016-05-21 06:00:00","time":1463835600,"type":"NORMAL","utctime":"May 21, 2016 13:00:00","Rawtime":"May 21, 2016 06:00:00","height":0.631165},{"Localtime":"2016-05-21 07:00:00","time":1463839200,"type":"NORMAL","utctime":"May 21, 2016 14:00:00","Rawtime":"May 21, 2016 07:00:00","height":1.651365},{"Localtime":"2016-05-21 08:00:00","time":1463842800,"type":"NORMAL","utctime":"May 21, 2016 15:00:00","Rawtime":"May 21, 2016 08:00:00","height":2.659716},{"Localtime":"2016-05-21 09:00:00","time":1463846400,"type":"NORMAL","utctime":"May 21, 2016 16:00:00","Rawtime":"May 21, 2016 09:00:00","height":3.407776},{"Localtime":"2016-05-21 10:00:00","time":1463850000,"type":"NORMAL","utctime":"May 21, 2016 17:00:00","Rawtime":"May 21, 2016 10:00:00","height":3.717572},{"Localtime":"2016-05-21 10:09:19","time":1463850559,"type":"High","utctime":"May 21, 2016 17:09:19","Rawtime":"May 21, 2016 10:09:19","height":3.72},{"Localtime":"2016-05-21 11:00:00","time":1463853600,"type":"NORMAL","utctime":"May 21, 2016 18:00:00","Rawtime":"May 21, 2016 11:00:00","height":3.568764},{"Localtime":"2016-05-21 12:00:00","time":1463857200,"type":"NORMAL","utctime":"May 21, 2016 19:00:00","Rawtime":"May 21, 2016 12:00:00","height":3.06736},{"Localtime":"2016-05-21 01:00:00","time":1463860800,"type":"NORMAL","utctime":"May 21, 2016 20:00:00","Rawtime":"May 21, 2016 13:00:00","height":2.40231},{"Localtime":"2016-05-21 02:00:00","time":1463864400,"type":"NORMAL","utctime":"May 21, 2016 21:00:00","Rawtime":"May 21, 2016 14:00:00","height":1.796998},{"Localtime":"2016-05-21 03:00:00","time":1463868000,"type":"NORMAL","utctime":"May 21, 2016 22:00:00","Rawtime":"May 21, 2016 15:00:00","height":1.461584},{"Localtime":"2016-05-21 03:19:15","time":1463869155,"type":"Low","utctime":"May 21, 2016 22:19:15","Rawtime":"May 21, 2016 15:19:15","height":1.44},{"Localtime":"2016-05-21 04:00:00","time":1463871600,"type":"NORMAL","utctime":"May 21, 2016 23:00:00","Rawtime":"May 21, 2016 16:00:00","height":1.5469},{"Localtime":"2016-05-21 05:00:00","time":1463875200,"type":"NORMAL","utctime":"May 22, 2016 00:00:00","Rawtime":"May 21, 2016 17:00:00","height":2.096814},{"Localtime":"2016-05-21 06:00:00","time":1463878800,"type":"NORMAL","utctime":"May 22, 2016 01:00:00","Rawtime":"May 21, 2016 18:00:00","height":3.007376},{"Localtime":"2016-05-21 07:00:00","time":1463882400,"type":"NORMAL","utctime":"May 22, 2016 02:00:00","Rawtime":"May 21, 2016 19:00:00","height":4.051667},{"Localtime":"2016-05-21 07:48:30","time":1463885310,"type":"Sunset","utctime":"May 22, 2016 02:48:30","Rawtime":"May 21, 2016 19:48:30","height":0},{"Localtime":"2016-05-21 08:00:00","time":1463886000,"type":"NORMAL","utctime":"May 22, 2016 03:00:00","Rawtime":"May 21, 2016 20:00:00","height":4.964875},{"Localtime":"2016-05-21 09:00:00","time":1463889600,"type":"NORMAL","utctime":"May 22, 2016 04:00:00","Rawtime":"May 21, 2016 21:00:00","height":5.495776},{"Localtime":"2016-05-21 09:29:03","time":1463891343,"type":"High","utctime":"May 22, 2016 04:29:03","Rawtime":"May 21, 2016 21:29:03","height":5.56},{"Localtime":"2016-05-21 10:00:00","time":1463893200,"type":"NORMAL","utctime":"May 22, 2016 05:00:00","Rawtime":"May 21, 2016 22:00:00","height":5.484799},{"Localtime":"2016-05-21 11:00:00","time":1463896800,"type":"NORMAL","utctime":"May 22, 2016 06:00:00","Rawtime":"May 21, 2016 23:00:00","height":4.902942},{"Localtime":"2016-05-22 12:00:00","time":1463900400,"type":"NORMAL","utctime":"May 22, 2016 07:00:00","Rawtime":"May 22, 2016 00:00:00","height":3.853721},{"Localtime":"2016-05-22 01:00:00","time":1463904000,"type":"NORMAL","utctime":"May 22, 2016 08:00:00","Rawtime":"May 22, 2016 01:00:00","height":2.542793},{"Localtime":"2016-05-22 02:00:00","time":1463907600,"type":"NORMAL","utctime":"May 22, 2016 09:00:00","Rawtime":"May 22, 2016 02:00:00","height":1.230963},{"Localtime":"2016-05-22 03:00:00","time":1463911200,"type":"NORMAL","utctime":"May 22, 2016 10:00:00","Rawtime":"May 22, 2016 03:00:00","height":0.178572},{"Localtime":"2016-05-22 04:00:00","time":1463914800,"type":"NORMAL","utctime":"May 22, 2016 11:00:00","Rawtime":"May 22, 2016 04:00:00","height":-0.409797},{"Localtime":"2016-05-22 04:32:21","time":1463916741,"type":"Low","utctime":"May 22, 2016 11:32:21","Rawtime":"May 22, 2016 04:32:21","height":-0.49},{"Localtime":"2016-05-22 05:00:00","time":1463918400,"type":"NORMAL","utctime":"May 22, 2016 12:00:00","Rawtime":"May 22, 2016 05:00:00","height":-0.431522},{"Localtime":"2016-05-22 05:45:30","time":1463921130,"type":"Sunrise","utctime":"May 22, 2016 12:45:30","Rawtime":"May 22, 2016 05:45:30","height":0},{"Localtime":"2016-05-22 06:00:00","time":1463922000,"type":"NORMAL","utctime":"May 22, 2016 13:00:00","Rawtime":"May 22, 2016 06:00:00","height":0.084991},{"Localtime":"2016-05-22 07:00:00","time":1463925600,"type":"NORMAL","utctime":"May 22, 2016 14:00:00","Rawtime":"May 22, 2016 07:00:00","height":0.982565},{"Localtime":"2016-05-22 08:00:00","time":1463929200,"type":"NORMAL","utctime":"May 22, 2016 15:00:00","Rawtime":"May 22, 2016 08:00:00","height":2.015987},{"Localtime":"2016-05-22 09:00:00","time":1463932800,"type":"NORMAL","utctime":"May 22, 2016 16:00:00","Rawtime":"May 22, 2016 09:00:00","height":2.92625},{"Localtime":"2016-05-22 10:00:00","time":1463936400,"type":"NORMAL","utctime":"May 22, 2016 17:00:00","Rawtime":"May 22, 2016 10:00:00","height":3.49451},{"Localtime":"2016-05-22 10:46:26","time":1463939186,"type":"High","utctime":"May 22, 2016 17:46:26","Rawtime":"May 22, 2016 10:46:26","height":3.63},{"Localtime":"2016-05-22 11:00:00","time":1463940000,"type":"NORMAL","utctime":"May 22, 2016 18:00:00","Rawtime":"May 22, 2016 11:00:00","height":3.616421},{"Localtime":"2016-05-22 12:00:00","time":1463943600,"type":"NORMAL","utctime":"May 22, 2016 19:00:00","Rawtime":"May 22, 2016 12:00:00","height":3.333727},{"Localtime":"2016-05-22 01:00:00","time":1463947200,"type":"NORMAL","utctime":"May 22, 2016 20:00:00","Rawtime":"May 22, 2016 13:00:00","height":2.791865},{"Localtime":"2016-05-22 02:00:00","time":1463950800,"type":"NORMAL","utctime":"May 22, 2016 21:00:00","Rawtime":"May 22, 2016 14:00:00","height":2.1932},{"Localtime":"2016-05-22 03:00:00","time":1463954400,"type":"NORMAL","utctime":"May 22, 2016 22:00:00","Rawtime":"May 22, 2016 15:00:00","height":1.748347},{"Localtime":"2016-05-22 03:47:11","time":1463957231,"type":"Low","utctime":"May 22, 2016 22:47:11","Rawtime":"May 22, 2016 15:47:11","height":1.62},{"Localtime":"2016-05-22 04:00:00","time":1463958000,"type":"NORMAL","utctime":"May 22, 2016 23:00:00","Rawtime":"May 22, 2016 16:00:00","height":1.634505},{"Localtime":"2016-05-22 05:00:00","time":1463961600,"type":"NORMAL","utctime":"May 23, 2016 00:00:00","Rawtime":"May 22, 2016 17:00:00","height":1.951782},{"Localtime":"2016-05-22 06:00:00","time":1463965200,"type":"NORMAL","utctime":"May 23, 2016 01:00:00","Rawtime":"May 22, 2016 18:00:00","height":2.676693},{"Localtime":"2016-05-22 07:00:00","time":1463968800,"type":"NORMAL","utctime":"May 23, 2016 02:00:00","Rawtime":"May 22, 2016 19:00:00","height":3.633791},{"Localtime":"2016-05-22 07:49:11","time":1463971751,"type":"Sunset","utctime":"May 23, 2016 02:49:11","Rawtime":"May 22, 2016 19:49:11","height":0},{"Localtime":"2016-05-22 08:00:00","time":1463972400,"type":"NORMAL","utctime":"May 23, 2016 03:00:00","Rawtime":"May 22, 2016 20:00:00","height":4.591691},{"Localtime":"2016-05-22 09:00:00","time":1463976000,"type":"NORMAL","utctime":"May 23, 2016 04:00:00","Rawtime":"May 22, 2016 21:00:00","height":5.292531},{"Localtime":"2016-05-22 09:56:53","time":1463979413,"type":"High","utctime":"May 23, 2016 04:56:53","Rawtime":"May 22, 2016 21:56:53","height":5.54},{"Localtime":"2016-05-22 10:00:00","time":1463979600,"type":"NORMAL","utctime":"May 23, 2016 05:00:00","Rawtime":"May 22, 2016 22:00:00","height":5.534318},{"Localtime":"2016-05-22 11:00:00","time":1463983200,"type":"NORMAL","utctime":"May 23, 2016 06:00:00","Rawtime":"May 22, 2016 23:00:00","height":5.224087},{"Localtime":"2016-05-23 12:00:00","time":1463986800,"type":"NORMAL","utctime":"May 23, 2016 07:00:00","Rawtime":"May 23, 2016 00:00:00","height":4.399189},{"Localtime":"2016-05-23 01:00:00","time":1463990400,"type":"NORMAL","utctime":"May 23, 2016 08:00:00","Rawtime":"May 23, 2016 01:00:00","height":3.211315},{"Localtime":"2016-05-23 02:00:00","time":1463994000,"type":"NORMAL","utctime":"May 23, 2016 09:00:00","Rawtime":"May 23, 2016 02:00:00","height":1.889299},{"Localtime":"2016-05-23 03:00:00","time":1463997600,"type":"NORMAL","utctime":"May 23, 2016 10:00:00","Rawtime":"May 23, 2016 03:00:00","height":0.690621},{"Localtime":"2016-05-23 04:00:00","time":1464001200,"type":"NORMAL","utctime":"May 23, 2016 11:00:00","Rawtime":"May 23, 2016 04:00:00","height":-0.15467},{"Localtime":"2016-05-23 05:00:00","time":1464004800,"type":"NORMAL","utctime":"May 23, 2016 12:00:00","Rawtime":"May 23, 2016 05:00:00","height":-0.491323},{"Localtime":"2016-05-23 05:06:22","time":1464005182,"type":"Low","utctime":"May 23, 2016 12:06:22","Rawtime":"May 23, 2016 05:06:22","height":-0.49},{"Localtime":"2016-05-23 05:44:59","time":1464007499,"type":"Sunrise","utctime":"May 23, 2016 12:44:59","Rawtime":"May 23, 2016 05:44:59","height":0},{"Localtime":"2016-05-23 06:00:00","time":1464008400,"type":"NORMAL","utctime":"May 23, 2016 13:00:00","Rawtime":"May 23, 2016 06:00:00","height":-0.277448},{"Localtime":"2016-05-23 07:00:00","time":1464012000,"type":"NORMAL","utctime":"May 23, 2016 14:00:00","Rawtime":"May 23, 2016 07:00:00","height":0.401063},{"Localtime":"2016-05-23 08:00:00","time":1464015600,"type":"NORMAL","utctime":"May 23, 2016 15:00:00","Rawtime":"May 23, 2016 08:00:00","height":1.351},{"Localtime":"2016-05-23 09:00:00","time":1464019200,"type":"NORMAL","utctime":"May 23, 2016 16:00:00","Rawtime":"May 23, 2016 09:00:00","height":2.323211},{"Localtime":"2016-05-23 10:00:00","time":1464022800,"type":"NORMAL","utctime":"May 23, 2016 17:00:00","Rawtime":"May 23, 2016 10:00:00","height":3.090131},{"Localtime":"2016-05-23 11:00:00","time":1464026400,"type":"NORMAL","utctime":"May 23, 2016 18:00:00","Rawtime":"May 23, 2016 11:00:00","height":3.478446},{"Localtime":"2016-05-23 11:25:29","time":1464027929,"type":"High","utctime":"May 23, 2016 18:25:29","Rawtime":"May 23, 2016 11:25:29","height":3.52},{"Localtime":"2016-05-23 12:00:00","time":1464030000,"type":"NORMAL","utctime":"May 23, 2016 19:00:00","Rawtime":"May 23, 2016 12:00:00","height":3.452241},{"Localtime":"2016-05-23 01:00:00","time":1464033600,"type":"NORMAL","utctime":"May 23, 2016 20:00:00","Rawtime":"May 23, 2016 13:00:00","height":3.098688},{"Localtime":"2016-05-23 02:00:00","time":1464037200,"type":"NORMAL","utctime":"May 23, 2016 21:00:00","Rawtime":"May 23, 2016 14:00:00","height":2.582033},{"Localtime":"2016-05-23 03:00:00","time":1464040800,"type":"NORMAL","utctime":"May 23, 2016 22:00:00","Rawtime":"May 23, 2016 15:00:00","height":2.100555},{"Localtime":"2016-05-23 04:00:00","time":1464044400,"type":"NORMAL","utctime":"May 23, 2016 23:00:00","Rawtime":"May 23, 2016 16:00:00","height":1.836535},{"Localtime":"2016-05-23 04:16:46","time":1464045406,"type":"Low","utctime":"May 23, 2016 23:16:46","Rawtime":"May 23, 2016 16:16:46","height":1.82},{"Localtime":"2016-05-23 05:00:00","time":1464048000,"type":"NORMAL","utctime":"May 24, 2016 00:00:00","Rawtime":"May 23, 2016 17:00:00","height":1.927598},{"Localtime":"2016-05-23 06:00:00","time":1464051600,"type":"NORMAL","utctime":"May 24, 2016 01:00:00","Rawtime":"May 23, 2016 18:00:00","height":2.421085},{"Localtime":"2016-05-23 07:00:00","time":1464055200,"type":"NORMAL","utctime":"May 24, 2016 02:00:00","Rawtime":"May 23, 2016 19:00:00","height":3.219375},{"Localtime":"2016-05-23 07:49:52","time":1464058192,"type":"Sunset","utctime":"May 24, 2016 02:49:52","Rawtime":"May 23, 2016 19:49:52","height":0},{"Localtime":"2016-05-23 08:00:00","time":1464058800,"type":"NORMAL","utctime":"May 24, 2016 03:00:00","Rawtime":"May 23, 2016 20:00:00","height":4.134425},{"Localtime":"2016-05-23 09:00:00","time":1464062400,"type":"NORMAL","utctime":"May 24, 2016 04:00:00","Rawtime":"May 23, 2016 21:00:00","height":4.93149},{"Localtime":"2016-05-23 10:00:00","time":1464066000,"type":"NORMAL","utctime":"May 24, 2016 05:00:00","Rawtime":"May 23, 2016 22:00:00","height":5.387736},{"Localtime":"2016-05-23 10:26:54","time":1464067614,"type":"High","utctime":"May 24, 2016 05:26:54","Rawtime":"May 23, 2016 22:26:54","height":5.44},{"Localtime":"2016-05-23 11:00:00","time":1464069600,"type":"NORMAL","utctime":"May 24, 2016 06:00:00","Rawtime":"May 23, 2016 23:00:00","height":5.358245},{"Localtime":"2016-05-24 12:00:00","time":1464073200,"type":"NORMAL","utctime":"May 24, 2016 07:00:00","Rawtime":"May 24, 2016 00:00:00","height":4.812007},{"Localtime":"2016-05-24 05:42:59","time":1464093779,"type":"Low","utctime":"May 24, 2016 12:42:59","Rawtime":"May 24, 2016 05:42:59","height":-0.43}],"startDate_pretty_LOCAL":"05\/07\/16","startDate_pretty_GMT":"05\/07\/16","DisplayTides":"YES","SunPoints":[{"Localtime":"2016-05-07 05:56:04","time":1462625764,"type":"Sunrise","utctime":"May 07, 2016 12:56:04","Rawtime":"May 07, 2016 05:56:04"},{"Localtime":"2016-05-07 07:38:17","time":1462675097,"type":"Sunset","utctime":"May 08, 2016 02:38:17","Rawtime":"May 07, 2016 19:38:17"},{"Localtime":"2016-05-08 05:55:11","time":1462712111,"type":"Sunrise","utctime":"May 08, 2016 12:55:11","Rawtime":"May 08, 2016 05:55:11"},{"Localtime":"2016-05-08 07:39:02","time":1462761542,"type":"Sunset","utctime":"May 09, 2016 02:39:02","Rawtime":"May 08, 2016 19:39:02"},{"Localtime":"2016-05-09 05:54:21","time":1462798461,"type":"Sunrise","utctime":"May 09, 2016 12:54:21","Rawtime":"May 09, 2016 05:54:21"},{"Localtime":"2016-05-09 07:39:47","time":1462847987,"type":"Sunset","utctime":"May 10, 2016 02:39:47","Rawtime":"May 09, 2016 19:39:47"},{"Localtime":"2016-05-10 05:53:32","time":1462884812,"type":"Sunrise","utctime":"May 10, 2016 12:53:32","Rawtime":"May 10, 2016 05:53:32"},{"Localtime":"2016-05-10 07:40:32","time":1462934432,"type":"Sunset","utctime":"May 11, 2016 02:40:32","Rawtime":"May 10, 2016 19:40:32"},{"Localtime":"2016-05-11 05:52:44","time":1462971164,"type":"Sunrise","utctime":"May 11, 2016 12:52:44","Rawtime":"May 11, 2016 05:52:44"},{"Localtime":"2016-05-11 07:41:17","time":1463020877,"type":"Sunset","utctime":"May 12, 2016 02:41:17","Rawtime":"May 11, 2016 19:41:17"},{"Localtime":"2016-05-12 05:51:58","time":1463057518,"type":"Sunrise","utctime":"May 12, 2016 12:51:58","Rawtime":"May 12, 2016 05:51:58"},{"Localtime":"2016-05-12 07:42:01","time":1463107321,"type":"Sunset","utctime":"May 13, 2016 02:42:01","Rawtime":"May 12, 2016 19:42:01"},{"Localtime":"2016-05-13 05:51:12","time":1463143872,"type":"Sunrise","utctime":"May 13, 2016 12:51:12","Rawtime":"May 13, 2016 05:51:12"},{"Localtime":"2016-05-13 07:42:46","time":1463193766,"type":"Sunset","utctime":"May 14, 2016 02:42:46","Rawtime":"May 13, 2016 19:42:46"},{"Localtime":"2016-05-14 05:50:29","time":1463230229,"type":"Sunrise","utctime":"May 14, 2016 12:50:29","Rawtime":"May 14, 2016 05:50:29"},{"Localtime":"2016-05-14 07:43:30","time":1463280210,"type":"Sunset","utctime":"May 15, 2016 02:43:30","Rawtime":"May 14, 2016 19:43:30"},{"Localtime":"2016-05-15 05:49:46","time":1463316586,"type":"Sunrise","utctime":"May 15, 2016 12:49:46","Rawtime":"May 15, 2016 05:49:46"},{"Localtime":"2016-05-15 07:44:14","time":1463366654,"type":"Sunset","utctime":"May 16, 2016 02:44:14","Rawtime":"May 15, 2016 19:44:14"},{"Localtime":"2016-05-16 05:49:05","time":1463402945,"type":"Sunrise","utctime":"May 16, 2016 12:49:05","Rawtime":"May 16, 2016 05:49:05"},{"Localtime":"2016-05-16 07:44:57","time":1463453097,"type":"Sunset","utctime":"May 17, 2016 02:44:57","Rawtime":"May 16, 2016 19:44:57"},{"Localtime":"2016-05-17 05:48:26","time":1463489306,"type":"Sunrise","utctime":"May 17, 2016 12:48:26","Rawtime":"May 17, 2016 05:48:26"},{"Localtime":"2016-05-17 07:45:41","time":1463539541,"type":"Sunset","utctime":"May 18, 2016 02:45:41","Rawtime":"May 17, 2016 19:45:41"},{"Localtime":"2016-05-18 05:47:48","time":1463575668,"type":"Sunrise","utctime":"May 18, 2016 12:47:48","Rawtime":"May 18, 2016 05:47:48"},{"Localtime":"2016-05-18 07:46:23","time":1463625983,"type":"Sunset","utctime":"May 19, 2016 02:46:23","Rawtime":"May 18, 2016 19:46:23"},{"Localtime":"2016-05-19 05:47:11","time":1463662031,"type":"Sunrise","utctime":"May 19, 2016 12:47:11","Rawtime":"May 19, 2016 05:47:11"},{"Localtime":"2016-05-19 07:47:06","time":1463712426,"type":"Sunset","utctime":"May 20, 2016 02:47:06","Rawtime":"May 19, 2016 19:47:06"},{"Localtime":"2016-05-20 05:46:36","time":1463748396,"type":"Sunrise","utctime":"May 20, 2016 12:46:36","Rawtime":"May 20, 2016 05:46:36"},{"Localtime":"2016-05-20 07:47:48","time":1463798868,"type":"Sunset","utctime":"May 21, 2016 02:47:48","Rawtime":"May 20, 2016 19:47:48"},{"Localtime":"2016-05-21 05:46:02","time":1463834762,"type":"Sunrise","utctime":"May 21, 2016 12:46:02","Rawtime":"May 21, 2016 05:46:02"},{"Localtime":"2016-05-21 07:48:30","time":1463885310,"type":"Sunset","utctime":"May 22, 2016 02:48:30","Rawtime":"May 21, 2016 19:48:30"},{"Localtime":"2016-05-22 05:45:30","time":1463921130,"type":"Sunrise","utctime":"May 22, 2016 12:45:30","Rawtime":"May 22, 2016 05:45:30"},{"Localtime":"2016-05-22 07:49:11","time":1463971751,"type":"Sunset","utctime":"May 23, 2016 02:49:11","Rawtime":"May 22, 2016 19:49:11"},{"Localtime":"2016-05-23 05:44:59","time":1464007499,"type":"Sunrise","utctime":"May 23, 2016 12:44:59","Rawtime":"May 23, 2016 05:44:59"},{"Localtime":"2016-05-23 07:49:52","time":1464058192,"type":"Sunset","utctime":"May 24, 2016 02:49:52","Rawtime":"May 23, 2016 19:49:52"}],"startDate_GMT":1462575600,"TideType":"StationBased","timezone":-7,"units":"e"},"Sort":{"startDate_GMT":1462653812,"SwellSource":"2950","direction2":[[178,178,177,177],[176,175,175,175],[0,0,201,200],[200,200,200,199],[199,199,199,199],[199,199,197,195],[198,0,0,0],[0,0,195,198],[194,197,197,196],[196,195,196,196],[196,196,196,196],[196,196,195,196],[198,196,196,197],[197,197,197,197],[197,197,197,197],[197,196,197,198]],"direction3":[[208,208,208,208],[206,206,205,206],[206,0,174,174],[0,0,0,0],[165,0,0,0],[213,208,0,213],[209,208,208,210],[210,212,0,0],[0,0,0,285],[285,0,0,285],[0,0,0,0],[0,279,279,279],[279,279,278,278],[277,277,274,273],[275,275,275,275],[274,276,274,276]],"direction4":[[285,285,285,285],[0,0,0,0],[285,285,285,285],[285,285,285,285],[284,284,283,280],[283,280,279,279],[277,278,276,0],[0,0,0,0],[0,0,266,0],[0,0,280,0],[0,0,279,279],[280,0,0,0],[0,0,0,0],[0,0,0,0],[0,240,0,0],[0,0,192,191]],"direction5":[[0,0,0,0],[211,206,0,0],[0,193,0,0],[179,179,0,0],[0,207,210,0],[0,0,277,277],[0,0,0,285],[285,285,285,285],[285,285,0,0],[0,274,0,0],[197,197,196,196],[195,194,0,0],[0,0,0,0],[0,0,0,0],[0,0,285,285],[285,0,0,0]],"direction6":[[0,0,0,0],[0,0,197,201],[201,200,0,0],[0,0,285,285],[0,0,0,185],[180,180,0,0],[191,194,194,195],[195,196,196,197],[197,197,197,197],[196,196,196,196],[198,198,197,197],[197,195,196,196],[195,0,0,0],[0,0,0,0],[0,0,0,0],[0,240,0,0]],"startDate_pretty_GMT":"May 07, 2016 21:43:32","height1":[[1.7,1.7,1.7,1.6],[1.4,1.2,1.2,1.1],[0.9,0.8,0.6,0.6],[0.6,0.5,0.5,0.5],[0.5,0.4,0.5,0.5],[0,0,0.1,0],[0,0.4,0.5,0.5],[0.4,0.4,0.5,0.6],[0.4,0.6,1,1.3],[1.3,1.1,1.5,1.4],[1.3,1.3,0,0],[0,0,0.6,0.6],[0.6,0.8,0.8,0.7],[0.6,0.5,0.7,0.7],[0.4,0.4,0.3,0.4],[0.3,0.4,0.3,0.2]],"direction1":[[275,274,273,273],[277,275,274,275],[276,276,279,281],[281,281,276,276],[280,282,278,279],[0,0,165,0],[0,278,278,279],[281,281,279,277],[276,278,279,275],[277,279,277,276],[276,277,0,0],[0,0,285,285],[285,284,283,283],[284,285,285,285],[285,285,285,284],[285,283,283,283]],"units":"e","periodSchedule":[["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"]],"height_max":2.9,"dateStamp":[["May 07, 2016 05:00:00","May 07, 2016 11:00:00","May 07, 2016 17:00:00","May 07, 2016 23:00:00"],["May 08, 2016 05:00:00","May 08, 2016 11:00:00","May 08, 2016 17:00:00","May 08, 2016 23:00:00"],["May 09, 2016 05:00:00","May 09, 2016 11:00:00","May 09, 2016 17:00:00","May 09, 2016 23:00:00"],["May 10, 2016 05:00:00","May 10, 2016 11:00:00","May 10, 2016 17:00:00","May 10, 2016 23:00:00"],["May 11, 2016 05:00:00","May 11, 2016 11:00:00","May 11, 2016 17:00:00","May 11, 2016 23:00:00"],["May 12, 2016 05:00:00","May 12, 2016 11:00:00","May 12, 2016 17:00:00","May 12, 2016 23:00:00"],["May 13, 2016 05:00:00","May 13, 2016 11:00:00","May 13, 2016 17:00:00","May 13, 2016 23:00:00"],["May 14, 2016 05:00:00","May 14, 2016 11:00:00","May 14, 2016 17:00:00","May 14, 2016 23:00:00"],["May 15, 2016 05:00:00","May 15, 2016 11:00:00","May 15, 2016 17:00:00","May 15, 2016 23:00:00"],["May 16, 2016 05:00:00","May 16, 2016 11:00:00","May 16, 2016 17:00:00","May 16, 2016 23:00:00"],["May 17, 2016 05:00:00","May 17, 2016 11:00:00","May 17, 2016 17:00:00","May 17, 2016 23:00:00"],["May 18, 2016 05:00:00","May 18, 2016 11:00:00","May 18, 2016 17:00:00","May 18, 2016 23:00:00"],["May 19, 2016 05:00:00","May 19, 2016 11:00:00","May 19, 2016 17:00:00","May 19, 2016 23:00:00"],["May 20, 2016 05:00:00","May 20, 2016 11:00:00","May 20, 2016 17:00:00","May 20, 2016 23:00:00"],["May 21, 2016 05:00:00","May 21, 2016 11:00:00","May 21, 2016 17:00:00","May 21, 2016 23:00:00"],["May 22, 2016 05:00:00","May 22, 2016 11:00:00","May 22, 2016 17:00:00","May 22, 2016 23:00:00"]],"period1":[[8.4,8.4,8.4,8.4],[8.4,6.9,6.9,6.9],[6.3,6.3,5.7,5.7],[4.7,4.7,3.6,3.6],[4.7,4.7,2.9,3.6],[0,0,6.3,0],[0,3.2,3.6,3.6],[3.9,3.6,3.6,3.6],[3.6,3.9,4.3,4.7],[5.2,5.7,6.3,6.3],[6.3,6.3,0,0],[0,0,10.2,10.2],[9.3,9.3,8.4,8.4],[8.4,8.4,6.9,6.9],[9.3,9.3,9.3,8.4],[8.4,7.6,7.6,7.6]],"period2":[[11.2,11.2,11.2,11.2],[11.2,11.2,11.2,11.2],[0,0,14.9,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,13.5,13.5],[13.5,13.5,13.5,12.3],[12.3,0,0,0],[0,0,21.8,21.8],[21.8,19.8,19.8,19.8],[18,18,16.3,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,16.3,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,13.5,13.5],[13.5,13.5,13.5,13.5],[12.3,12.3,12.3,12.3]],"period3":[[13.5,13.5,13.5,12.3],[12.3,12.3,12.3,12.3],[12.3,0,10.2,10.2],[0,0,0,0],[8.4,0,0,0],[21.8,21.8,0,19.8],[19.8,19.8,19.8,19.8],[18,18,0,0],[0,0,0,10.2],[10.2,0,0,12.3],[0,0,0,0],[0,5.7,5.7,6.9],[6.9,6.9,6.3,6.3],[6.3,6.3,5.7,5.7],[5.7,5.7,6.3,6.9],[6.3,6.3,6.3,5.7]],"period4":[[14.9,14.9,14.9,13.5],[0,0,0,0],[12.3,12.3,12.3,12.3],[11.2,11.2,11.2,10.2],[10.2,10.2,11.2,12.3],[10.2,10.2,9.3,9.3],[9.3,8.4,8.4,0],[0,0,0,0],[0,0,6.3,0],[0,0,7.6,0],[0,0,9.3,11.2],[10.2,0,0,0],[0,0,0,0],[0,0,0,0],[0,2.4,0,0],[0,0,14.9,14.9]],"period5":[[0,0,0,0],[16.3,16.3,0,0],[0,12.3,0,0],[19.8,19.8,0,0],[0,23.9,23.9,0],[0,0,2.9,3.6],[0,0,0,11.2],[11.2,11.2,11.2,11.2],[11.2,10.2,0,0],[0,3.9,0,0],[19.8,19.8,19.8,18],[18,18,0,0],[0,0,0,0],[0,0,0,0],[0,0,11.2,11.2],[11.2,0,0,0]],"period6":[[0,0,0,0],[0,0,19.8,18],[18,18,0,0],[0,0,5.2,5.2],[0,0,0,19.8],[19.8,19.8,0,0],[14.9,14.9,14.9,14.9],[13.5,13.5,13.5,13.5],[12.3,12.3,12.3,13.5],[13.5,12.3,12.3,12.3],[12.3,12.3,12.3,11.2],[11.2,11.2,13.5,13.5],[13.5,0,0,0],[0,0,0,0],[0,0,0,0],[0,3.2,0,0]],"spread1":[[13,14,15,15],[10,10,14,13],[12,12,9,7],[7,7,9,9],[7,6,9,8],[0,0,0,0],[0,9,9,8],[6,7,9,10],[10,9,9,11],[10,9,12,12],[12,11,0,0],[0,0,1,0],[2,4,5,5],[4,0,0,2],[0,0,0,4],[0,5,5,5]],"spread2":[[8,8,8,8],[10,7,7,7],[0,0,9,10],[10,10,10,9],[9,10,10,9],[9,9,10,10],[9,0,0,0],[0,0,0,6],[3,7,7,7],[11,11,9,9],[9,9,9,9],[9,9,8,8],[6,8,8,8],[8,8,9,9],[9,9,10,10],[10,11,11,10]],"spread3":[[9,9,9,10],[9,9,10,9],[9,0,7,7],[0,0,0,0],[0,0,0,0],[7,10,0,7],[9,10,9,11],[11,15,0,0],[0,0,0,0],[0,0,0,1],[0,0,0,0],[0,10,9,10],[9,9,10,11],[11,12,13,13],[13,12,12,12],[13,10,13,10]],"spread4":[[0,1,1,1],[0,0,0,0],[1,1,1,1],[1,1,2,2],[3,3,5,7],[5,7,7,8],[8,8,8,0],[0,0,0,0],[0,0,6,0],[0,0,7,0],[0,0,10,10],[9,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,7,8]],"spread5":[[0,0,0,0],[4,9,0,0],[0,17,0,0],[3,3,0,0],[0,9,9,0],[0,0,10,10],[0,0,0,3],[1,1,1,1],[1,0,0,0],[0,12,0,0],[7,8,8,8],[8,9,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"spread6":[[0,0,0,0],[0,0,7,9],[9,9,0,0],[0,0,0,0],[0,0,0,7],[0,2,0,0],[10,10,10,9],[9,8,9,9],[9,9,9,9],[7,8,9,7],[6,6,5,6],[6,3,9,9],[9,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"height2":[[1.5,1.4,1.3,1.2],[1.1,1,1,0.9],[0,0,2.2,2.3],[2.5,2.5,2.5,2.5],[2.5,2.4,2.3,2.1],[2.1,2,2.3,2.4],[1.7,0,0,0],[0,0,0.3,0.5],[0.7,1.3,1.7,1.8],[1.9,1.8,2.2,2.7],[2.6,2.4,2.5,2.4],[2.4,2.5,2.3,2.2],[1.9,2.9,2.8,2.7],[2.5,2.4,2.3,2.1],[2,1.9,1.8,1.7],[1.6,1.6,1.4,1.3]],"height3":[[1.1,1.1,1.1,1],[1,1,1,0.9],[1,0,0.7,0.7],[0,0,0,0],[0.3,0,0,0],[0.4,0.4,0,0.7],[0.9,0.9,0.8,0.8],[0.8,0.6,0,0],[0,0,0,0.5],[0.5,0,0,0.7],[0,0,0,0],[0,1.2,1.4,1.5],[1.5,1.5,1.6,1.6],[1.5,1.5,1.4,1.4],[1.5,1.4,1.4,1.3],[1.2,1,0.9,0.7]],"height4":[[0.5,0.5,0.7,0.6],[0,0,0,0],[1,1.1,1.2,1.2],[1.2,1.1,0.9,0.8],[0.6,0.5,0.5,0.5],[0.4,0.5,0.5,0.6],[0.6,0.6,0.5,0],[0,0,0,0],[0,0,0.5,0],[0,0,0.8,0],[0,0,1.6,1.6],[1.5,0,0,0],[0,0,0,0],[0,0,0,0],[0,0.1,0,0],[0,0,0.6,0.7]],"height5":[[0,0,0,0],[0.6,0.9,0,0],[0,1.3,0,0],[0.6,0.5,0,0],[0,0.2,0.2,0],[0,0,0.5,0.6],[0,0,0,0.6],[0.6,0.6,0.5,0.5],[0.5,0.5,0,0],[0,0.9,0,0],[1.2,1.6,1.6,2],[2.1,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0.2,0.2],[0.2,0,0,0]],"height6":[[0,0,0,0],[0,0,1.1,1.6],[1.8,1.9,0,0],[0,0,0.4,0.3],[0,0,0,0.4],[0.5,0.7,0,0],[1.8,2.6,2.6,2.6],[2.6,2.6,2.7,2.7],[2.7,2.6,2.6,2.5],[2.2,2.1,2.1,1.7],[1.6,1.5,1.4,1.1],[1.1,0.9,2.2,2.2],[2.3,0,0,0],[0,0,0,0],[0,0,0,0],[0,0.2,0,0]],"startDate_LOCAL":1462603412,"startDate_pretty_LOCAL":"May 07, 2016 14:43:32"},"Location":{"regionname":"Southern California","subregionalias":"sorange","tide_location":"Salt Creek ( San Clemente) based on San Diego","regionalias":"socal"},"Weather":{"dateStamp":["May 07, 2016 19:00:00"],"temp_max":[69],"units":"e","startDate_pretty_LOCAL":"May 07, 2016 14:43:32","startDate_pretty_GMT":"May 07, 2016 21:43:32","weather_type":["unknown"],"temp_min":[48],"startDate_GMT":1462653812,"startDate_LOCAL":1462603412},"WaterTemp":{"startDate_pretty_LOCAL":"May 07, 2016 14:43:32","startDate_LOCAL":1462603412,"units":"e","startDate_GMT":1462653812,"watertemp_min":63,"wetsuit_of_the_day":{"suitName":"Psychofreak 4\/3","url":"http:\/\/www.surfline.com\/redirect\/?url=http%3A\/\/us.oneill.com\/shop\/psychofreak-zz-4-5-3-5-ssw\/&code=Wetsuit15_Oneill&subcode=Psychofreak_4\/3","imgUrl":"http:\/\/i.cdn-surfline.com\/images\/promotional\/oneill_15_fall-winter\/PsychoFreak_43_38x81.png"},"startDate_pretty_GMT":"May 07, 2016 21:43:32","watertemp_max":63},"timeZoneString":"America\/Los_Angeles","_metadata":{"canonicalUrl":"http:\/\/www.surfline.com\/surf-forecasts\/southern-california\/rockpile_2950\/","dateCreated":"May 07, 2016 14:43:33","tickCount":{"watertemp":20,"surflineweather":0,"ureport":3,"weather":3,"hvp":6,"confidence":2,"quickspot":2,"analysis":91,"sort":10,"tide":324,"surf":104,"hourlyWind":5,"hiresWind":2,"wind":9},"cached":"true","rediskey":"cache:api:forecasts:2950:17:050716:e:e:false:1:false:false:false:true:false:analysischartconfidencehireswindhvpquickspotsortsurfsurflineweathertideureportwatertempweatherwind","hostname":"prod-coldfusion-api-1"},"timezone":-7,"id":"2950","hourlyWind":{"windsource":"wrfsocal1hr","alternatewind":"YES","dateStamp":[],"units":"kts","startDate_pretty_LOCAL":"May 07, 2016 14:43:32","startDate_pretty_GMT":"May 07, 2016 21:43:32","periodSchedule":[],"wind_direction":[],"startDate_GMT":1462653812,"wind_speed":[],"startDate_LOCAL":1462603412},"HiresWind":{},"Surf":{"startDate_GMT":1462653812,"modelRun":[[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612],[2016050612,2016050612,2016050612,2016050612]],"SwellSource":"2950","startDate_pretty_LOCAL":"May 07, 2016 14:43:32","swell_direction1":[[274,273,276,276],[276,274,274,201],[201,194,201,198],[200,200,199,199],[199,199,199,199],[199,199,197,195],[194,194,195,195],[195,196,196,197],[197,197,197,197],[196,196,196,196],[196,196,196,196],[196,196,195,196],[195,196,196,197],[197,197,197,197],[197,197,197,197],[197,196,197,198]],"agg_period1":[[8.4,8.4,8.4,8.4],[8.4,8.4,7.6,19.8],[18,18,16.3,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,13.5,13.5],[13.5,13.5,13.5,12.3],[14.9,14.9,14.9,14.9],[13.5,13.5,13.5,13.5],[12.3,12.3,12.3,13.5],[13.5,12.3,16.3,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,16.3,16.3],[13.5,16.3,14.9,14.9],[14.9,14.9,13.5,13.5],[13.5,13.5,13.5,13.5],[12.3,12.3,12.3,12.3]],"swell_direction3":[[208,208,208,208],[206,206,175,206],[285,211,174,279],[281,281,277,282],[282,283,278,185],[213,208,283,279],[278,279,277,284],[285,285,279,198],[285,278,279,275],[277,279,277,276],[276,198,279,279],[280,279,279,279],[279,284,283,283],[284,285,285,285],[285,285,285,284],[285,283,192,191]],"startDate_LOCAL":1462603412,"startDate_pretty_GMT":"May 07, 2016 21:43:32","surf_max_maximum":6.92,"units":"e","periodSchedule":[["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"]],"agg_height1":[[1.8,1.8,1.6,1.5],[1.4,1.3,1.3,1.5],[1.7,1.4,2.2,2.4],[2.4,2.5,2.5,2.5],[2.5,2.4,2.3,2.1],[2.1,2,2.3,2.4],[2.5,2.6,2.6,2.6],[2.6,2.6,2.7,2.7],[2.7,2.6,2.6,2.5],[2.2,2.1,2.2,2.7],[2.6,2.4,2.5,2.4],[2.4,2.5,2.3,2.2],[2.3,2.9,2.8,2.7],[2.5,2.4,2.3,2.1],[2,1.9,1.8,1.7],[1.6,1.6,1.4,1.3]],"dateStamp":[["May 07, 2016 05:00:00","May 07, 2016 11:00:00","May 07, 2016 17:00:00","May 07, 2016 23:00:00"],["May 08, 2016 05:00:00","May 08, 2016 11:00:00","May 08, 2016 17:00:00","May 08, 2016 23:00:00"],["May 09, 2016 05:00:00","May 09, 2016 11:00:00","May 09, 2016 17:00:00","May 09, 2016 23:00:00"],["May 10, 2016 05:00:00","May 10, 2016 11:00:00","May 10, 2016 17:00:00","May 10, 2016 23:00:00"],["May 11, 2016 05:00:00","May 11, 2016 11:00:00","May 11, 2016 17:00:00","May 11, 2016 23:00:00"],["May 12, 2016 05:00:00","May 12, 2016 11:00:00","May 12, 2016 17:00:00","May 12, 2016 23:00:00"],["May 13, 2016 05:00:00","May 13, 2016 11:00:00","May 13, 2016 17:00:00","May 13, 2016 23:00:00"],["May 14, 2016 05:00:00","May 14, 2016 11:00:00","May 14, 2016 17:00:00","May 14, 2016 23:00:00"],["May 15, 2016 05:00:00","May 15, 2016 11:00:00","May 15, 2016 17:00:00","May 15, 2016 23:00:00"],["May 16, 2016 05:00:00","May 16, 2016 11:00:00","May 16, 2016 17:00:00","May 16, 2016 23:00:00"],["May 17, 2016 05:00:00","May 17, 2016 11:00:00","May 17, 2016 17:00:00","May 17, 2016 23:00:00"],["May 18, 2016 05:00:00","May 18, 2016 11:00:00","May 18, 2016 17:00:00","May 18, 2016 23:00:00"],["May 19, 2016 05:00:00","May 19, 2016 11:00:00","May 19, 2016 17:00:00","May 19, 2016 23:00:00"],["May 20, 2016 05:00:00","May 20, 2016 11:00:00","May 20, 2016 17:00:00","May 20, 2016 23:00:00"],["May 21, 2016 05:00:00","May 21, 2016 11:00:00","May 21, 2016 17:00:00","May 21, 2016 23:00:00"],["May 22, 2016 05:00:00","May 22, 2016 11:00:00","May 22, 2016 17:00:00","May 22, 2016 23:00:00"]],"modelRunDisplay":2016050612,"agg_direction1":[[274,273,276,276],[276,274,274,201],[201,194,201,198],[200,200,199,199],[199,199,199,199],[199,199,197,195],[194,194,195,195],[195,196,196,197],[197,197,197,197],[196,196,196,196],[196,196,196,196],[196,196,195,196],[195,196,196,197],[197,197,197,197],[197,197,197,197],[197,196,197,198]],"modelCodeDisplay":"undefined","modelCode":[["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"],["undefined","undefined","undefined","undefined"]],"agg_location":[[4738,4738,4738,4738],[4736,4736,4736,4736],[4739,4739,4739,4739],[4739,4739,4739,4739],[4739,4739,4739,4741],[4739,4739,4741,4739],[4739,4739,4739,4739],[4739,4739,4739,4739],[4741,4741,4736,4739],[4739,4739,4736,4736],[4736,4736,4736,4736],[4736,4736,4739,4739],[4739,4739,4739,4739],[4739,4739,4739,4739],[4741,4741,4741,4738],[4738,4738,4738,4739]],"swell_period1":[[8.4,8.4,8.4,8.4],[8.4,8.4,7.6,19.8],[18,18,16.3,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,13.5,13.5],[13.5,13.5,13.5,12.3],[14.9,14.9,14.9,14.9],[13.5,13.5,13.5,13.5],[12.3,12.3,12.3,13.5],[13.5,12.3,16.3,16.3],[16.3,16.3,14.9,14.9],[14.9,14.9,16.3,16.3],[13.5,16.3,14.9,14.9],[14.9,14.9,13.5,13.5],[13.5,13.5,13.5,13.5],[12.3,12.3,12.3,12.3]],"swell_period2":[[11.2,11.2,11.2,11.2],[11.2,11.2,19.8,6.9],[6.9,12.3,12.3,12.3],[11.2,11.2,11.2,10.2],[10.2,10.2,10.2,11.2],[19.8,19.8,10.2,19.8],[19.8,19.8,19.8,19.8],[18,18,11.2,3.6],[21.8,19.8,19.8,19.8],[18,18,12.3,12.3],[12.3,19.8,19.8,18],[18,18,13.5,13.5],[16.3,6.9,6.3,6.3],[6.3,6.3,5.7,5.7],[5.7,5.7,6.3,6.9],[6.3,6.3,6.3,5.7]],"swell_period3":[[13.5,13.5,13.5,12.3],[12.3,12.3,11.2,12.3],[12.3,14.9,10.2,5.2],[4.7,5.2,3.2,4.7],[4.7,4.7,2.9,19.8],[21.8,21.8,2.4,9.3],[9.3,8.4,8.4,10.2],[10.2,11.2,3.6,21.8],[11.2,3.9,4.3,4.7],[5.2,5.7,6.3,6.3],[6.3,12.3,9.3,11.2],[10.2,5.7,5.7,6.9],[6.9,9.3,8.4,8.4],[8.4,8.4,6.9,6.9],[9.3,9.3,9.3,8.4],[8.4,7.6,14.9,14.9]],"swell_height3":[[1.1,1.1,1.1,1],[1.1,1,1,0.9],[1,1.1,0.7,0.6],[0.6,0.5,0.4,0.4],[0.4,0.3,0.4,0.4],[0.4,0.4,0.2,0.5],[0.6,0.8,0.6,0.6],[0.6,0.6,0.5,0.5],[0.5,0.6,1,1.3],[1.3,1.1,1.5,1.4],[1.3,1.5,1.6,1.6],[1.5,1.2,1.4,1.5],[1.5,0.8,0.8,0.7],[0.6,0.5,0.7,0.7],[0.4,0.4,0.3,0.4],[0.3,0.4,0.6,0.7]],"agg_spread1":[[13,14,10,10],[10,14,14,9],[9,4,10,12],[11,10,10,9],[9,10,10,9],[9,8,10,10],[10,10,10,9],[9,8,9,9],[9,9,9,9],[7,8,9,9],[9,9,9,9],[9,9,8,8],[9,8,8,8],[8,8,9,9],[9,9,10,10],[10,11,11,10]],"surf_max":[[2.69,2.63,2.55,2.5],[2.44,2.38,2.4,3.34],[3.4,3.46,3.95,4.25],[4.21,4.24,3.87,3.8],[3.75,3.66,3.16,3.03],[3.07,3.19,3.18,3.33],[4.2,4.27,4.29,4.3],[3.87,3.75,3.68,3.86],[3.69,4.11,4.63,4.92],[4.67,4.23,4.55,4.96],[4.76,5.38,5.08,5.38],[5.4,5.17,4.88,4.77],[4.57,4.91,4.29,4.12],[3.93,3.72,3.19,3.03],[2.54,2.42,2.29,2.17],[2.02,1.91,1.83,1.75]],"surf_min":[[1.69,1.63,1.55,1.5],[1.44,1.38,1.4,2.34],[2.38,2.42,2.77,2.97],[2.95,2.97,2.71,2.66],[2.62,2.56,2.32,2.14],[2.15,2.23,2.31,2.41],[2.94,2.99,3,3.01],[2.71,2.62,2.68,2.72],[2.73,2.88,3.24,3.45],[3.27,2.96,3.19,3.47],[3.33,3.76,3.56,3.76],[3.78,3.62,3.41,3.34],[3.2,3.44,3,2.88],[2.75,2.6,2.25,2.13],[1.54,1.42,1.29,1.17],[1.02,0.91,0.83,0.75]],"swell_direction2":[[178,178,177,177],[176,175,197,275],[276,193,285,285],[285,285,285,285],[285,284,283,281],[180,180,279,213],[209,208,207,210],[208,212,285,277],[194,197,197,196],[196,195,196,196],[198,197,196,196],[195,194,196,196],[198,279,278,278],[277,277,274,273],[275,275,275,275],[274,276,274,276]],"agg_surf_max":[[3.04,2.95,2.89,2.89],[3.1,3.45,4.09,4.48],[4.64,4.8,5.01,5.33],[5.41,5.07,4.88,4.8],[4.71,4.49,4.09,4.04],[4.14,4.4,4.85,5.8],[5.85,5.84,5.77,5.64],[5.18,5.07,5.17,5.24],[5.61,6.46,6.53,6.92],[6.52,6.5,6.3,6.56],[6.81,6.87,6.78,6.35],[6.46,6.32,6.14,5.92],[5.93,5.92,5.79,5.21],[5.11,4.79,4.45,3.96],[3.68,3.44,3.2,2.77],[2.81,2.8,2.57,2.54]],"swell_height1":[[1.8,1.8,1.6,1.5],[1.4,1.3,1.3,1.5],[1.7,1.4,2.2,2.4],[2.4,2.5,2.5,2.5],[2.5,2.4,2.3,2.1],[2.1,2,2.3,2.4],[2.5,2.6,2.6,2.6],[2.6,2.6,2.7,2.7],[2.7,2.6,2.6,2.5],[2.2,2.1,2.2,2.7],[2.6,2.4,2.5,2.4],[2.4,2.5,2.3,2.2],[2.3,2.9,2.8,2.7],[2.5,2.4,2.3,2.1],[2,1.9,1.8,1.7],[1.6,1.6,1.4,1.3]],"swell_height2":[[1.5,1.4,1.3,1.2],[1.1,1,1,1.2],[1.1,1.3,1.2,1.2],[1.2,1.1,0.9,0.8],[0.7,0.5,0.4,0.4],[0.5,0.7,0.6,0.7],[0.9,0.9,0.8,0.8],[0.8,0.6,0.5,0.6],[0.7,1.3,1.7,1.8],[1.9,1.8,2.1,1.7],[1.6,1.6,1.6,2],[2.1,2,2.2,2.2],[1.9,1.5,1.6,1.6],[1.5,1.5,1.4,1.4],[1.5,1.4,1.4,1.3],[1.2,1,0.9,0.7]],"agg_surf_min":[[2.04,1.95,1.89,1.89],[2.1,2.45,3.42,3.75],[3.89,4.02,4.19,4.46],[4.41,4.24,4.08,4.01],[3.94,3.49,3.42,3.38],[3.46,3.4,4.06,4.85],[4.9,4.89,4.83,4.72],[4.33,4.24,4.33,4.38],[4.7,5.41,5.47,5.79],[5.46,5.44,5.27,5.49],[5.7,5.74,5.68,5.31],[5.41,5.29,5.13,4.96],[4.96,4.95,4.84,4.36],[4.28,4.01,3.45,3.38],[3.13,2.44,2.2,1.77],[1.81,1.8,1.57,1.54]]},"name":"South Orange County","theWalue":"0 2950","hvp":{"hvp_h7":[[0.58,0.58,0.58,0.56],[0.52,0.45,0.4,0.34],[0.28,0.21,0.17,0.16],[0.16,0.16,0.16,0.14],[0.13,0.13,0.12,0.11],[0.12,0.09,0.07,0.07],[0.1,0.16,0.19,0.18],[0.16,0.15,0.13,0.13],[0.21,0.29,0.29,0.26],[0.29,0.45,0.56,0.45],[0.39,0.42,0.44,0.42],[0.38,0.37,0.43,0.51],[0.51,0.51,0.52,0.5],[0.45,0.43,0.44,0.43],[0.42,0.42,0.41,0.39],[0.34,0.25,0.18,0.16]],"hvp_h25":[[0.06,0.06,0.06,0],[0,0,0,0],[0,0,0,0],[0,0,0,0.14],[0.21,0.21,0.18,0.16],[0.11,0.06,0,0],[0,0,0,0],[0.1,0.11,0.1,0.09],[0.12,0.14,0.11,0.18],[0.18,0.14,0.14,0.15],[0.17,0.12,0.1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0.08,0.08]],"hvp_h8":[[0.8,0.82,0.8,0.77],[0.71,0.63,0.56,0.52],[0.46,0.43,0.44,0.45],[0.46,0.45,0.44,0.42],[0.37,0.34,0.28,0.26],[0.23,0.25,0.29,0.35],[0.47,0.53,0.52,0.47],[0.4,0.39,0.36,0.35],[0.37,0.34,0.3,0.27],[0.32,0.55,0.74,0.62],[0.56,0.63,0.67,0.62],[0.53,0.48,0.49,0.6],[0.65,0.69,0.72,0.69],[0.63,0.6,0.57,0.53],[0.5,0.48,0.48,0.49],[0.47,0.43,0.39,0.32]],"startDate_pretty_GMT":"May 07, 2016 21:43:32","hvp_h10":[[0.71,0.71,0.69,0.68],[0.67,0.67,0.63,0.58],[0.56,0.6,0.7,0.73],[0.69,0.66,0.65,0.62],[0.59,0.54,0.49,0.46],[0.45,0.47,0.47,0.47],[0.46,0.5,0.52,0.54],[0.57,0.58,0.57,0.57],[0.55,0.56,0.59,0.61],[0.61,0.62,0.61,0.6],[0.56,0.57,0.62,0.65],[0.64,0.64,0.64,0.63],[0.6,0.56,0.52,0.48],[0.45,0.45,0.47,0.5],[0.49,0.46,0.43,0.4],[0.38,0.36,0.37,0.41]],"hvp_h11":[[0.87,0.8,0.77,0.78],[0.76,0.71,0.68,0.71],[0.82,0.86,0.82,0.85],[0.88,0.87,0.79,0.67],[0.59,0.56,0.6,0.63],[0.65,0.65,0.66,0.68],[0.73,0.76,0.81,0.82],[0.79,0.79,0.83,0.91],[0.97,0.98,0.96,0.92],[0.87,0.82,0.78,0.78],[0.81,0.87,0.93,0.92],[0.87,0.81,0.73,0.66],[0.63,0.62,0.62,0.63],[0.63,0.63,0.62,0.59],[0.56,0.53,0.52,0.54],[0.57,0.58,0.58,0.58]],"units":"e","hvp_h13":[[0.94,0.95,0.93,0.9],[0.86,0.84,0.87,0.92],[0.9,0.92,0.98,0.9],[0.78,0.72,0.73,0.81],[0.89,0.92,0.92,0.97],[1.02,1.09,1.14,1.13],[1.08,1.03,1,1.03],[1.11,1.21,1.3,1.35],[1.35,1.31,1.26,1.22],[1.2,1.24,1.28,1.28],[1.21,1.06,0.86,0.75],[0.74,0.76,0.81,0.88],[0.94,0.97,0.97,0.93],[0.87,0.82,0.8,0.82],[0.86,0.89,0.9,0.9],[0.91,0.91,0.9,0.85]],"hvp_h14":[[1.18,1.1,1.03,0.96],[0.89,0.84,0.81,0.87],[1.06,1.31,1.5,1.64],[1.74,1.84,1.98,2.07],[2.09,2.03,1.88,1.68],[1.51,1.42,1.37,1.4],[1.51,1.73,1.95,2.05],[2.02,1.94,1.86,1.82],[1.81,1.75,1.67,1.59],[1.52,1.49,1.46,1.53],[1.66,1.76,2.04,2.26],[2.26,2.09,1.88,1.79],[1.81,1.9,2.03,2.12],[2.1,2,1.86,1.73],[1.6,1.45,1.27,1.1],[0.97,0.9,0.89,0.9]],"height_max":2.26,"hvp_h17":[[0.45,0.41,0.43,0.53],[0.66,0.76,0.94,1.2],[1.37,1.41,1.36,1.39],[1.43,1.33,1.08,0.79],[0.59,0.5,0.47,0.48],[0.55,0.69,0.94,1.25],[1.4,1.34,1.15,0.99],[0.92,0.96,1.03,1.06],[1.03,0.99,1.03,1.32],[1.74,1.61,2.03,2.19],[2.07,1.79,1.49,1.6],[1.87,2.06,2.12,2.09],[1.97,1.73,1.36,1],[0.76,0.62,0.53,0.46],[0.43,0.43,0.44,0.45],[0.46,0.46,0.47,0.46]],"dateStamp":[["May 07, 2016 05:00:00","May 07, 2016 11:00:00","May 07, 2016 17:00:00","May 07, 2016 23:00:00"],["May 08, 2016 05:00:00","May 08, 2016 11:00:00","May 08, 2016 17:00:00","May 08, 2016 23:00:00"],["May 09, 2016 05:00:00","May 09, 2016 11:00:00","May 09, 2016 17:00:00","May 09, 2016 23:00:00"],["May 10, 2016 05:00:00","May 10, 2016 11:00:00","May 10, 2016 17:00:00","May 10, 2016 23:00:00"],["May 11, 2016 05:00:00","May 11, 2016 11:00:00","May 11, 2016 17:00:00","May 11, 2016 23:00:00"],["May 12, 2016 05:00:00","May 12, 2016 11:00:00","May 12, 2016 17:00:00","May 12, 2016 23:00:00"],["May 13, 2016 05:00:00","May 13, 2016 11:00:00","May 13, 2016 17:00:00","May 13, 2016 23:00:00"],["May 14, 2016 05:00:00","May 14, 2016 11:00:00","May 14, 2016 17:00:00","May 14, 2016 23:00:00"],["May 15, 2016 05:00:00","May 15, 2016 11:00:00","May 15, 2016 17:00:00","May 15, 2016 23:00:00"],["May 16, 2016 05:00:00","May 16, 2016 11:00:00","May 16, 2016 17:00:00","May 16, 2016 23:00:00"],["May 17, 2016 05:00:00","May 17, 2016 11:00:00","May 17, 2016 17:00:00","May 17, 2016 23:00:00"],["May 18, 2016 05:00:00","May 18, 2016 11:00:00","May 18, 2016 17:00:00","May 18, 2016 23:00:00"],["May 19, 2016 05:00:00","May 19, 2016 11:00:00","May 19, 2016 17:00:00","May 19, 2016 23:00:00"],["May 20, 2016 05:00:00","May 20, 2016 11:00:00","May 20, 2016 17:00:00","May 20, 2016 23:00:00"],["May 21, 2016 05:00:00","May 21, 2016 11:00:00","May 21, 2016 17:00:00","May 21, 2016 23:00:00"],["May 22, 2016 05:00:00","May 22, 2016 11:00:00","May 22, 2016 17:00:00","May 22, 2016 23:00:00"]],"hvp_h6":[[1.29,1.33,1.32,1.27],[1.17,1.07,0.98,0.9],[0.81,0.69,0.58,0.59],[0.59,0.57,0.64,0.57],[0.49,0.42,0.54,0.46],[0.34,0.35,0.52,0.57],[0.42,0.45,0.54,0.55],[0.49,0.48,0.51,0.6],[0.46,0.67,1.09,1.27],[1.19,1.34,1.41,1.3],[1.19,1.2,1.25,1.21],[1.1,1.1,1.23,1.32],[1.31,1.33,1.41,1.42],[1.37,1.35,1.39,1.39],[1.34,1.29,1.26,1.21],[1.09,0.99,0.88,0.75]],"hvp_h33":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"startDate_GMT":1462653812,"startDate_LOCAL":1462603412,"hvp_h20":[[0.26,0.36,0.43,0.52],[0.63,0.74,0.79,0.76],[0.71,0.62,0.55,0.55],[0.52,0.43,0.31,0.18],[0.12,0.11,0.27,0.49],[0.62,0.66,0.74,0.89],[0.95,0.89,0.79,0.69],[0.56,0.45,0.44,0.58],[0.75,1.26,1.69,1.59],[1.02,0.84,0.87,0.94],[1.28,1.58,1.61,1.4],[1.14,0.99,0.88,0.73],[0.58,0.45,0.35,0.26],[0.19,0.15,0.13,0.14],[0.13,0.15,0.1,0.11],[0.1,0.11,0.11,0.13]],"startDate_pretty_LOCAL":"May 07, 2016 14:43:32","periodSchedule":[["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"],["0500","1100","1700","2300"]],"hvp_h9":[[0.63,0.62,0.58,0.55],[0.53,0.52,0.52,0.53],[0.51,0.5,0.5,0.5],[0.51,0.5,0.47,0.44],[0.39,0.36,0.32,0.34],[0.37,0.39,0.45,0.52],[0.49,0.42,0.38,0.37],[0.36,0.37,0.37,0.38],[0.39,0.39,0.38,0.36],[0.34,0.32,0.36,0.38],[0.4,0.48,0.56,0.53],[0.47,0.45,0.44,0.49],[0.55,0.58,0.59,0.54],[0.47,0.45,0.42,0.41],[0.43,0.45,0.41,0.35],[0.32,0.3,0.3,0.29]]},"lat":"33.456","Analysis":{"weatherText":["","","","","","","","","","","","","","","","",""],"surfMax":[3,3,5,5,5,3,4,5,6,7,7,6,6,5,3,3,""],"surfText":["Knee to chest high","Knee to chest high","waist to head high","waist to head high","waist to head high","thigh to chest high","waist to shoulder high","Shoulder to head","Head high to 1ft overhead","Shoulder high to 2ft overhead","Shoulder high to 2ft overhead","Head high to 1ft overhead","Head high to 1ft overhead","Shoulder to head","Ankle to waist","Ankle to waist",""],"startDate_LOCAL":1462603413,"startDate_GMT":1462575600,"units":"e","startDate_pretty_LOCAL":"05\/07\/16","is_current":"","generalCondition":["fair","fair","fair","fair","fair","fair","fair","","","","","","","","","",""],"surfMin":[2,2,3,3,3,2,3,4,5,5,6,5,5,4,2,2,""],"surfPeak":[4,"none","none",6,"none",4,5,"","","","","","","","","",""],"surfRange":["2-3 ft.+ - knee to chest high 05\/07\/2016","2-3 ft.+ - knee to chest high 05\/08\/2016","3-5 ft. - waist to head high 05\/09\/2016","3-5 ft. - waist to head high 05\/10\/2016","3-5 ft. - waist to head high 05\/11\/2016","2-3 ft + - thigh to chest high 05\/12\/2016","3-4 ft. + - waist to shoulder high 05\/13\/2016","Shoulder to head 05\/14\/2016","Head high to 1ft overhead 05\/15\/2016","Shoulder high to 2ft overhead 05\/16\/2016","Shoulder high to 2ft overhead 05\/17\/2016","Head high to 1ft overhead 05\/18\/2016","Head high to 1ft overhead 05\/19\/2016","Shoulder to head 05\/20\/2016","Ankle to waist 05\/21\/2016","Ankle to waist 05\/22\/2016"," 05\/23\/2016"],"startDate_pretty_GMT":"05\/07\/16","canExceed":["TRUE","TRUE","FALSE","FALSE","FALSE","TRUE","TRUE","","","","","","","","","",""],"isLOLA":["false","false","false","false","false","false","false","true","true","true","true","true","true","true","true","true","true"],"generalText":["SW and selective SSE swells easing. Small NW sell mix. Light\/Variable onshore flow through the morning, building for the afternoon.  ","New SW\/SSW due to show. Small NW swell.   ","SW\/SSW swell builds further - larger sets possible for focal points. Small NW energy blends in.  ","SW\/SSW swell continues - larger sets possible for focal points. Small NW energy blends in.  ","SW\/SSW swell eases - larger sets possible for focal points. Small NW energy blends in.  ","SW\/SSW continues to fade. New SSW swell picking up in the PM. Small NW energy.   ","SSW swell tops out. Trace NW energy.  ","Small mid period swell from the  south-southwest holding  during the day. Light south-southwest winds, winds dropping rapidly later and switching to the southeast. ","Small mid period swell from the  south-southwest holding  during the day. Light south winds, winds dropping rapidly later and switching to the southeast. ","Small mid period swell from the  south-southwest holding  during the day. Light south winds and switching to the east-southeast. ","Small long period swell from the  south-southwest holding  during the day. Light and variable south winds with smooth seas all day. ","Small long period swell from the  south-southwest holding  during the day. Light and variable south winds with smooth seas all day. ","Small long period swell from the  south-southwest holding  during the day. Light and variable southwest winds with smooth seas all day. ","Small long period swell from the  south-southwest holding  during the day. Light and variable west-southwest winds with smooth seas all day. ","Very Small mid period swell from the  south-southwest holding  during the day. Light and variable west-southwest winds with smooth seas all day. "," ",""]},"Confidence":{"startDate_pretty_LOCAL":"May 07, 2016 14:43:32","startDate_LOCAL":1462603412,"dateStamp":["May 07, 2016 14:43:32","May 08, 2016 14:43:32","May 09, 2016 14:43:32","May 10, 2016 14:43:32","May 11, 2016 14:43:32","May 12, 2016 14:43:32","May 13, 2016 14:43:32","May 14, 2016 14:43:32","May 15, 2016 14:43:32","May 16, 2016 14:43:32","May 17, 2016 14:43:32","May 18, 2016 14:43:32","May 19, 2016 14:43:32","May 20, 2016 14:43:32","May 21, 2016 14:43:32","May 22, 2016 14:43:32","May 23, 2016 14:43:32"],"confidenceLevels":["100","100","100","90","90","90","80","80","70","60","50","40","30","20","20","10","10"],"startDate_GMT":1462653812,"startDate_pretty_GMT":"May 07, 2016 21:43:32"},"Ureport":{"USER_ID":[],"USER_COMMENT":[],"WAVE_SIZE":[],"NUM_VIEWS":[],"USER_NAME":[],"OCC_WAVE_SIZE":[],"RATING":[],"SUBMIT_DATE":[],"WATER_TEMP":[],"PHOTO_URL":[],"WIND_DIRECTION":[],"USER_DATETIME":[],"USER_EMAIL":[],"WIND_SPEED":[],"POO_LEVEL":[],"SURF_CONDITIONS":[]},"lon":"-117.747","Wind":{"windsource":"wrfsocal","alternatewind":"YES","dateStamp":[["May 07, 2016 02:00:00","May 07, 2016 05:00:00","May 07, 2016 08:00:00","May 07, 2016 11:00:00","May 07, 2016 14:00:00","May 07, 2016 17:00:00","May 07, 2016 20:00:00","May 07, 2016 23:00:00"],["May 08, 2016 02:00:00","May 08, 2016 05:00:00","May 08, 2016 08:00:00","May 08, 2016 11:00:00","May 08, 2016 14:00:00","May 08, 2016 17:00:00","May 08, 2016 20:00:00","May 08, 2016 23:00:00"],["May 09, 2016 02:00:00","May 09, 2016 05:00:00","May 09, 2016 08:00:00","May 09, 2016 11:00:00","May 09, 2016 14:00:00","May 09, 2016 17:00:00","May 09, 2016 20:00:00","May 09, 2016 23:00:00"],["May 10, 2016 02:00:00","May 10, 2016 05:00:00","May 10, 2016 08:00:00","May 10, 2016 11:00:00","May 10, 2016 14:00:00","May 10, 2016 17:00:00","May 10, 2016 20:00:00","May 10, 2016 23:00:00"],["May 11, 2016 02:00:00","May 11, 2016 05:00:00","May 11, 2016 08:00:00","May 11, 2016 11:00:00","May 11, 2016 14:00:00","May 11, 2016 17:00:00","May 11, 2016 20:00:00","May 11, 2016 23:00:00"],["May 12, 2016 02:00:00","May 12, 2016 05:00:00","May 12, 2016 08:00:00","May 12, 2016 11:00:00","May 12, 2016 14:00:00","May 12, 2016 17:00:00","May 12, 2016 20:00:00","May 12, 2016 23:00:00"],["May 13, 2016 02:00:00","May 13, 2016 05:00:00","May 13, 2016 08:00:00","May 13, 2016 11:00:00","May 13, 2016 14:00:00","May 13, 2016 17:00:00","May 13, 2016 20:00:00","May 13, 2016 23:00:00"],["May 14, 2016 02:00:00","May 14, 2016 05:00:00","May 14, 2016 08:00:00","May 14, 2016 11:00:00","May 14, 2016 14:00:00","May 14, 2016 17:00:00","May 14, 2016 20:00:00","May 14, 2016 23:00:00"],["May 15, 2016 02:00:00","May 15, 2016 05:00:00","May 15, 2016 08:00:00","May 15, 2016 11:00:00","May 15, 2016 14:00:00","May 15, 2016 17:00:00","May 15, 2016 20:00:00","May 15, 2016 23:00:00"],["May 16, 2016 02:00:00","May 16, 2016 05:00:00","May 16, 2016 08:00:00","May 16, 2016 11:00:00","May 16, 2016 14:00:00","May 16, 2016 17:00:00","May 16, 2016 20:00:00","May 16, 2016 23:00:00"],["May 17, 2016 02:00:00","May 17, 2016 05:00:00","May 17, 2016 08:00:00","May 17, 2016 11:00:00","May 17, 2016 14:00:00","May 17, 2016 17:00:00","May 17, 2016 20:00:00","May 17, 2016 23:00:00"],["May 18, 2016 02:00:00","May 18, 2016 05:00:00","May 18, 2016 08:00:00","May 18, 2016 11:00:00","May 18, 2016 14:00:00","May 18, 2016 17:00:00","May 18, 2016 20:00:00","May 18, 2016 23:00:00"],["May 19, 2016 02:00:00","May 19, 2016 05:00:00","May 19, 2016 08:00:00","May 19, 2016 11:00:00","May 19, 2016 14:00:00","May 19, 2016 17:00:00","May 19, 2016 20:00:00","May 19, 2016 23:00:00"],["May 20, 2016 02:00:00","May 20, 2016 05:00:00","May 20, 2016 08:00:00","May 20, 2016 11:00:00","May 20, 2016 14:00:00","May 20, 2016 17:00:00","May 20, 2016 20:00:00","May 20, 2016 23:00:00"],["May 21, 2016 02:00:00","May 21, 2016 05:00:00","May 21, 2016 08:00:00","May 21, 2016 11:00:00","May 21, 2016 14:00:00","May 21, 2016 17:00:00","May 21, 2016 20:00:00","May 21, 2016 23:00:00"]],"units":"kts","startDate_pretty_LOCAL":"May 07, 2016 14:43:32","startDate_pretty_GMT":"May 07, 2016 21:43:32","periodSchedule":[["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"],["0200","0500","0800","1100","1400","1700","2000","2300"]],"wind_direction":[[110,124,118,201,225,240,267,278],[298,229,231,218,243,256,269,279],[264,235,217,221,242,258,279,297],[306,264,238,239,248,266,281,320],[7,21,347,262,259,261,277,313],[340,347,320,254,256,255,275,277],[337,298,264,231,243,255,272,205],[123,128,127,193,214,233,238,140],[129,121,132,182,204,216,233,133],[139,122,128,185,202,216,186,127],[127,124,148,185,215,231,215,193],[168,149,168,189,208,222,214,203],[187,165,195,219,234,242,242,241],[239,234,252,257,260,262,261,260],[259,254,255,256,256,257,254,249]],"startDate_GMT":1462653812,"wind_speed":[[2.6630669513,3.7904967555,6.4341252619,4.5485961066,9.5442764459,9.9330453439,5.9870410292,4.1403887637],[0.7969762409,1.3801295879,2.3520518329,6.5313174864,11.2354211522,10.4578833562,6.5896328211,3.0323974044],[1.8660907104,2.0410367145,4.0431965392,6.220302368,10.4384449113,10.0496760133,6.220302368,2.8380129554],[1.8855291553,0.777537796,2.1187904941,7.0950323885,10.496760246,9.9913606786,4.8207343352,2.3520518329],[1.6911447063,2.4298056125,2.5853131717,6.609071266,10.9244060338,8.552915756,3.5766738616,2.0410367145],[2.2159827186,2.4492440574,1.8855291553,6.1425485884,9.6025917806,7.6393088457,3.8293736453,1.7300215961],[1.1274298042,0.5053995674,0.8358531307,6.220302368,9.7775377847,7.7365010702,3.304535633,0.7580993511],[2.0993520492,2.5853131717,4.9956803393,7.8142548498,8.3002159723,6.6479481558,2.332613388,1.6911447063],[3.2073434085,4.2375809882,6.1619870333,7.5032397314,9.1166306581,6.2008639231,2.3909287227,1.8466522655],[3.3434125228,4.3736501025,5.7537796904,7.6393088457,8.8639308744,6.9589632742,2.6436285064,4.859611225],[5.637149021,5.7537796904,4.1403887637,3.8488120902,5.1123110087,7.1339092783,5.7732181353,5.0734341189],[5.2872570128,6.3369330374,5.6177105761,5.637149021,6.414686817,7.6781857355,6.3563714823,5.1900647883],[4.3153347678,3.9460043147,3.9654427596,4.9568034495,6.4924405966,8.2807775274,6.6285097109,4.9762418944],[3.3239740779,1.7105831512,3.498920082,5.4038876822,7.3477321722,9.2915766622,7.4838012865,5.6760259108],[3.8682505351,2.0799136043,3.7127429759,5.3844492373,7.0367170538,8.6695464254,6.9395248293,5.2289416781]],"startDate_LOCAL":1462603412},"SurflineWeather":{"Error":"No SLWS Defined"},"Quickspot":{"pws":"","SMILURL2":"","subregionname":"South Orange County","region_status":"PUBLISHED","cameraid":"","picuploadurl1":"","picuploadurl2":"","generateforecast":1,"picuploadurl4":"","areaid":4716,"RTSPURL":"","areaname":"North America","spotname_additional":"(Laguna)","spot_status":"PUBLISHED","areaalias":"","id":16973,"subregion_lon2":-117.747,"M3U8URL":"","stillimage":"","regionalias":"socal","lat":33.5426831035,"area_order":10,"spotid":4860,"subregion_tide_location":"T-street","regionname":"Southern California","subregion_status":"PUBLISHED","last_updated":"October 23, 2015 14:06:49","subregionid":2950,"subregionalias":"sorange","spot_additional_info":"forecast","subregion_lat1":33.47,"subregion_lat2":33.456,"region_order":50,"nearshore_model_name":"orange","spot_order":10,"SMILURL":"","SMILURL3ALIAS":"","timezone":-7,"travelid":55081,"embeddable":1,"lat_forecast":33.542,"picuploadurl3":"","spotname":"Rockpile","subregion_lon1":-117.71,"camera_alias":"","subregion_order":6,"lon":-117.791598864,"regionid":2081,"SMILURL3ROOT":"","lon_forecast":-117.793,"display_tides":1,"hdcameraid":"","camera_type":"","use_in_aggregate":1,"nearest_tide_location":"Salt Creek ( San Clemente) based on San Diego"}}
},{}]},{},[2])