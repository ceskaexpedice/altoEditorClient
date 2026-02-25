import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { AppConfiguration } from 'src/app/app-configuration';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Version } from 'src/app/shared/version';
import { AppState } from 'src/app/shared/app.state';
import { HighlightModule } from 'ngx-highlightjs';
import { js2xml, xml2js } from 'xml-js';
import { Utils } from 'src/app/shared/utils';
import { OcrEditorComponent } from 'src/app/components/ocr-editor/ocr-editor.component';
import { ViewerComponent } from 'src/app/components/viewer/viewer.component';
import { Storage } from 'src/app/shared/constants';
import { SimpleDialogData } from 'src/app/components/simple-dialog/simple-dialog';
import { SimpleDialogComponent } from 'src/app/components/simple-dialog/simple-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-revision-detail',
  standalone: true,
  imports: [CommonModule, AngularSplitModule, TranslateModule, RouterModule,
    MatDialogModule,
    OcrEditorComponent, ViewerComponent,
    MatIconModule, MatButtonModule, MatTableModule, MatTooltipModule, HighlightModule],
  templateUrl: './revision-detail.component.html',
  styleUrls: ['./revision-detail.component.scss']
})
export class RevisionDetailComponent {
  public version: string = '';
  public pid: string = '';
  public selectedVersion: Version;
  public altoObject: { pid: string, status: number, version: string };

  panel0Mode = 'ocr';
  panelMode = 'ocr';
  viewerWidth: number;
  hasChanges: boolean;

  displayedColumns: string[] = ['date', 'state', 'version', 'user', 'actions'];
  versions: Version[] = [];

  divZoom = 1;
  imgW = 100;

  hor_size = 50;
  top_left_size = 50;
  bottom_left_size = 50;

  previousPid: string;
  nextPid: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private config: AppConfiguration,
    private service: AppService,
    public state: AppState) { }

  ngOnInit() {
    this.hor_size = localStorage.getItem(Storage.REVIZE_SIZE_HOR) ?
      parseInt(localStorage.getItem(Storage.REVIZE_SIZE_HOR)) : 50;

    this.top_left_size = localStorage.getItem(Storage.REVIZE_SIZE_TOP_LEFT) ?
      parseInt(localStorage.getItem(Storage.REVIZE_SIZE_TOP_LEFT)) : 50;

    this.bottom_left_size = localStorage.getItem(Storage.REVIZE_SIZE_BOTTOM_LEFT) ?
      parseInt(localStorage.getItem(Storage.REVIZE_SIZE_BOTTOM_LEFT)) : 50;

    this.route.params.subscribe(params => {
      this.pid = params['pid'];
      this.getVersions();
      this.getAltoOrig();
      this.getSiblings();
    });
  }

  asDragEndHor(e: any) {
    localStorage.setItem(Storage.REVIZE_SIZE_HOR, String(e.sizes[0]));
  }

  asDragEndTop(e: any) {
    localStorage.setItem(Storage.REVIZE_SIZE_TOP_LEFT, String(e.sizes[0]));
  }

  asDragEndBottom(e: any) {
    localStorage.setItem(Storage.REVIZE_SIZE_BOTTOM_LEFT, String(e.sizes[0]));
    this.viewerWidth = e.sizes[0];
  }

  getVersions() {
    this.service.getVersions(this.pid, this.config.login, this.config.instance).subscribe((res: any) => {

      this.versions = res.data;
      // find the user's version
      const v = this.versions.find((version: Version) => version.userLogin === this.config.login);
      if (v) {
        this.getVersion(v);
      } else {
        const shouldContinue = this.processModel(this.versions[0]);
        if (shouldContinue) {
          this.getVersion(this.versions[0]);
        }
      }
    });
  }

  getSiblings() {
    this.previousPid = null;
    this.nextPid = null;
    this.service.getSiblings(this.pid, this.config.instance).subscribe((res: any) => {
      this.previousPid = res.previousPid;
      this.nextPid = res.nextPid;
    });
  }

  getAltoOrig() {
    this.service.getAltoOriginal(this.pid, this.config.login, this.config.instance).subscribe((res: any) => {
      // this.service.getAltoVersion(this.pid, 'ALTO.0', this.config.login, this.config.instance).subscribe((res: any) => {
      this.altoObject = res;
      this.state.alto0Xml = Utils.prettifyXml(res.data);
      this.state.alto0 = xml2js(this.state.alto0Xml);
      this.state.printSpace0 = this.state.setPrintSpace(this.state.alto0);
    });
  }

  getVersion(version: Version) {
    this.selectedVersion = version;
    this.state.currentObject = version;
    this.state.clearSelection();
    this.service.getAltoVersion(this.pid, this.selectedVersion.versionXml, this.config.login, this.config.instance).subscribe((res: any) => {
      // this.altoSelected = res.data;
      if (res.data) {
        this.state.altoXml = Utils.prettifyXml(res.data);
        this.state.alto = xml2js(this.state.altoXml);
        this.state.printSpace = this.state.setPrintSpace(this.state.alto);
      } else {
        this.service.showSnackBar(res.content, true)
      }
    });
  }

  processModel(res: any): boolean {

    // model: OTHER nebo PAGE
    // versionState: NEW, GENERATED, EDITED, ....

    const model = res.model;
    const versionState = res.versionState;
    if (model === 'PAGE') {
      // Pokud je model=PAGE, tak prosím normálně pokračuj tak, jako to již teď funguje.
      return true;
    } else if (model === 'OTHER' && versionState === 'NEW') {
      // Pokud je model=OTHER a zároveň versionState=NEW tak se musí zobrazit dialogové okno, že jde o více stránek, a jestli chce uživatel spustit hromadné generování stránek.
      this.multipleGeneration(res);
      return false;
    } else if (model === 'OTHER' && versionState === 'GENERATED') {
      // Pokud je model=OTHER a zároveň versionState=GENERATED tak se musí zobrazit dialogové okno, že jde o více stránek a jestli je chce uživatel nahrát do Krameria.
      this.multipleUpload(res);
      return false;
    } else if (model === 'OTHER' && versionState === 'UPLOADED') {
      // Pokud je model=OTHER a zároveň versionState=UPLOADED, tak jen zobrazit info, že stránky již byly nahrány do Krameria
      this.service.showSnackBar('Stránky již byly nahrány do Krameria');
      this.router.navigate(['/revision']);
      return false;
    } else {
      // Pokud je model=OTHER a zároveň versionState je jiný než NEW, GENERATED a UPLOADED, tak zobrazit info, že daný stav není pro více stránek podporovaný.
      this.service.showSnackBar('Editace není pro více stránek podporovaná', true);
      this.router.navigate(['/revision']);
      return false;
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


  gotoPrev() {
    this.router.navigate(['/revision', this.previousPid]);
  }

  gotoNext() {
    this.router.navigate(['/revision', this.nextPid]);
  }

  markAsMajorVersion() {
    //{"id":{{digitalObjectId}},"login":"inovatika"}
    const data = {
      pid: this.pid,
      id: this.selectedVersion.id,
      login: this.config.login
    }
    this.service.markAsMajorVersion(data).subscribe((res: any) => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar('desc.markSuccess');
        this.getVersions();
      }

    });
  }

  markForDeletion() {

    const data = {
      pid: this.pid,
      id: this.selectedVersion.id,
      login: this.config.login
    }
    this.service.markForDeletion(data).subscribe((res: any) => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar('desc.markSuccess');
        this.getVersions();
      }
    });

  }

  gotoObject() {
    this.state.currentObject = this.selectedVersion;
    this.router.navigate(['/', this.selectedVersion.pid, 'editing']);
  }

  uploadKramerius() {
    // {"id":{{digitalObjectId}},"login":"inovatika"}
    const data = {
      pid: this.pid,
      id: this.selectedVersion.id,
      login: this.config.login
    }
    this.service.uploadKramerius(data).subscribe((res: any) => {
      console.log(res);

    });
  }

  setArea(data: { blockIdx: number, lineIdx: number, wordIdx: number }) {
    // const b = this.state.selectedBlocks[0];
    this.state.clearSelection();
    this.state.selectedBlocks = [this.state.printSpace.elements[data.blockIdx]];
    this.state.selectedLines = [this.state.selectedBlocks[0].elements[data.lineIdx]];
    this.state.selectedWords = [this.state.selectedBlocks[0].elements[data.lineIdx].elements[data.wordIdx]];
    this.state.selectedAlto = { blocks: this.state.selectedBlocks, lines: this.state.selectedLines, words: this.state.selectedWords };
  }

  splitChanged(e: any) {
    this.viewerWidth = e.sizes[0];
    // console.log(getVisibleAreaSizes())
  }

  ocrChanged(changed: boolean) {
    this.hasChanges = changed;
  }

  save() {

    const xml = js2xml(this.state.alto);
    const data = {
      pid: this.pid,
      login: this.config.login,
      instance: this.config.instance,
      data: xml
    }
    this.service.saveAlto(data).subscribe(res => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar('desc.savedSuccess');
        this.state.clearSelection();
        this.state.altoXml = Utils.prettifyXml(res.data);
        this.state.alto = xml2js(this.state.altoXml);
        this.state.printSpace = this.state.setPrintSpace(this.state.alto);

        this.getVersions();
      }
    })
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
