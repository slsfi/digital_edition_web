import { Component } from '@angular/core';

/**
 * Generated class for the IllustrationsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'illustrations',
  templateUrl: 'illustrations.html'
})
export class IllustrationsComponent {

  text: string;

  constructor() {
    this.text = 'Hello World';
  }

}
