import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { CallService } from './Services/call.service';
import { MatDialog } from '@angular/material/dialog';
import { VedioCallPopupComponentComponent } from './popupComponents/vedio-call-popup-component/vedio-call-popup-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'BondTalechatClient';
  constructor(private callService: CallService, private dialog: MatDialog) {}
  async ngOnInit() {
    try { await this.callService.connectCallHub(); } catch {}
    this.callService.incomingCall$.subscribe(payload => {
      console.log('Incoming call:', payload);
      if (!payload) return;
      const accept = confirm(`Incoming ${payload.callType} call from ${payload.participantName ?? payload.participantId}. Accept?`);
      if (!accept) {
        this.callService.declineCall(payload.callId);
        return;
      }
      this.dialog.open(VedioCallPopupComponentComponent, {
        data: payload,
        disableClose: true,
        panelClass: 'draggable-dialog'
      });
    });
  }
}
