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
  fill: '#dcbc65',
  opacity: 0.3,
  hasBorders: false,
  hasControls: false,
};

const generateNewPolygon = (points: any[], options: { [key: string]: any }) => new fabric.Polygon(points, options);

export const generatePolygonPreview = (points: any[]) => generateNewPolygon(points, areaPreviewOptions);
export const generatePolygon = (points: any[]) => generateNewPolygon(points, areaOptions);
