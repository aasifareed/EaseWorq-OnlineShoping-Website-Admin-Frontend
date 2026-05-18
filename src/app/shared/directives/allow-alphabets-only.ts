import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[allowAlphabetsOnly]'
})
export class AllowAlphabetsOnlyDirective {
    constructor(private el: ElementRef) { }
    @HostListener('input', ['$event'])
    onInput(event: KeyboardEvent) {
        const initalValue = this.el.nativeElement.value;
        this.el.nativeElement.value = initalValue.replace(/[^A-Za-z]/gmi, '');

        if (initalValue !== this.el.nativeElement.value) {
            event.stopPropagation();
        }
    }
}
