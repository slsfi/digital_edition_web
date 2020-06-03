import { Component, Input, Renderer, ElementRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { Events, ViewController } from 'ionic-angular';
import { LanguageService } from '../../app/services/languages/language.service';

/**
 * Class for the IntroductionComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'introduction',
  templateUrl: 'introduction.html'
})
export class IntroductionComponent {

  @Input() id: string;
  @Input() language: string;
  @Input() matches?: Array<string>;
  @Input() itemId: string;
  @Input() linkID?: string;

  public text: any;
  protected errorMessage: string;

  constructor(
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    private events: Events,
    private langService: LanguageService,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private viewctrl: ViewController,
  ) {
  }

  ngOnInit() {
    this.langService.getLanguage().subscribe(lang => {
      this.textService.getIntroduction(String(this.itemId).split('_')[0], lang).subscribe(
        res => {
            // in order to get id attributes for tooltips
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );
          },
        error =>  {this.errorMessage = <any>error}
      );
    });
    this.doAnalytics();
  }

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event: Event) => {
      try {
        const elem: HTMLElement = event.target as HTMLElement;
        const targetId = elem.getAttribute('href');
        const target = document.getElementById(targetId) as HTMLElement;
        if ( target !== null ) {
          this.scrollToElement(target, event);
        }
      } catch ( e ) {}
    });
  }

  private scrollToElement(element: HTMLElement, event: Event) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'center'});
    } catch ( e ) {
      console.error(e);
    }
  }

  doAnalytics() {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Introduction',
        eventLabel: 'Introduction',
        eventAction: String(this.itemId),
        eventValue: 10
      });
    } catch ( e ) {
    }
  }
}
