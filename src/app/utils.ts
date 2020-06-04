import { fabric } from 'fabric';

const defaultControlsVisibility = {
  tr: false,
  tl: false,
  br: false,
  bl: false,
  ml: false,
  mt: false,
  mr: false,
  mb: false,
  mtr: false,
};

export const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const areaPreviewOptions = {
  stroke: '#7e7e7e',
  strokeWidth: 1,
  fill: '#7e7e7e',
  opacity: 0.3,
  selectable: false,
  hasBorders: false,
  hasControls: false,
  evented: false,
  objectCaching: false
};

const areaOptions = {
  id: uuidv4(),
  stroke: 'red',
  strokeDashArray: [5],
  strokeWidth: 1,
  fill: '#8C58E9',
  opacity: 0.2,
  hasBorders: false,
  hasControls: false,
  selectable: false,
  lockMovementY: true,
  lockMovementX: true,
  objectCaching: false,
  hoverCursor: 'default',
};

const generateNewPolygon = (points: any[], options: { [key: string]: any }) => new fabric.Polygon(points, options);
const generateText = (text: string, options: any) => new fabric.Text(text, options);

export const generateLine = (points, options) => new fabric.Line(points, options);
export const generateCircle = (options: any) => new fabric.Circle(options);
export const generatePolygonPreview = (points: any[]) => generateNewPolygon(points, areaPreviewOptions);
export const generatePolygon = (points: any[]) => generateNewPolygon(points, areaOptions);

export const getCenterCoordinatesFromPoints = (points: { x: number, y: number }[] = []): { x: number, y: number } => {
  const { sumX, sumY } = points.reduce((result, point) => ({
    sumX: result.sumX + point.x,
    sumY: result.sumY + point.y,
  }), {
    sumX: 0,
    sumY: 0,
  });
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
};

export const generatePosePoint = (points: any[], name: string, color: string): {
  circle,
  text,
} => {
  const position = getCenterCoordinatesFromPoints(points);

  const circle = new fabric.Circle({
    radius: 8,
    fill: color,
    left: position.x,
    top: position.y,
    originX: 'center',
    originY: 'center',
    cornerSize: 8,
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerColor: 'red',
    hasBorders: false,
    rotatingPointOffset: 20,
    lockMovementX: true,
    lockMovementY: true,
  });

  setControlsVisibility(circle, { mtr: true });

  const text = generateText(name, {
    fontSize: 18,
    id: uuidv4(),
    fill: color,
    selectable: false,
  } as any);
  text.set({
    top: position.y - text.height - circle.radius,
    left: position.x - text.width / 2 + circle.radius,
  });
  return {
    circle,
    text,
  };
};

export const getQuaternion = (heading, attitudeDeg, bank) => {
  const attitude = attitudeDeg * (Math.PI / 180);
  const c1 = Math.cos(heading / 2);
  const s1 = Math.sin(heading / 2);
  const c2 = Math.cos(attitude / 2);
  const s2 = Math.sin(attitude / 2);
  const c3 = Math.cos(bank / 2);
  const s3 = Math.sin(bank / 2);
  const c1c2 = c1 * c2;
  const s1s2 = s1 * s2;
  return {
    w: c1c2 * c3 - s1s2 * s3,
    x: c1c2 * s3 + s1s2 * c3,
    y: s1 * c2 * c3 + c1 * s2 * s3,
    z: c1 * s2 * c3 - s1 * c2 * s3,
  };
}

export const pointInsidePolygon = (point, points) => {
  const { x, y } = point;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].x;

    const intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

export const setControlsVisibility = (object: fabric.Object, controls: any) => {
  object.setControlsVisibility({
    ...defaultControlsVisibility,
    ...controls,
  });
}
