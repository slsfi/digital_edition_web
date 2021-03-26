import { NgModule } from '@angular/core';
import { MathJaxDirective } from '../../directives/math-jax/math-jax';

@NgModule({
  declarations: [MathJaxDirective],
  exports: [MathJaxDirective]
})
export class MathJaxModule {}
