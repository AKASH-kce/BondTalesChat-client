import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MobileNavigationState {
  showLeftSidebar: boolean;
  showUserList: boolean;
  showChatView: boolean;
  showMobileOverlay: boolean;
  isMobile: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MobileNavigationService {
  private navigationState = new BehaviorSubject<MobileNavigationState>({
    showLeftSidebar: false,
    showUserList: false,
    showChatView: true,
    showMobileOverlay: false,
    isMobile: false
  });

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  getNavigationState(): Observable<MobileNavigationState> {
    return this.navigationState.asObservable();
  }

  getCurrentState(): MobileNavigationState {
    return this.navigationState.value;
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth <= 768;
    const currentState = this.navigationState.value;
    
    if (currentState.isMobile !== isMobile) {
      this.updateState({
        ...currentState,
        isMobile,
        // Reset mobile states when switching between mobile/desktop
        showLeftSidebar: false,
        showUserList: isMobile, // Default to showing user list on mobile
        showChatView: !isMobile, // Default to showing chat on desktop
        showMobileOverlay: false
      });
    }
  }

  toggleLeftSidebar(): void {
    const currentState = this.navigationState.value;
    if (!currentState.isMobile) return;

    this.updateState({
      ...currentState,
      showLeftSidebar: !currentState.showLeftSidebar,
      showMobileOverlay: !currentState.showLeftSidebar,
      showUserList: false,
      showChatView: false
    });
  }

  toggleUserList(): void {
    const currentState = this.navigationState.value;
    if (!currentState.isMobile) return;

    this.updateState({
      ...currentState,
      showUserList: !currentState.showUserList,
      showMobileOverlay: !currentState.showUserList,
      showLeftSidebar: false,
      showChatView: false
    });
  }

  toggleChatView(): void {
    const currentState = this.navigationState.value;
    if (!currentState.isMobile) return;

    this.updateState({
      ...currentState,
      showChatView: !currentState.showChatView,
      showMobileOverlay: !currentState.showChatView,
      showLeftSidebar: false,
      showUserList: false
    });
  }

  closeAllMobileViews(): void {
    const currentState = this.navigationState.value;
    this.updateState({
      ...currentState,
      showLeftSidebar: false,
      showUserList: false,
      showChatView: false,
      showMobileOverlay: false
    });
  }

  onConversationSelected(): void {
    const currentState = this.navigationState.value;
    if (!currentState.isMobile) return;

    this.updateState({
      ...currentState,
      showChatView: true,
      showUserList: false,
      showLeftSidebar: false,
      showMobileOverlay: false
    });
  }

  private updateState(newState: MobileNavigationState): void {
    this.navigationState.next(newState);
  }
}
