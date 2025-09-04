import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appVideoSrc]',
  standalone: true
})
export class VideoSrcDirective implements OnChanges {
  @Input('appVideoSrc') stream: MediaStream | null = null;

  constructor(private el: ElementRef<HTMLVideoElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stream']) {
      const video = this.el.nativeElement as HTMLVideoElement;
      try {
        // Assign stream to srcObject for reliable rendering
        (video as any).srcObject = this.stream || null;
        if (this.stream) {
          video.play().catch(() => {});
        }
      } catch {
        // Minimal fallback: clear src if no stream
        if (!this.stream) {
          video.removeAttribute('src');
        }
      }
    }
  }
}


