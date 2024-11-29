import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { AppConfiguration } from 'src/app/app-configuration';
import { AltoBlock, AltoLine, AltoString } from 'src/app/shared/alto';
import { XmlJsElement } from 'src/app/shared/xml-js-element';

@Component({
    selector: 'app-viewer',
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.scss'],
    standalone: true,
    imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, TranslateModule]
})
export class ViewerComponent {
  @ViewChild('scrollerN') scrollerN: ElementRef;
  @Input() scroller: HTMLElement
  @Input() pid: string = '';

  @Input() set width(value: number){
    if (this.canvasInited) {
      this.getInfo();
    }
  }

  public _imgW = 100;
  @Input() set imgW(value: number){
    this._imgW = value;
    if (this.canvasInited) {
      setTimeout(() => {
        this.getInfo();
      }, 1)
    }
  }

  @Input() set selectedAlto(value: {blocks: XmlJsElement[], lines: XmlJsElement[], words: XmlJsElement[]}) {
    if (this.canvasInited) {
      this._alto = value;
      this.drawSelectedAlto(value);
    }
  }

  private _alto: {blocks: XmlJsElement[], lines: XmlJsElement[], words: XmlJsElement[]};

  @Output() selectionEvent = new EventEmitter<any>();

  @ViewChild('image') image: ElementRef;
  @ViewChild('selCanvas') selCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('autoCanvas') autoCanvas: ElementRef<HTMLCanvasElement>;


  ctx: CanvasRenderingContext2D;
  ctxAuto: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  imageBounds: DOMRect;
  scale: number;

  canvasOffset = 0;
  offsetX = 0;
  offsetY = 0;
  scrollX = 0;
  scrollY = 0;

  isDown = false;

  // these vars will hold the starting mouse position
  startX = 0;
  startY = 0;

  prevStartX = 0;
  prevStartY = 0;

  prevWidth = 0;
  prevHeight = 0;

  canvasInited = false;

  constructor(public config: AppConfiguration){}

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.scroller = this.scrollerN.nativeElement;
  }

  getInfo() {
    const img = this.image.nativeElement as HTMLImageElement;
    this.scale = img.width / img.naturalWidth;
    this.imageBounds = img.getBoundingClientRect();
    // this.initCanvas(img, !this.canvasInited);
    this.initCanvas(img, false);
    this.drawSelectedAlto(this._alto);
  }

  initCanvas(img: HTMLImageElement, withEvents: boolean) {

    const bounds = img.getBoundingClientRect();
    const el = this.selCanvas.nativeElement;
    el.width = bounds.width;
    el.height = bounds.height;
    el.setAttribute('style', 'position: absolute; z-index:20;' +
      'left:0; top:0;' +
      'width:' + bounds.width + 'px; height:' + bounds.height + 'px;');

    this.canvasWidth = bounds.width;
    this.canvasHeight = bounds.height;
    
    if (withEvents) {

      el.addEventListener("mousedown", (e) => {
        this.handleMouseDown(e);
      });
      // el.addEventListener("mousemove", (e) => {
      //   this.handleMouseMove(e);
      // });
      el.addEventListener("mouseup", (e) => {
        this.handleMouseUp(e);
      });
      el.addEventListener("mouseout", (e) => {
        this.handleMouseOut(e);
      });
    } else {
    }

    const a = this.autoCanvas.nativeElement;
    a.width = bounds.width;
    a.height = bounds.height;
    a.setAttribute('style', 'position: absolute; z-index:20;' +
      'left:0; top:0;' +
      'width:' + bounds.width + 'px; height:' + bounds.height + 'px;');

    this.canvasInited = true;

    //return el;
  }

  handleMouseDown(e: MouseEvent) {
    const img = this.image.nativeElement as HTMLImageElement;
    this.imageBounds = img.getBoundingClientRect();
    const scrollerBounds = this.scroller.getBoundingClientRect();
    const el = this.selCanvas.nativeElement;
    this.ctx = <CanvasRenderingContext2D>(el as HTMLCanvasElement).getContext('2d');
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.offsetX = this.imageBounds.x;
    this.offsetY = this.imageBounds.y + scrollerBounds.y;
    
    this.scrollX = this.scroller.scrollLeft;
    this.scrollY = this.scroller.scrollTop;

    e.preventDefault();
    e.stopPropagation();

    // save the starting x/y of the rectangle
    this.startX = e.clientX - this.offsetX;
    this.startY = e.clientY - this.offsetY;

    // set a flag indicating the drag has begun
    this.isDown = true;
  }

  handleMouseUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.prevStartX = this.startX ;
    this.prevStartY = this.startY ;

    // the drag is over, clear the dragging flag
    this.isDown = false;
    
    const left = Math.min(this.prevStartX, this.prevStartX + this.prevWidth) / this.scale;
    const right = Math.max(this.prevStartX, this.prevStartX + this.prevWidth) / this.scale;
    const top = Math.min(this.prevStartY, this.prevStartY + this.prevHeight) / this.scale;
    const bottom = Math.max(this.prevStartY, this.prevStartY + this.prevHeight) / this.scale;
    this.selectionEvent.emit({ left, top, right, bottom, scale: this.scale });

  }

  handleMouseOut(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // the drag is over, clear the dragging flag
    this.isDown = false;
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // if we're not dragging, just return
    if (!this.isDown) {
      return;
    }

    // get the current mouse position
    let mouseX = e.clientX - this.offsetX;
    let mouseY = e.clientY - this.offsetY;

    // calculate the rectangle width/height based
    // on starting vs current mouse position
    var width = mouseX - this.startX;
    var height = mouseY - this.startY;

    // clear the canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // draw a new rect from the start position 
    // to the current mouse position
    this.ctx.strokeRect(this.startX, this.startY, width, height);

    this.prevStartX = this.startX;
    this.prevStartY = this.startY;

    this.prevWidth = width;
    this.prevHeight = height;
  }

  drawSelectedAlto(value: {blocks: XmlJsElement[], lines: XmlJsElement[], words: XmlJsElement[]}) {
    if (!value) {
      return;
    }
    this.ctxAuto = <CanvasRenderingContext2D>(this.autoCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
    this.ctxAuto.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.drawSelectedBlocks(value.blocks);
    this.drawSelectedLines(value.lines);
    this.drawSelectedWords(value.words);

    const scrollerBounds = this.scroller.getBoundingClientRect();
    this.scroller.scrollTop = parseInt(value.words[0].attributes['VPOS'] ) * this.scale - (scrollerBounds.height * 0.5);
    this.scroller.scrollLeft = parseInt(value.words[0].attributes['HPOS'] ) * this.scale - (scrollerBounds.width * 0.5);
  }

  drawSelectedBlocks(blocks: XmlJsElement[]) {
    this.ctxAuto.strokeStyle = 'red';
    blocks.forEach(b => {
      this.ctxAuto.strokeRect(
        parseInt(b.attributes['HPOS']) * this.scale, 
        parseInt(b.attributes['VPOS']) * this.scale, 
        parseInt(b.attributes['WIDTH']) * this.scale, 
        parseInt(b.attributes['HEIGHT']) * this.scale);
    });

  }

  drawSelectedLines(lines: XmlJsElement[]) {
    this.ctxAuto.strokeStyle = 'blue';
    lines.forEach(b => {
      // this.ctxAuto.strokeRect(b.$.HPOS * this.scale, b.$.VPOS * this.scale, b.$.WIDTH * this.scale, b.$.HEIGHT * this.scale);

      this.ctxAuto.strokeRect(
        parseInt(b.attributes['HPOS']) * this.scale, 
        parseInt(b.attributes['VPOS']) * this.scale, 
        parseInt(b.attributes['WIDTH']) * this.scale, 
        parseInt(b.attributes['HEIGHT']) * this.scale);

    });

  }

  drawSelectedWords(words: XmlJsElement[]) {
    this.ctxAuto.fillStyle = 'rgba(255, 255, 0, .3)';
    words.forEach(b => {
      // this.ctxAuto.fillRect(b.$.HPOS * this.scale, b.$.VPOS * this.scale, b.$.WIDTH * this.scale, b.$.HEIGHT * this.scale);
      this.ctxAuto.fillRect(
        parseInt(b.attributes['HPOS']) * this.scale, 
        parseInt(b.attributes['VPOS']) * this.scale, 
        parseInt(b.attributes['WIDTH']) * this.scale, 
        parseInt(b.attributes['HEIGHT']) * this.scale);
    });

  }
  
 /*  zoom(scale: number) {
    this.imgW = this.imgW * scale;
    setTimeout(() => {
      this.getInfo();
    }, 1)
  }

  zoomReset() {
    
    this.imgW = 100;
    setTimeout(() => {
      this.getInfo();
    }, 10)
  } */

  @Output() test() {
    console.log('toto je test');
  }
}

