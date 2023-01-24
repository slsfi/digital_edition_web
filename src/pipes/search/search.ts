import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the SearchPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'search',
})
export class SearchPipe implements PipeTransform {
  transform(value: any, args?: any): any {

    if (!value) {return null};
    if (!args) {return value};

    args = args.toLowerCase();

    return value.filter(function(item: any) {
        return JSON.stringify(item).toLowerCase().includes(args);
    });
}
}
