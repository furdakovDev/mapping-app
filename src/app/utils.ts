import { fabric } from 'fabric';

export const uuidv4 = (): any => {
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
  opacity: 0.5,
  hasBorders: false,
  hasControls: false,
};

const generateNewPolygon = (points: any[], options: { [key: string]: any }) => new fabric.Polygon(points, options);
const generateText = (text: string, options: any) => new fabric.Text(text, options);

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

export const generatePosePoint = (points: any[], name: string) => {
  const position = getCenterCoordinatesFromPoints(points);

  const circle = new fabric.Circle({
    radius: 10,
    fill: '#dcbc65',
    originX: 'center',
    originY: 'center'
  });
  const text = generateText(name, {
    fontSize: 18,
    top: -10,
    originY: 'bottom',
    originX: 'center',
  });
  const group = new fabric.Group([ circle, text ], {
  });
  group.set({
    left: position.x - group.width / 2,
    top: position.y - group.height,
  });
  return group;
};
