import { AfterViewInit, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-call-popup-component',
  standalone: true,
  imports: [DragDropModule],
  templateUrl: './call-popup-component.component.html',
  styleUrl: './call-popup-component.component.scss'
})
export class CallPopupComponentComponent implements AfterViewInit {
  constructor(private dailogRef: MatDialogRef<CallPopupComponentComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    console.log(data);

  }
  ngAfterViewInit(): void {
    const event: MouseEvent = this.data.event;
    if (event) {
      this.dailogRef.updatePosition({
        top: event.clientY + 33 + 'px',
        left: event.clientX - 100 + 'px'
      });
    }
    
    // Add debugging for dialog state changes
    console.log('Call popup component initialized');
    console.log('Dialog ref state:', this.dailogRef.getState());
    
    // Listen for dialog close events
    this.dailogRef.beforeClosed().subscribe((result) => {
      console.log('Dialog is about to close with result:', result);
    });
  }

  closeDialog(action: 'audioCall' | 'videoCall'): void {
    console.log('Call selection popup closing with action:', action);
    console.log('Dialog ref:', this.dailogRef);
    console.log('Dialog ref state:', this.dailogRef.getState());
    
    // Ensure we have a valid action before closing
    if (action && (action === 'audioCall' || action === 'videoCall')) {
      console.log('Closing dialog with valid action:', action);
      this.dailogRef.close({ action });
    } else {
      console.error('Invalid action provided to closeDialog:', action);
      this.dailogRef.close({ action: 'cancelled' });
    }
  }

  onButtonClick(action: 'audioCall' | 'videoCall', event: Event): void {
    console.log('Button clicked:', action, event);
    console.log('Event target:', event.target);
    console.log('Event currentTarget:', event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
    
    // Add a small delay to ensure the click is processed
    setTimeout(() => {
      this.closeDialog(action);
    }, 10);
  }

  // Test method to verify dialog closing works
  testCloseDialog(): void {
    console.log('Testing dialog close...');
    this.closeDialog('audioCall');
  }

  onMouseDown(action: 'audioCall' | 'videoCall', event: Event): void {
    console.log('Mouse down on button:', action, event);
  }

  onMouseUp(action: 'audioCall' | 'videoCall', event: Event): void {
    console.log('Mouse up on button:', action, event);
  }

}
