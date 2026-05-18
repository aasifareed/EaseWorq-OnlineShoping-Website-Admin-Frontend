import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toFixed',
  pure: false
})
export class ToFixedPipe implements PipeTransform {
  transform(value: any, digits: number = 2): string {
    
    let changeValue = (+value).toFixed(digits);
    return changeValue;
    //return value.toFixed(digits);
  }
}