import { Component } from '@angular/core';

/**
 * Generated class for the TableOfContentLetterFilterComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'table-of-content-letter-filter',
  templateUrl: 'table-of-content-letter-filter.html'
})
export class TableOfContentLetterFilterComponent {

  text: string;

  constructor() {
    console.log('Hello TableOfContentLetterFilterComponent Component');
    this.text = 'Hello World';
  }

}
