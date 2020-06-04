import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { fabric } from 'fabric';
import { IEvent } from 'fabric/fabric-impl';

import { generatePolygon, generatePolygonPreview, uuidv4 } from './utils';
import { Area } from './area';

const { Canvas, Image } = fabric;

enum Mode {
  'AREA' = 'AREA',
  'SQUARE' = 'SQUARE',
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('editorContainer') editorContainer: ElementRef;

  canvas: fabric.Canvas;
  areas: { [key: string]: Area } = {};
  transformStyles: { [key: string]: string } = {
    transform: 'translate(0, 0) scale(1)',
  };
  transform: {
    scale: number,
    x: number,
    y: number,
  } = {
    scale: 1,
    x: 0,
    y: 0,
  };
  isDragging: boolean;
  dragStartCoordinates: {
    x: number,
    y: number,
  };
  initTransform: {
    x: number,
    y: number,
  };

  mode: Mode;
  areaPoints: any[] = [];
  areaLines: any[] = [];
  activeShape: any;
  activeLine: any;
  showContextMenu: boolean;
  contextMenuPosition: {
    top: string,
    left: string,
  };
  currentTarget: any;
  editingArea: Area;

  ngAfterViewInit(): void {
    this.canvas = new Canvas('canvas', {
      selection: false,
      fireRightClick: true,
    });
    this.setBackground();
    this.onMouseDown();
    this.onContextMenu();
  }

  setBackground(): void {
    const imageURL = 'assets/img.png';
    Image.fromURL(imageURL, (img) => {
      // const grayscale = new fabric.Image.filters.Grayscale();
      // // @ts-ignore
      // const gamma = new fabric.Image.filters.Gamma({
      //   gamma: [1,1,0],
      // });
      // img.filters.push(grayscale, gamma);
      // img.applyFilters();

      this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
        scaleX: 1,
        scaleY: 1,
      });
      this.canvas.setHeight(img.height);
      this.canvas.setWidth(img.width);
    });
  }

  /** LISTENERS SECTION */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    this.showContextMenu = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.currentTarget && this.currentTarget.get('type') === 'circle') {
      return;
    }
    if (this.isDragging) {
      this.onEditorTranslate(event);
    }
  }

  onMouseDown(): void {
    this.canvas.on('mouse:down', (event: IEvent) => {
      this.setCurrentTarget(event);
      this.updateArea(event);

      if (this.mode === Mode.SQUARE) {
        this.processSquare(event);
      }
    });
  }

  onScroll(event: WheelEvent): void {
    this.stopEvent(event);
    if (this.transform.scale < 0.4 && event.deltaY > 0 ||
      this.transform.scale > 2 && event.deltaY < 0) {
      return;
    }
    if (event.deltaY < 0) {
      this.transform.scale += 0.1;
    } else {
      this.transform.scale -= 0.1;
    }
    this.transform.scale = Number(this.transform.scale.toFixed(1));
    this.setTransformStyles();
  }

  onEditorDrag(): void {
    this.isDragging = true;
  }

  onEditorDrop(): void {
    this.isDragging = false;
    this.dragStartCoordinates = null;
    this.initTransform = null;
  }

  onContextMenu(): void {
    (this.canvas as any).upperCanvasEl.addEventListener('contextmenu', e => {
      this.stopEvent(e);
      this.showContextMenu = !this.showContextMenu;
      if (this.showContextMenu) {
        const { offsetX, offsetY } = e;
        this.contextMenuPosition = {
          top: `${offsetY}px`,
          left: `${offsetX}px`,
        };
        console.log(this.currentTarget);
      }
    });
  }

  onEditorTranslate(event: MouseEvent): void {
    if (!this.dragStartCoordinates) {
      this.dragStartCoordinates = {
        x: event.clientX,
        y: event.clientY,
      };
      this.initTransform = {
        x: this.transform.x,
        y: this.transform.y,
      };
      return;
    }
    const deltaX = event.clientX - this.dragStartCoordinates.x;
    const deltaY = event.clientY - this.dragStartCoordinates.y;
    this.transform.x = this.initTransform.x + deltaX;
    this.transform.y = this.initTransform.y + deltaY;
    this.setTransformStyles();
  }

  /** LISTENERS SECTION END */

  setCurrentTarget(event: IEvent): void {
    if (event.target) {
      this.currentTarget = event.target;
    } else {
      this.currentTarget = null;
    }
  }

  setTransformStyles(): void {
    this.transformStyles.transform = `translate(${this.transform.x}px, ${this.transform.y}px) scale(${this.transform.scale})`;
  }

  /** AREA SECTION */
  switchToAddAreaMode(event: Event): void {
    this.stopEvent(event);
    this.mode = Mode.AREA;
    this.showActiveLine();
  }

  updateArea(event: IEvent): void {
    if (event.target && this.areaPoints.length && (event.target as any).id === this.areaPoints[0].id) {
      this.generateArea();
    }
    if (this.mode === Mode.AREA) {
      this.addPoint(event);
    }
  }

  addPoint(event: any): void {
    const zoom = this.canvas.getZoom();
    const x = event.e.offsetX / zoom;
    const y = event.e.offsetY / zoom;

    const circle = new fabric.Circle({
      radius: 5,
      fill: this.areaPoints.length === 0 ? '#dcbc65' : '#454545',
      stroke: '#454545',
      strokeWidth: 0.5,
      left: x,
      top: y,
      selectable: false,
      hasBorders: false,
      hasControls: false,
      originX: 'center',
      originY: 'center',
      id: uuidv4(),
      objectCaching: false
    } as any);

    let points = [x, y, x, y];
    const line = new fabric.Line(points, {
      strokeWidth: 2,
      fill: '#999999',
      stroke: '#999999',
      class: 'line',
      originX: 'center',
      originY: 'center',
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      objectCaching: false
    } as any);

    if (this.activeShape) {
      const position = this.canvas.getPointer(event.e);
      points = this.activeShape.get('points');
      points.push({
        x: position.x,
        y: position.y
      } as any);

      const polygon = generatePolygonPreview(points);
      this.canvas.remove(this.activeShape);
      this.canvas.add(polygon);
      this.activeShape = polygon;
      this.canvas.renderAll();
    } else {
      const polyPoint = [{ x, y }];
      const polygon = generatePolygonPreview(polyPoint);
      this.activeShape = polygon;
      this.canvas.add(polygon);
    }
    this.activeLine = line;

    this.areaPoints.push(circle);
    this.areaLines.push(line);

    this.canvas.add(line);
    this.canvas.add(circle);
    this.canvas.selection = false;
  }

  showActiveLine(): void {
    this.canvas.on('mouse:move', (event: IEvent) => {
      if (this.activeLine && this.activeLine.class === 'line') {
        const pointer = this.canvas.getPointer(event.e);
        this.activeLine.set({ x2: pointer.x, y2: pointer.y });

        const points = this.activeShape.get('points');
        points[this.areaPoints.length] = {
          x: pointer.x,
          y: pointer.y
        };

        this.activeShape.set({
          points: points
        });
        this.canvas.renderAll();
      }
    });
  }

  generateArea(): void {
    const points = this.areaPoints.map((point: any) => {
      const result = {
        x: point.left,
        y: point.top,
      };
      this.canvas.remove(point);
      return result;
    });
    for (const line of this.areaLines) {
      this.canvas.remove(line);
    }
    this.canvas.remove(this.activeShape).remove(this.activeLine);
    const area = new Area(this.canvas, points);
    this.areas[area.id] = area;
    this.exitEditMode();
  }

  editArea(event: Event): void {
    this.stopEvent(event);
    if (this.editingArea) {
      this.editingArea.toggleEdit();
      return;
    }
    this.editingArea = this.areas[this.currentTarget.id];
    this.editingArea.toggleEdit();
  }

  /** AREA SECTION END */

  /** SQUARE SECTION */
  switchToAddSquareMode(event: Event): void {
    this.stopEvent(event);
    this.mode = Mode.SQUARE;
  }

  processSquare(event: IEvent): void {
    if (!this.activeShape) {
      this.createSquare(event);
      this.onUpdateSquare();
      return;
    }
    this.saveSquare();
  }

  createSquare(event: IEvent): void {
    const points = new Array(4).fill(event.pointer);
    this.activeShape = generatePolygonPreview(points)
    this.canvas.add(this.activeShape);
  }

  onUpdateSquare(): void {
    this.canvas.on('mouse:move', (event: IEvent) => {
      const [initCoords] = this.activeShape.points;
      this.activeShape.set({
        points: [
          initCoords,
          { x: initCoords.x, y: event.pointer.y },
          event.pointer,
          { x: event.pointer.x, y: initCoords.y },
        ],
      });
      this.canvas.renderAll();
    });
  }

  saveSquare(): void {
    const { points } = this.activeShape;
    this.canvas.remove(this.activeShape);
    const area = new Area(this.canvas, points);
    this.areas[area.id] = area;
    this.exitEditMode();
  }

  /** SQUARE SECTION END*/

  exitEditMode(): void {
    this.activeLine = null;
    this.activeShape = null;
    this.mode = null;
    this.areaLines = [];
    this.areaPoints = [];
    this.canvas.off('mouse:move');
  }

  switchToAddWayPointMode(event: Event): void {
    this.stopEvent(event);
    this.canvas.on('mouse:down', (e: IEvent) => {
      const { x, y } = e.pointer;
      const circle = new fabric.Circle({
        radius: 10,
        fill: 'red',
        stroke: '#454545',
        strokeWidth: 1,
        left: x,
        top: y,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        originX: 'center',
        originY: 'center',
        id: uuidv4(),
        objectCaching: false
      } as any);

      this.canvas.add(circle);
      this.canvas.off('mouse:down');
    });
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}

