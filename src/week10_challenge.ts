import "p5";
import p5 from "p5";

interface Slider {
  label: string;
  min: number;
  max: number;
  default: number;
  element?: p5.Element;
}

let sliders: Slider[] = [
  {
    label: "Gravity",
    min: 0,
    max: 20,
    default: 9.81,
  },
  {
    label: "Mass 1",
    min: 1,
    max: 10,
    default: 2,
  },
  {
    label: "Mass 2",
    min: 1,
    max: 10,
    default: 2,
  },
  {
    label: "Length 1",
    min: 100,
    max: 300,
    default: 200,
  },
  {
    label: "Length 2",
    min: 100,
    max: 300,
    default: 200,
  },
  {
    label: "Stiffness 1",
    min: 1,
    max: 20,
    default: 10,
  },
  {
    label: "Stiffness 2",
    min: 1,
    max: 20,
    default: 10,
  },
  {
    label: "Damping 1",
    min: 0.001,
    max: 0.5,
    default: 0.01,
  },
  {
    label: "Damping 2",
    min: 0.001,
    max: 0.5,
    default: 0.01,
  },
  {
    label: "Simulation speed",
    min: 0,
    max: 0.5,
    default: 0.2,
  },
];

interface PhysicalObject {
  position: p5.Vector;
  velocity: p5.Vector;
}

let object1: PhysicalObject;
let object2: PhysicalObject;

/** Create position and velocity for `object1` and `object2` */
function setupObjects() {
  const l1 = sliders[3].element!.value() as number;
  const l2 = sliders[4].element!.value() as number;

  object1 = {
    position: createVector(l1, 0),
    velocity: createVector(0, 0),
  };

  object2 = {
    position: createVector(l1 + l2, 0),
    velocity: createVector(0, 0),
  };
}

(window as any).setup = function setup() {
  createCanvas(1000, 1000);

  // Setups buttons
  createButton("Restart")
    .position(30, 30)
    .mousePressed(() => setupObjects());

  createButton("Default settings")
    .position(105, 30)
    .mousePressed(() => {
      for (const slider of sliders) {
        slider.element!.value(slider.default);
      }
    });

  // Setup sliders
  for (const [i, slider] of sliders.entries()) {
    const sliderElement = createSlider(
      slider.min,
      slider.max,
      slider.default,
      0.001
    );

    sliderElement.position(30, 70 + i * 30);
    slider.element = sliderElement;
  }

  setupObjects();
};

/**
 * Draw a spring between two positions
 * Draws a line at start and end with constant length,
 * and a spring inbetween using sine waves that stretch
 */
function drawSpring(from: p5.Vector, to: p5.Vector) {
  // How many sine waves
  const amount = 5;
  // Length of constant line at start and end
  const startEndOffset = 50;

  const direction = to.copy().sub(from).normalize();

  const start = from.copy().add(direction.copy().mult(startEndOffset));
  const end = to.copy().add(direction.copy().mult(-startEndOffset));

  // Lines with constant length
  line(from.x, from.y, start.x, start.y);
  line(to.x, to.y, end.x, end.y);

  const steps = 50;

  let previousPosition = p5.Vector.lerp(start, end, 0);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const sineOffset = sin(t * (amount * 2 * PI));
    const perpendicular = createVector(-direction.y, direction.x);

    const position = p5.Vector.lerp(start, end, t).add(
      perpendicular.mult(sineOffset * 10)
    );

    line(previousPosition.x, previousPosition.y, position.x, position.y);

    previousPosition = position;
  }
}

/**
 * Calculates hooke's force for a spring between `self` and `other`
 */
function calculateHookesForce(
  self: p5.Vector,
  other: p5.Vector,
  velocity: p5.Vector,
  restLength: number,
  stiffness: number,
  damping: number
) {
  // Vector from other to self
  const diff = self.copy().sub(other);

  const currentLength = diff.mag();
  const x = restLength - currentLength;

  const force = diff
    .normalize()
    .mult(stiffness * x)
    .sub(velocity.copy().mult(damping));

  return force;
}

(window as any).draw = function draw() {
  background(0);

  // Slider labels
  textSize(20);
  fill("white");
  for (const [i, slider] of sliders.entries()) {
    text(`${slider.label} (${slider.element!.value()})`, 170, 78 + i * 30);
  }

  // Settings from sliders
  const [g, m1, m2, l1, l2, k1, k2, damping1, damping2, simulationSpeed] =
    sliders.map((slider) => slider.element!.value() as number);

  translate(width / 2, height / 2);

  const origin = createVector(0, 0);
  const gravity = createVector(0, g);

  // Spring force from origin to object1
  const f1 = calculateHookesForce(
    object1.position,
    origin,
    object1.velocity,
    l1,
    k1,
    damping1
  );

  // Spring force from object2 to object1
  const f2 = calculateHookesForce(
    object1.position,
    object2.position,
    object1.velocity,
    l2,
    k2,
    damping1
  );

  // Spring force from object1 to object2
  const f3 = calculateHookesForce(
    object2.position,
    object1.position,
    object2.velocity,
    l2,
    k2,
    damping2
  );

  // Acceleration for object 1, a1 = (f1 + f2)/m1 + gravity
  const a1 = f1.copy().add(f2).div(m1).add(gravity.copy());

  // Acceleration for object 2, a2 = f3/m2 + gravity
  const a2 = f3.copy().div(m2).add(gravity.copy());

  // Eulers method for velocity
  object1.velocity.add(a1.copy().mult(simulationSpeed));
  object2.velocity.add(a2.copy().mult(simulationSpeed));

  // Eulers method for position
  object1.position.add(object1.velocity.copy().mult(simulationSpeed));
  object2.position.add(object2.velocity.copy().mult(simulationSpeed));

  // Draw pendulum
  stroke("white");
  drawSpring(origin, object1.position);
  drawSpring(object1.position, object2.position);

  circle(origin.x, origin.y, 50);
  circle(object1.position.x, object1.position.y, 50);
  circle(object2.position.x, object2.position.y, 50);
};
