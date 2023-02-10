import { Component } from '@angular/core';

/**
 * Generated class for the MathJaxComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'math-jax',
  templateUrl: 'math-jax.html',
  styleUrls: ['math-jax.scss']
})
export class MathJaxComponent {

  text: string;

  constructor() {
    console.log('Hello MathJaxComponent Component');
    this.text = 'Hello World';
  }

}
