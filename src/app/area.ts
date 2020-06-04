import { fabric } from 'fabric';
import {
  generateCircle,
  generateLine,
  generatePolygon,
  generatePosePoint,
  getCenterCoordinatesFromPoints,
  getQuaternion,
  pointInsidePolygon,
  setControlsVisibility
} from './utils';

enum PointType {
  'ENTRY' = 'ENTRY',
  'EXIT' = 'EXIT',
}

interface Point {
  circle: fabric.Circle,
  fromLine: fabric.Line,
  toLine?: fabric.Line,
}

export class Area {
  area: fabric.Polygon;
  areaId: string;
  areaCenter: {
    x: number,
    y: number,
  };
  posePoint: {
    text: fabric.Text,
    circle: fabric.Circle,
  };
  entryPoints: Point[] = [];
  exitPoints: Point[] = [];
  editing: boolean;
  editingControls: fabric.Circle[] = [];

  constructor(
    private canvas: fabric.Canvas,
    private points: { x: number, y: number }[],
  ) {
    this.createArea();
  }

  private createArea(): void {
    this.area = generatePolygon(this.points);
    this.areaId = (this.area as any).id;
    this.areaCenter = getCenterCoordinatesFromPoints(this.points);

    this.canvas.add(this.area);
    this.onAreaSelect();
    this.addRoutePoint(PointType.ENTRY);
    this.addRoutePoint(PointType.EXIT);
    this.addPosePoint();
  }

  private onAreaSelect(): void {
    // sendBackwards
    this.area.on('mousedown', e => {
      this.area.sendBackwards();
    });
  }


  private addPosePoint(color: string = '#dcbc65'): void {
    this.posePoint = generatePosePoint(this.points, 'Pose', color);
    this.listenToPoseEvents();
    this.canvas.add(this.posePoint.circle).add(this.posePoint.text);
  }

  private listenToPoseEvents(): void {
    this.posePoint.circle.on('rotating', e => {
      const quaternion = getQuaternion(0, e.target.angle, 0);
    });

    this.posePoint.circle.on('moving', e => {
      console.log(pointInsidePolygon(e.pointer, this.area.points));
    });
  }

  private addRoutePoint(type: PointType): void {
    const circle = generateCircle({
      radius: 8,
      fill: type === PointType.ENTRY ? '#67B231' : '#E96058',
      hasBorders: false,
      originX: 'center',
      originY: 'center',
    });
    setControlsVisibility(circle, {});

    if (type === PointType.ENTRY) {
      circle.set({
        left: this.areaCenter.x - 150,
        top: this.areaCenter.y + 150,
      });
    } else {
      circle.set({
        left: this.areaCenter.x + 150,
        top: this.areaCenter.y + 150,
      });
    }
    const line = this.createRouteLine(circle, type);
    const pointObject: Point = {
      fromLine: line,
      circle,
    };
    if (type === PointType.ENTRY) {
      this.entryPoints.push(pointObject);
    } else {
      this.exitPoints.push(pointObject);
    }
    this.canvas.add(line).add(circle);
    this.listenToRoutePointMove(pointObject);
  }

  createRouteLine(circle: fabric.Circle, type: PointType): fabric.Line {
    let startCoordinates = this.areaCenter;
    if (type === PointType.ENTRY && this.entryPoints.length) {
      const lastCircle = this.entryPoints[this.entryPoints.length - 1].circle;
      startCoordinates = {
        x: lastCircle.left,
        y: lastCircle.top,
      };
    }
    if (type === PointType.EXIT && this.exitPoints.length) {
      const lastCircle = this.exitPoints[this.exitPoints.length - 1].circle;
      startCoordinates = {
        x: lastCircle.left,
        y: lastCircle.top,
      };
    }
    const lineColor = type === PointType.ENTRY ? '#67B231' : '#E96058';
    return generateLine([startCoordinates.x, startCoordinates.y, circle.left, circle.top], {
      strokeWidth: 2,
      fill: lineColor,
      stroke: lineColor,
      class: 'line',
      originX: 'center',
      originY: 'center',
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      objectCaching: false
    });
  }

  listenToRoutePointMove(routePoint: Point): void {
    routePoint.circle.on('moving', e => {
      // TODO check intersecting with area;
      // if (!routePoint.circle.isContainedWithinObject(this.area, true, true)) {
      routePoint.fromLine.set({ x2: e.target.left, y2: e.target.top });
      // }
    });
  }

  public toggleEdit(): void {
    this.editing = !this.editing;
    if (this.editing) {
      this.area.setOptions({
        lockMovementX: false,
        lockMovementY: false,
        selectable: true,
      });
      this.points.forEach((point, index) => {
        const circle = new fabric.Circle({
          radius: 8,
          fill: 'transparent',
          stroke: '#dcbc65',
          strokeWidth: 2,
          left: point.x,
          top: point.y,
          originX: 'center',
          originY: 'center',
          hasBorders: false,
          hasControls: false,
          name: index,
        } as any);
        this.editingControls.push(circle);
        this.canvas.add(circle);
      });

      this.canvas.on('object:moving', (options) => {
        const p = options.target;
        this.area.points[p.name] = { x: p.getCenterPoint().x, y: p.getCenterPoint().y };
      });
      return;
    }
    this.editingControls.forEach(control => {
      this.canvas.remove(control);
    });
    this.canvas.off('object:moving');
    this.area.setOptions({
      lockMovementX: true,
      lockMovementY: true,
      selectable: false,
    });
  }

  public get id(): string {
    return this.areaId;
  }
}
