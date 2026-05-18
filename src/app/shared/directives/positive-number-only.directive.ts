import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[positiveNumberOnly]'
})
export class PositiveNumberOnlyDirective {

  constructor(private el: ElementRef) { }
  
  @HostListener('input', ['$event'])
  onInput(event: KeyboardEvent) {
    const initalValue = this.el.nativeElement.value;
   
    this.el.nativeElement.value = initalValue.replace(/[^0-9]*/g, '');
    if ( initalValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
