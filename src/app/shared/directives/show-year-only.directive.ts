import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appShowYearOnly]'
})
export class ShowYearOnlyDirective {

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    const year = new Date(value).getFullYear();
    const formattedDate = `${year}`;
    this.el.nativeElement.value = formattedDate;
  }

}
