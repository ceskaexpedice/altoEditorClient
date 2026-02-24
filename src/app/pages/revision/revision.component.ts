import { Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppConfiguration } from 'src/app/app-configuration';
import { AppService } from 'src/app/app.service';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpParams } from '@angular/common/http';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { DO_STATES } from 'src/app/shared/constants';
import { PaginatorI18n } from 'src/app/shared/paginator-i18n';
import { SimpleDialogData } from 'src/app/components/simple-dialog/simple-dialog';
import { SimpleDialogComponent } from 'src/app/components/simple-dialog/simple-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteMultipleDialogComponent } from 'src/app/components/delete-multiple-dialog/delete-multiple-dialog.component';
import { AppState } from 'src/app/shared/app.state';

@Component({
  selector: 'app-revision',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'cs' },
    { provide: MatPaginatorIntl, useClass: PaginatorI18n }
  ],
  imports: [CommonModule, TranslateModule, RouterModule, MatSortModule, FormsModule, ReactiveFormsModule,
    AngularSplitModule, MatIconModule, MatButtonModule, MatTableModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatDialogModule,
    MatTooltipModule, MatPaginatorModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './revision.component.html',
  styleUrls: ['./revision.component.scss']
})
export class RevisionComponent {
  displayedColumns: string[] = ['parentLabel', 'label', 'datum', 'state', 'pid', 'userLogin', 'actions'];
  filterColumns: string[] = [];
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  pidFilter: string;
  parentLabelFilter: string;
  labelFilter: string;
  states: string[] = [];
  stateFilter: string = '';
  priorities: string[] = [];
  priorityFilter: string = '';
  datum = new FormControl();
  users: { id: number, login: string }[] = [];
  userFilter: string = '';

  filters: { field: string, value: string }[] = [];

  pid: string;
  revisions: any[] = [];
  sortBy: string = 'datum';
  orderSort: string = 'desc';
  totalRows: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  selectedItem: any;
  startShiftClickIdx: number;
  lastClickIdx: number;
  totalSelected: number = 0;

  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private translator: TranslateService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private config: AppConfiguration,
    private state: AppState,
    private service: AppService) { }

  ngOnInit() {
    this._locale = 'cs';
    this._adapter.setLocale(this._locale);
    this.sort.sort(({ id: this.sortBy, start: this.orderSort }) as MatSortable);
    this.displayedColumns.forEach(c => {
      this.filterColumns.push(c + '-filter');
    });

    this.states = Object.values(DO_STATES);
    this.service.getUsers().subscribe((res: any) => {
      this.users = res.data
    });
    this.route.paramMap.subscribe((params: any) => {
      this.pid = params.get('pid');
      this.getDOs();
    });
  }

  getDOs() {

    const start = this.pageIndex * this.pageSize;
    let params: HttpParams = new HttpParams()
      .set('offset', start)
      .set('limit', this.pageSize)
      .set('orderBy', this.sortBy)
      .set('orderSort', this.orderSort)
      .set('instance', this.config.instance);
    this.filters.forEach(f => {
      if (f.value !== '') {
        params = params.set(f.field, f.value);
      }
    });

    this.service.getAllDigitalObjects(params).subscribe((res: any) => {
      // console.log(res)
      this.revisions = res.data;
      this.totalRows = res.totalRows;
    });
  }

  toggleLock() {
    this.service.toggleLock(this.selectedItem.pid, !this.selectedItem.lock).subscribe((res: any) => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar('desc.savedSuccess');
        this.getDOs();
      }
    });
  }

  onDeleteRevisions() {

    const title = 'button.delete_selected_revisions';
    const data: SimpleDialogData = {
      title: String(this.translator.instant(title)),
      message: String(this.translator.instant('Opravdu chcete smazat revize?')),
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
        this.deleteRevisions();
      }
    });

  }

  deleteRevisions() {
    const params: any = {};
    params.id = this.revisions.filter(b => b.selected).map(b => b.id);
    this.service.deleteObjects(params).subscribe(res => {
      if (res.errors) {
        this.service.showSnackBar(res.errors[0], true);
      } else {
        this.service.showSnackBar('desc.savedSuccess');
      }
    });
  }

  deleteDO() {

    const dialogRef = this.dialog.open(DeleteMultipleDialogComponent, {

    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const params: any = {};
        params.pid = result.pids;
        this.service.deleteObjects(params).subscribe(res => {
          if (res.errors) {
            this.service.showSnackBar(res.errors[0], true);
          } else {
            this.service.showSnackBar('desc.savedSuccess');
          }
        });
      }
    });

  }

  onSortChange(e: any) {
    this.sortBy = e.active ? e.active : 'datum';
    this.orderSort = e.direction ? e.direction : 'asc';
    this.getDOs();
  }

  navigate(o: any) {
    this.state.currentObject = o;
    this.router.navigate([o.pid], { relativeTo: this.route });
  }



  dateChanged(e: any, control: FormControl, field: string) {
    if (control.value) {
      const d: Date = control.value;
      d.setHours(10); // jinak dostaneme o den min kvuli GMT+1
      this.filter(field, d.toISOString().split('T')[0]);
    } else {
      this.filter(field, '');
    }

  }

  filter(field: string, value: string) {
    const f = this.filters.find(f => f.field === field);
    if (f) {
      f.value = value;
    } else {
      this.filters.push({ field, value });
    }
    this.getDOs();
  }


  onPageChanged(e: any) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getDOs();
  }

  select(item: any, idx: number, event: MouseEvent) {
    if (event && (event.metaKey || event.ctrlKey)) {
      item.selected = !item.selected;
      this.startShiftClickIdx = idx;
    } else if (event && event.shiftKey) {
      if (this.startShiftClickIdx > -1) {
        const oldFrom = Math.min(this.startShiftClickIdx, this.lastClickIdx);
        const oldTo = Math.max(this.startShiftClickIdx, this.lastClickIdx);
        for (let i = oldFrom; i <= oldTo; i++) {
          this.revisions[i].selected = false;
        }
        const from = Math.min(this.startShiftClickIdx, idx);
        const to = Math.max(this.startShiftClickIdx, idx);
        for (let i = from; i <= to; i++) {
          this.revisions[i].selected = true;
        }
      } else {
        // nic neni.
        this.revisions.forEach(i => i.selected = false);
        item.selected = true;
        this.startShiftClickIdx = idx;
      }
      window.getSelection().empty();
    } else {
      this.revisions.forEach(i => i.selected = false);
      item.selected = true;
      this.startShiftClickIdx = idx;
    }

    this.lastClickIdx = idx;
    this.totalSelected = this.revisions.filter(i => i.selected).length;
    this.selectedItem = item;
  }

}
