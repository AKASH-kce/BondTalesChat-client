import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-vedio-call-popup-component',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './vedio-call-popup-component.component.html',
  styleUrls: ['./vedio-call-popup-component.component.scss']
})
export class VedioCallPopupComponentComponent {
  isMinimized = false;

  constructor(
    private dialogRef: MatDialogRef<VedioCallPopupComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number }
  ) {}

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  endCall() {
    this.dialogRef.close('ended');
  }
}
