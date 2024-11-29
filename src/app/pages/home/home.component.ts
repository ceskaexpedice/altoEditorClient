import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { AppConfiguration } from 'src/app/app-configuration';
import { AppService } from 'src/app/app.service';
import { DigitalObject } from 'src/app/shared/digital-object';
import { AppState } from 'src/app/shared/app.state';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { HttpParams } from '@angular/common/http';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { PaginatorI18n } from 'src/app/shared/paginator-i18n';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DO_STATES } from 'src/app/shared/constants';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-home',
  standalone: true,providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'cs'},
    {provide: MatPaginatorIntl, useClass: PaginatorI18n}
  ],
  imports: [CommonModule, TranslateModule, RouterModule, MatSortModule,
    FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule,
    AngularSplitModule, MatIconModule, MatButtonModule, MatTableModule, MatTooltipModule, 
    MatPaginatorModule, MatDatepickerModule, MatNativeDateModule, MatInputModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {


  displayedColumns: string[] = ['label', 'datum', 'state', 'pid', 'actions'];
  filterColumns: string[] = [];

  pid: string;
  digitalObjects: DigitalObject[] = [];
  sortBy: string = 'datum';
  orderSort: string = 'asc';
  totalRows: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;
  
  filters: { field: string, value: string }[] = [];
  pidFilter: string;
  labelFilter: string;
  states: string[] = [];
  stateFilter: string = '';
  datum = new FormControl();
  
  constructor(
    private _adapter: DateAdapter<any>,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private route: ActivatedRoute,
    private router: Router,
    private config: AppConfiguration,
    private service: AppService,
    public state: AppState) { }

  ngOnInit() {
    this._locale = 'cs';
    this._adapter.setLocale(this._locale);
    this.displayedColumns.forEach(c => {
      this.filterColumns.push(c + '-filter');
    });

    this.states = Object.values(DO_STATES);

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
      this.digitalObjects = res.data;
      this.totalRows = res.totalRows;
    });
  }

  gotoToObject(o: DigitalObject) {
    this.state.currentObject = o;
    this.router.navigate(['/', o.pid, 'editing']);
  }

  onSortChange(e: any) {
    console.log(e);
    this.sortBy = e.active ?  e.active : 'datum';
    this.orderSort = e.direction ? e.direction : 'asc';
    this.getDOs();
  }

  onPageChanged(e: any) {
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.getDOs();
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

}
