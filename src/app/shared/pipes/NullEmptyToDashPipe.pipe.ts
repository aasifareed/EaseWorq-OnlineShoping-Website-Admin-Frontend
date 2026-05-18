import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'nullEmptyToDash' })
export class NullEmptyToDashPipe implements PipeTransform {
  transform(value: any): any {
    return (value == null || value == undefined || value === ''|| value === ' ' || value === 'N/A') ? '--' : value;
  }
}
