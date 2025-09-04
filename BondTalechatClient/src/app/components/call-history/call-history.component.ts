import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CallService, CallHistory } from '../../Services/call.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-call-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-history.component.html',
  styleUrls: ['./call-history.component.scss']
})
export class CallHistoryComponent implements OnInit, OnDestroy {
  callHistory: CallHistory[] = [];
  filteredHistory: CallHistory[] = [];
  selectedFilter: 'all' | 'missed' | 'completed' | 'declined' = 'all';
  searchTerm = '';
  
  private callHistorySubscription?: Subscription;

  constructor(private callService: CallService) {}

  ngOnInit() {
    this.subscribeToCallHistory();
  }

  ngOnDestroy() {
    this.callHistorySubscription?.unsubscribe();
  }

  private subscribeToCallHistory() {
    this.callHistorySubscription = this.callService.callHistory$.subscribe(history => {
      this.callHistory = history;
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = [...this.callHistory];

    // Apply status filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(call => call.status === this.selectedFilter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(call => 
        call.participantName.toLowerCase().includes(term) ||
        call.callType.toLowerCase().includes(term)
      );
    }

    this.filteredHistory = filtered;
  }

  onFilterChange(filter: 'all' | 'missed' | 'completed' | 'declined') {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear all call history?')) {
      // Implementation to clear history
      console.log('Clearing call history');
    }
  }

  formatCallDuration(seconds: number): string {
    return this.callService.formatCallDuration(seconds);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'fa-check-circle';
      case 'missed': return 'fa-phone-slash';
      case 'declined': return 'fa-times-circle';
      case 'failed': return 'fa-exclamation-circle';
      default: return 'fa-question-circle';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'missed': return '#ff9800';
      case 'declined': return '#f44336';
      case 'failed': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  }

  getCallTypeIcon(callType: string): string {
    return callType === 'video' ? 'fa-video' : 'fa-phone';
  }

  retryCall(call: CallHistory) {
    // Implementation to retry call
    console.log('Retrying call:', call);
  }

  deleteCall(call: CallHistory) {
    if (confirm('Are you sure you want to delete this call record?')) {
      // Implementation to delete call
      console.log('Deleting call:', call);
    }
  }
}
