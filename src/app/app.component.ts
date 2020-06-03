import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { fabric } from 'fabric';
import { IEvent } from 'fabric/fabric-impl';

import { generatePolygon, generatePolygonPreview, uuidv4 } from './utils';
const { Canvas, Image } = fabric;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('editorContainer') editorContainer: ElementRef;

  canvas: fabric.Canvas;
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

  addAreaMode: boolean;
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
    const imageURL = 'https://images.squarespace-cdn.com/content/v1/5bdde6530dbda3230ba6bd5d/1542037787083-LUDEIUFVCQBA4PSM4RKQ/ke17ZwdGBToddI8pDm48kNMIMLR5HyT8T-Jl3SGhJah7gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z4YTzHvnKhyp6Da-NYroOW3ZGjoBKy3azqku80C789l0qf8NdpI93-hxF8MNE9FzPo_HfB-tFCGNagDiClHrC5aCYTMbo5wUeomy5kNGMSdfw/Southern+California+Luxury+Home+SFP+1.png?format=2500w';
    Image.fromURL(imageURL, (img) => {
      this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
        scaleX: 1,
        scaleY: 1,
      });
      this.canvas.setHeight(img.height);
      this.canvas.setWidth(img.width);
    });
  }

  /** LISTENERS SECTION */
  @HostListener('document: click', ['$event'])
  onClick(event: MouseEvent): void {
    this.showContextMenu = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.onEditorTranslate(event);
    }
  }

  onMouseDown(): void {
    this.canvas.on('mouse:down', (event: IEvent) => {
      this.setCurrentTarget(event);
      this.updateArea(event);
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
    this.addAreaMode = true;
    this.showActiveLine();
  }

  updateArea(event: IEvent): void {
    if (event.target && this.areaPoints.length && (event.target as any).id === this.areaPoints[0].id) {
      this.generateArea();
    }
    if (this.addAreaMode) {
      this.addPoint(event);
    }
  }

  addPoint(event: any): void {
    const zoom = this.canvas.getZoom();
    const x = event.e.offsetX / zoom;
    const y = event.e.offsetY / zoom;

    const circle = new fabric.Circle({
      radius: 5,
      fill: '#454545',
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
    if (this.areaPoints.length === 0) {
      circle.set({
        fill: '#dcbc65'
      })
    }
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
    const polygon = generatePolygon(points);
    this.canvas.add(polygon);
    this.cancelAreaAdd();
  }

  cancelAreaAdd(): void {
    this.activeLine = null;
    this.activeShape = null;
    this.addAreaMode = false;
    this.areaLines = [];
    this.areaPoints = [];
    this.canvas.off('mouse:move');
  }
  /** AREA SECTION END */

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

