import { AfterViewInit, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-call-popup-component',
  standalone: true,
  imports: [],
  templateUrl: './call-popup-component.component.html',
  styleUrl: './call-popup-component.component.scss'
})
export class CallPopupComponentComponent implements AfterViewInit {
  constructor(private dailogRef:MatDialogRef<CallPopupComponentComponent>,@Inject(MAT_DIALOG_DATA) public data: any) {
    console.log(data);

  }
 ngAfterViewInit(): void {
  const event: MouseEvent = this.data.event;
  if (event) {
    this.dailogRef.updatePosition({
      top: event.clientY + 33+ 'px', 
      left: event.clientX - 100 + 'px'
    });
  }
}


}
