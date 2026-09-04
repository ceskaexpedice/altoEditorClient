import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppConfiguration } from 'src/app/app-configuration';
import { AppService } from 'src/app/app.service';
import { Batch } from 'src/app/shared/batch';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { HttpParams } from '@angular/common/http';
import { BATCH_PRIORITIES, BATCH_STATES, DO_STATES } from 'src/app/shared/constants';
import { PaginatorI18n } from 'src/app/shared/paginator-i18n';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SimpleDialogData } from 'src/app/components/simple-dialog/simple-dialog';
import { SimpleDialogComponent } from 'src/app/components/simple-dialog/simple-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();

@Component({
  selector: 'app-process-management',
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'cs'},
    {provide: MatPaginatorIntl, useClass: PaginatorI18n}
  ],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatDialogModule,
    MatIconModule, TranslateModule, MatTableModule, MatTooltipModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatCheckboxModule],
  templateUrl: './process-management.component.html',
  styleUrls: ['./process-management.component.scss']
})

export class ProcessManagementComponent implements OnDestroy {
  private readonly refreshIntervalMs = 5000;
  private refreshTimer?: ReturnType<typeof setInterval>;

  displayedColumns: string[] = ['select', 'id', 'pid', 'createDate', 'updateDate', 'state', 'subState', 'priority', 'type', 'instance'];
  filterColumns: string[] = [];

  batches: Batch[] = [];
  selection = new SelectionModel<Batch>(true, []);
  // actionInProgress = false;
  sortBy: string = 'updateDate';
  orderSort: string = 'desc';
  totalRows: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  pidFilter: string;
  states: string[] = [];
  stateFilter: string = '';
  priorities: string[] = [];
  priorityFilter: string = '';

  filters: {field: string, value: string}[] = [];

  createDate = new FormControl();
  updateDate = new FormControl();

  selectedItem: Batch;
  startShiftClickIdx: number;
  lastClickIdx: number;
  totalSelected: number = 0;
  autoRefresh = false;

  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private translator: TranslateService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private config: AppConfiguration,
    private service: AppService) { }

  ngOnInit() {
    this._locale = 'cs';
    this._adapter.setLocale(this._locale);
    this.states = Object.values(BATCH_STATES);
    this.priorities = Object.values(BATCH_PRIORITIES);

    this.getBatches();
    this.displayedColumns.forEach(c => {
      this.filterColumns.push(c + '-filter');
    });
  }

  ngOnDestroy(): void {
    this.clearRefreshTimer();
  }

  setRefresh(): void {
    this.clearRefreshTimer();
    if (this.autoRefresh) {
      this.getBatches();
      this.refreshTimer = setInterval(() => this.getBatches(), this.refreshIntervalMs);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== undefined) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  getBatches() {

    const start = this.pageIndex * this.pageSize;
    let params: HttpParams = new HttpParams()
      .set('offset', start)
      .set('limit', this.pageSize)
      .set('orderBy', this.sortBy)
      .set('orderSort', this.orderSort);
    this.filters.forEach(f => {
      if (f.value !== '') {
        params = params.set(f.field, f.value);
      }
    });
    this.service.getBatches(params).subscribe((res: any) => {
      this.batches = res.data;
      this.totalRows = res.totalRows;
      this.selection.clear();
      this.updateSelectedCount();
    });
  }

  isAllSelected(): boolean {
    return this.batches.length > 0 && this.selection.selected.length === this.batches.length;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.batches);
    }
    this.updateSelectedCount();
  }

  toggleRow(row: Batch): void {
    this.selection.toggle(row);
    this.updateSelectedCount();
  }

  canStopSelected(): boolean {
    return this.selection.selected.some(batch => batch.state === BATCH_STATES.BATCH_STATE_PLANNED
      || batch.state === BATCH_STATES.BATCH_STATE_RUNNING);
  }

  canResumeSelected(): boolean {
    return this.selection.selected.some(batch => batch.state === BATCH_STATES.BATCH_STATE_FAILED
      || batch.state === BATCH_STATES.BATCH_STATE_STOPPED);
  }

  stopSelected(): void {
    const ids = this.selection.selected
      .filter(batch => batch.state === BATCH_STATES.BATCH_STATE_PLANNED
        || batch.state === BATCH_STATES.BATCH_STATE_RUNNING)
      .map(batch => batch.id);
    this.runBatchAction(this.service.stopBatches(ids), 'process.stopSuccess');
  }

  resumeSelected(): void {
    const ids = this.selection.selected
      .filter(batch => batch.state === BATCH_STATES.BATCH_STATE_FAILED
        || batch.state === BATCH_STATES.BATCH_STATE_STOPPED)
      .map(batch => batch.id);
    this.runBatchAction(this.service.resumeBatches(ids), 'process.resumeSuccess');
  }

  private runBatchAction(request: any, successMessage: string): void {
    // this.actionInProgress = true;
    request.subscribe({
      next: (res: any) => {
        // this.actionInProgress = false;
        if (res.errors?.length) {
          this.service.showSnackBar(res.errors[0], true);
          return;
        }
        this.service.showSnackBar(successMessage);
        this.getBatches();
      },
      error: (error: any) => {
        // this.actionInProgress = false;
        this.service.showSnackBar(error?.error?.errors?.[0] || error?.message || 'process.actionFailed', true);
      }
    });
  }

  onDeleteBatches() {

    const title = 'button.delete_selected_batches';
    const data: SimpleDialogData = {
      title: String(this.translator.instant(title)),
      message: String(this.translator.instant('Opravdu chcete smazat procesy?')),
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
        this.deleteBatches();
      }
    });

  }

  deleteBatches() {
    const params: any = {};
    params.id = this.selection.selected.map(batch => batch.id);
    this.service.deleteBatches(params).subscribe(res => {
          if (res.errors) {
            this.service.showSnackBar(res.errors[0], true);
          } else {
            this.service.showSnackBar('desc.savedSuccess');
          }
        });
  }

  onSortChange(e: any) {
    console.log(e);
    this.sortBy = e.active ?  e.active : 'updateDate';
    this.orderSort = e.direction ? e.direction : 'desc';
    this.getBatches();
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
      this.filters.push({field, value});
    }
    this.getBatches();
  }

  onPageChanged(e: any) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getBatches();
  }

  select(item: Batch, idx: number, event: MouseEvent) {
    if (event && (event.metaKey || event.ctrlKey)) {
      this.selection.toggle(item);
      this.startShiftClickIdx = idx;
    } else if (event && event.shiftKey) {
      if (this.startShiftClickIdx > -1) {
        const oldFrom = Math.min(this.startShiftClickIdx, this.lastClickIdx);
        const oldTo = Math.max(this.startShiftClickIdx, this.lastClickIdx);
        this.selection.deselect(...this.batches.slice(oldFrom, oldTo + 1));
        const from = Math.min(this.startShiftClickIdx, idx);
        const to = Math.max(this.startShiftClickIdx, idx);
        this.selection.select(...this.batches.slice(from, to + 1));
      } else {
        // nic neni.
        this.selection.clear();
        this.selection.select(item);
        this.startShiftClickIdx = idx;
      }
      window.getSelection().empty();
    } else {
      this.selection.clear();
      this.selection.select(item);
      this.startShiftClickIdx = idx;
    }

    this.lastClickIdx = idx;
    this.updateSelectedCount();
    this.selectedItem = item;
  }

  private updateSelectedCount(): void {
    this.totalSelected = this.selection.selected.length;
  }

}
