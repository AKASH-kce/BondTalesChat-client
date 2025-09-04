import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface CallSettings {
  audioInput: string;
  audioOutput: string;
  videoInput: string;
  audioQuality: 'low' | 'medium' | 'high';
  videoQuality: 'low' | 'medium' | 'high';
  enableNoiseSuppression: boolean;
  enableEchoCancellation: boolean;
  enableAutoGainControl: boolean;
  enableVideo: boolean;
  enableAudio: boolean;
  enableScreenShare: boolean;
  enableRecording: boolean;
  enableChat: boolean;
  enableNotifications: boolean;
  ringtone: string;
  notificationSound: string;
  autoAnswer: boolean;
  autoAnswerDelay: number;
  showCallDuration: boolean;
  showParticipantCount: boolean;
  enableCallHistory: boolean;
  maxCallDuration: number; // in minutes
}

@Component({
  selector: 'app-call-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-settings.component.html',
  styleUrls: ['./call-settings.component.scss']
})
export class CallSettingsComponent implements OnInit {
  settings: CallSettings = {
    audioInput: '',
    audioOutput: '',
    videoInput: '',
    audioQuality: 'high',
    videoQuality: 'high',
    enableNoiseSuppression: true,
    enableEchoCancellation: true,
    enableAutoGainControl: true,
    enableVideo: true,
    enableAudio: true,
    enableScreenShare: true,
    enableRecording: false,
    enableChat: true,
    enableNotifications: true,
    ringtone: 'default',
    notificationSound: 'default',
    autoAnswer: false,
    autoAnswerDelay: 3,
    showCallDuration: true,
    showParticipantCount: true,
    enableCallHistory: true,
    maxCallDuration: 0 // 0 = no limit
  };

  availableAudioInputs: MediaDeviceInfo[] = [];
  availableAudioOutputs: MediaDeviceInfo[] = [];
  availableVideoInputs: MediaDeviceInfo[] = [];
  availableRingtones: string[] = ['default', 'classic', 'modern', 'soft', 'loud'];
  availableNotificationSounds: string[] = ['default', 'chime', 'bell', 'beep', 'ding'];

  constructor() {}

  ngOnInit() {
    this.loadSettings();
    this.loadMediaDevices();
  }

  private loadSettings() {
    const saved = localStorage.getItem('callSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  private async loadMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      this.availableAudioInputs = devices.filter(device => device.kind === 'audioinput');
      this.availableAudioOutputs = devices.filter(device => device.kind === 'audiooutput');
      this.availableVideoInputs = devices.filter(device => device.kind === 'videoinput');

      // Set default devices if not already set
      if (!this.settings.audioInput && this.availableAudioInputs.length > 0) {
        this.settings.audioInput = this.availableAudioInputs[0].deviceId;
      }
      if (!this.settings.audioOutput && this.availableAudioOutputs.length > 0) {
        this.settings.audioOutput = this.availableAudioOutputs[0].deviceId;
      }
      if (!this.settings.videoInput && this.availableVideoInputs.length > 0) {
        this.settings.videoInput = this.availableVideoInputs[0].deviceId;
      }
    } catch (error) {
      console.error('Error loading media devices:', error);
    }
  }

  onSettingChange() {
    this.saveSettings();
  }

  private saveSettings() {
    localStorage.setItem('callSettings', JSON.stringify(this.settings));
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.settings = {
        audioInput: '',
        audioOutput: '',
        videoInput: '',
        audioQuality: 'high',
        videoQuality: 'high',
        enableNoiseSuppression: true,
        enableEchoCancellation: true,
        enableAutoGainControl: true,
        enableVideo: true,
        enableAudio: true,
        enableScreenShare: true,
        enableRecording: false,
        enableChat: true,
        enableNotifications: true,
        ringtone: 'default',
        notificationSound: 'default',
        autoAnswer: false,
        autoAnswerDelay: 3,
        showCallDuration: true,
        showParticipantCount: true,
        enableCallHistory: true,
        maxCallDuration: 0
      };
      this.saveSettings();
    }
  }

  testAudio() {
    // Implementation for testing audio
    console.log('Testing audio...');
  }

  testVideo() {
    // Implementation for testing video
    console.log('Testing video...');
  }

  testRingtone() {
    // Implementation for testing ringtone
    console.log('Testing ringtone...');
  }

  testNotificationSound() {
    // Implementation for testing notification sound
    console.log('Testing notification sound...');
  }

  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'call-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  importSettings(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          this.settings = { ...this.settings, ...importedSettings };
          this.saveSettings();
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }
}
