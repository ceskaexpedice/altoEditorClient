import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppService } from 'src/app/app.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-nopero-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatDialogModule, MatTooltipModule,
    MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './nopero-dialog.component.html',
  styleUrls: ['./nopero-dialog.component.scss']
})
export class NoperoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NoperoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private service: AppService) { }

    generatePERO(p: string) {
      this.dialogRef.close(p)
    }
}
