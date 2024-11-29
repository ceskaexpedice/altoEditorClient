import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppConfiguration } from 'src/app/app-configuration';
import { AppService } from 'src/app/app.service';
import { MatSortModule } from '@angular/material/sort';
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

@Component({
  selector: 'app-revision',
  standalone: true,
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'cs'},
    {provide: MatPaginatorIntl, useClass: PaginatorI18n}
  ],
  imports: [CommonModule, TranslateModule, RouterModule, MatSortModule, FormsModule, ReactiveFormsModule,
    AngularSplitModule, MatIconModule, MatButtonModule, MatTableModule, MatFormFieldModule,
    MatSelectModule, MatInputModule,
    MatTooltipModule, MatPaginatorModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './revision.component.html',
  styleUrls: ['./revision.component.scss']
})
export class RevisionComponent {
  displayedColumns: string[] = ['label', 'datum', 'state', 'pid', 'userLogin', 'actions'];
  filterColumns: string[] = [];


  pidFilter: string;
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
  orderSort: string = 'asc';
  totalRows: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private router: Router,
    private route: ActivatedRoute,
    private config: AppConfiguration,
    private service: AppService) { }

  ngOnInit() {
    this._locale = 'cs';
    this._adapter.setLocale(this._locale);
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

  onSortChange(e: any) {
    console.log(e);
    this.sortBy = e.active ? e.active : 'datum';
    this.orderSort = e.direction ? e.direction : 'asc';
    this.getDOs();
  }

  navigate(pid: string) {
    this.router.navigate([pid], { relativeTo: this.route });
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

}
