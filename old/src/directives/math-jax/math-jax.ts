import { Directive, ElementRef, Input } from '@angular/core';
declare var MathJax: {
  Hub: {
    Queue: (param: Object[]) => void
  }
}
@Directive({ selector: '[MathJax]' })
export class MathJaxDirective {
  @Input('MathJax') MathJaxInput: String = '';
  constructor(private el: ElementRef) {
  }
  ngOnChanges() {
    this.el.nativeElement.innerHTML = this.MathJaxInput;
    try {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.el.nativeElement]);
    } catch ( e ) {
    }
  }
}
