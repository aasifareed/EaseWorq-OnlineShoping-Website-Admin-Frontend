import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[allowAlphanumericOnly]'
})
export class AllowAlphanumericOnlyDirective {

  constructor(private el: ElementRef) { }
  @HostListener('input', ['$event'])
  onInput(event: KeyboardEvent) {
    const initalValue = this.el.nativeElement.value;
   
    this.el.nativeElement.value = initalValue.replace(/[^a-z0-9 _]/gmi, '');
    if ( initalValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
