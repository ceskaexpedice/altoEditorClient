import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  selector: 'app-delete-multiple-dialog',
  templateUrl: './delete-multiple-dialog.component.html',
  styleUrls: ['./delete-multiple-dialog.component.scss'],
  imports: [
    TranslateModule, MatDialogModule,
    CdkDrag, CdkDragHandle, MatIconModule, MatInputModule,
    MatButtonModule, MatTooltipModule, MatCardModule, FormsModule,
    MatFormFieldModule
  ],
})
export class DeleteMultipleDialogComponent {

  pids: string;

  constructor(
    public dialogRef: MatDialogRef<DeleteMultipleDialogComponent>) { }

    close() {
      this.dialogRef.close({
        pids: this.pids.split('\n')
      })
    }

}
