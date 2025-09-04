import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CallHistoryComponent } from '../call-history/call-history.component';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss'
})
export class LeftSidebarComponent {

  constructor(private dialog: MatDialog) {}

  showCallHistory() {
    this.dialog.open(CallHistoryComponent, {
      width: '600px',
      height: '500px',
      panelClass: 'call-history-dialog'
    });
  }

}
