import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[positiveNumberNoZero]'
})
export class PositiveNumberNoZeroDirective {

  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event'])
  onInput(event: KeyboardEvent) {
    const initialValue: string = this.el.nativeElement.value;

    // sirf 1-9 digits allow kare, 0 ko hata de
    this.el.nativeElement.value = initialValue.replace(/[^1-9]*/g, '');

    if (initialValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
