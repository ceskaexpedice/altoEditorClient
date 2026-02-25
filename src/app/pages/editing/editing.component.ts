import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from "angular-split";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { ViewerComponent } from 'src/app/components/viewer/viewer.component';
import { AppService } from 'src/app/app.service';
import { ActivatedRoute } from '@angular/router';
import { AppConfiguration } from 'src/app/app-configuration';
import { FormsModule } from '@angular/forms';
import { AppState } from 'src/app/shared/app.state';
import { XmlJsElement } from 'src/app/shared/xml-js-element';

import { js2xml, xml2js } from 'xml-js';
import { OcrEditorComponent } from 'src/app/components/ocr-editor/ocr-editor.component';
import { BATCH_PRIORITIES } from 'src/app/shared/constants';
import { HighlightModule } from 'ngx-highlightjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NoperoDialogComponent } from 'src/app/components/nopero-dialog/nopero-dialog.component';
import { SimpleDialogData } from 'src/app/components/simple-dialog/simple-dialog';
import { SimpleDialogComponent } from 'src/app/components/simple-dialog/simple-dialog.component';

@Component({
  selector: 'app-editing',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSplitModule, MatMenuModule, HighlightModule,
    MatTooltipModule, MatDialogModule,
    MatIconModule, MatButtonModule, TranslateModule, ViewerComponent, OcrEditorComponent],
  templateUrl: './editing.component.html',
  styleUrls: ['./editing.component.scss']
})
export class EditingComponent implements OnInit {

  @ViewChild('scroller') scroller: ElementRef;

  currentPage: number;
  viewerWidth: number;

  selection: DOMRect;
  selectedText: string;

  pid: string;

  priorities: string[];

  panelMode = 'ocr';
  divZoom = 1;
  imgW = 100;
  hasChanges: boolean;


  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private config: AppConfiguration,
    private service: AppService,
    public state: AppState) { }

  ngOnInit() {
    this.priorities = Object.values(BATCH_PRIORITIES);
    this.route.paramMap.subscribe((params: any) => {
      this.pid = params.get('pid');
      if (!this.state.currentObject) {
        this.getDO();
      } else {
        this.getAlto();
      }
    });
  }

  getDO() {
    this.service.getDigitalObject(this.pid, this.config.login).subscribe((res: any) => {
      this.state.currentObject = res.data[0];
      this.getAlto();
    });
  }

  getAlto(keepSelection: boolean = false) {
    if (this.state.currentObject && this.state.currentObject.versionXml) {
      this.service.getAltoVersion(this.pid, this.state.currentObject.versionXml, this.config.login, this.state.currentObject.instance).subscribe((res: any) => {
        this.processAlto(res)
      });
    } else {
      const instance = this.route.snapshot.queryParams['instance'] ? this.route.snapshot.queryParams['instance'] : this.config.instance;
      this.service.getAlto(this.pid, this.config.login, instance).subscribe((res: any) => {
        this.processAlto(res)
      });
    }
  }

  processAlto(res: any) {

    // model: OTHER nebo PAGE
    // versionState: NEW, GENERATED, EDITED, ....

    const model = res.model;
    const versionState = res.versionState;
    if (model === 'PAGE') {
      // Pokud je model=PAGE, tak prosím normálně pokračuj tak, jako to již teď funguje.
      this.parseXML(res.data);
    } else if (model === 'OTHER' && versionState === 'NEW') {
      // Pokud je model=OTHER a zároveň versionState=NEW tak se musí zobrazit dialogové okno, že jde o více stránek, a jestli chce uživatel spustit hromadné generování stránek.
      this.multipleGeneration(res);
    } else if (model === 'OTHER' && versionState === 'GENERATED') {
      // Pokud je model=OTHER a zároveň versionState=GENERATED tak se musí zobrazit dialogové okno, že jde o více stránek a jestli je chce uživatel nahrát do Krameria.
      this.multipleUpload(res);
    } else if (model === 'OTHER' && versionState === 'UPLOADED') {
      // Pokud je model=OTHER a zároveň versionState=UPLOADED, tak jen zobrazit info, že stránky již byly nahrány do Krameria
      this.service.showSnackBar('Stránky již byly nahrány do Krameria');
    } else {
      // Pokud je model=OTHER a zároveň versionState je jiný než NEW, GENERATED a UPLOADED, tak zobrazit info, že daný stav není pro více stránek podporovaný.
      this.service.showSnackBar('Daný stav není pro více stránek podporovaný', true);
    }

  }

  multipleGeneration(res: any) {
// Pokud je model=OTHER a zároveň versionState=NEW tak se musí zobrazit dialogové okno, že jde o více stránek, a jestli chce uživatel spustit hromadné generování stránek.

    const data: SimpleDialogData = {
      title: 'Hromadné generování stránek',
      message: 'Opravdu chcete spustit hromadné generování stránek?',
      alertClass: 'app-message',
      btn1: {
        label: 'Ano',
        value: 'yes',
        color: 'warn'
      },
      btn2: {
        label: 'Ne',
        value: 'no',
        color: 'default'
      }
    };
    const dialogRef = this.dialog.open(SimpleDialogComponent, {
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const instance = this.route.snapshot.queryParams['instance'] ? this.route.snapshot.queryParams['instance'] : this.config.instance;
        this.generatePERO(this.pid, 'MEDIUM', instance);
      }
    });

  }

  multipleUpload(res: any) {
      // Pokud je model=OTHER a zároveň versionState=GENERATED tak se musí zobrazit dialogové okno, že jde o více stránek a jestli je chce uživatel nahrát do Krameria.

    const data: SimpleDialogData = {
      title: 'Hromadné nahrání do Krameria',
      message: 'Záznam má více stránek. Opravdu chcete nahrát do Krameria?',
      alertClass: 'app-message',
      btn1: {
        label: 'Ano',
        value: 'yes',
        color: 'warn'
      },
      btn2: {
        label: 'Ne',
        value: 'no',
        color: 'default'
      }
    };
    const dialogRef = this.dialog.open(SimpleDialogComponent, {
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const data = {
          pid: this.pid,
          id: this.state.currentObject.id,
          login: this.config.login
        }
        this.service.uploadKramerius(data).subscribe((res: any) => {
          if (res.errors) {
            this.service.showSnackBar(res.errors[0], true);
          } else {
            this.service.showSnackBar(res.content);
          }
          
        });


      }
    });

  }

  private parseXML(altoXml: string) {
    this.state.altoXml = altoXml;
    this.state.alto = xml2js(altoXml);
    this.state.printSpace = this.state.setPrintSpace(this.state.alto);
    if (!this.state.currentObject) {
      const desc = this.state.getAltoDescription(this.state.alto);
      const processingDateTime = desc.elements.find((e: XmlJsElement) => e.name === 'processingDateTime');
      const processingSoftware = desc.elements.find((e: XmlJsElement) => e.name === 'processingSoftware');
      const info = {
        processingDateTime: processingDateTime ? processingDateTime.elements[0].text : null,
        processingSoftware: processingSoftware.elements
      }
      this.openNoPERO(info);
    }
    //this.addIdx();
  }

  openNoPERO(info: any) {

    const dialogRef = this.dialog.open(NoperoDialogComponent, {
      width: '700px',
      data: { info: info, priorities: this.priorities }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.generatePERO(this.pid, result.priority, this.state.currentObject?.instance);
      }
    });
  }

  /**
 * Add id to all alto elements
 */
  addIdx() {

    this.state.printSpace.elements.forEach((tb: XmlJsElement) => {
      tb.elements.forEach((line: XmlJsElement, idx: number) => {
        line.idx = idx;
        line.elements.forEach((word: XmlJsElement, widx: number) => {
          word.idx = widx;
          word.attributes['POSID'] = word.attributes['HPOS'] + '-' + word.attributes['VPOS']
        });
      });
    });

  }

  setSelectedArea(t: any) {
    this.selection = t;
    // console.log(this.alto)
    const tBlocks: XmlJsElement[] = this.state.printSpace.elements;

    this.state.clearSelection();

    this.state.selectedBlocks = tBlocks.filter((tb: XmlJsElement) => {
      return this.intersectRect(this.selection, DOMRect.fromRect({
        x: parseInt(tb.attributes['HPOS']),
        y: parseInt(tb.attributes['VPOS']),
        width: parseInt(tb.attributes['WIDTH']),
        height: parseInt(tb.attributes['HEIGHT'])
      }))
    })

    this.state.selectedBlocks.forEach((tb: XmlJsElement) => {
      const tlines = tb.elements;
      if (tlines) {
        tlines.forEach((line: XmlJsElement, idx: number) => {
          //line.idx = idx;
          if (this.intersectRect(this.selection, DOMRect.fromRect({
            x: parseInt(line.attributes['HPOS']),
            y: parseInt(line.attributes['VPOS']),
            width: parseInt(line.attributes['WIDTH']),
            height: parseInt(line.attributes['HEIGHT'])
          }))) {
            //console.log(idx);
            this.state.selectedLines.push(line);
            line.elements.forEach((word: XmlJsElement, widx: number) => {
              //word.idx = widx;
              if (this.intersectRect(this.selection, DOMRect.fromRect({
                x: parseInt(word.attributes['HPOS']),
                y: parseInt(word.attributes['VPOS']),
                width: parseInt(word.attributes['WIDTH']),
                height: parseInt(word.attributes['HEIGHT'])
                // x: word.$.HPOS, y: word.$.VPOS, width: word.$.WIDTH, height: word.$.HEIGHT 
              }))) {
                //console.log(idx);
                this.state.selectedWords.push(word);
              }
            });
          }
        });
      }

    });

    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };

  }

  intersectRect(r1: DOMRect, r2: DOMRect) {
    return !(r2.left >= r1.right ||
      r2.right <= r1.left ||
      r2.top >= r1.bottom ||
      r2.bottom <= r1.top);
  }

  setArea(data: { blockIdx: number, lineIdx: number, wordIdx: number }) {
    // const b = this.state.selectedBlocks[0];
    this.state.clearSelection();
    this.state.selectedBlocks = [this.state.printSpace.elements[data.blockIdx]];
    this.state.selectedLines = [this.state.selectedBlocks[0].elements[data.lineIdx]];
    this.state.selectedWords = [this.state.selectedBlocks[0].elements[data.lineIdx].elements[data.wordIdx]];
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };
  }

  ocrChanged(changed: boolean) {
    this.hasChanges = changed;
  }

  save() {
    // const builder = new Builder({'rootName' :'alto' });
    // const xml = builder.buildObject(this.alto);

    const xml = js2xml(this.state.alto);
    const instance = this.route.snapshot.queryParams['instance'] ? this.route.snapshot.queryParams['instance'] : this.config.instance;
    const data = {
      pid: this.pid,
      login: this.config.login,
      instance: instance,
      data: xml
    }
    this.service.saveAlto(data).subscribe(res => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar('desc.savedSuccess');
      }

    })

  }

  onGeneratePERO(priority: string) {
     this.generatePERO(this.pid, priority, this.state.currentObject?.instance);
  }

  generatePERO(pid: string, priority: string, instance: string) {
    //{"pid":"{{uuidStrana}}","priority":"LOW", "instance":"k7"}

    const data = {
      pid: pid,
      priority: priority,
      instance: instance
    }
    this.service.generatePERO(data).subscribe(res => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar(res.content ? res.content : 'desc.PEROExists');
      }
    })
  }


  splitChanged(e: any) {
    this.viewerWidth = e.sizes[0];
  }



  zoom(scale: number) {
    this.divZoom = this.divZoom * scale;
    this.viewerWidth = this.viewerWidth * scale;
  }

  zoomReset() {
    this.divZoom = 1;
  }

  zoomImg(scale: number) {
    this.imgW = this.imgW * scale;
  }

  zoomImgReset() {
    this.imgW = 100;
  }

}
