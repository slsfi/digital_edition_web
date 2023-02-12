import { Component, Input, ElementRef, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { TextService } from 'src/app/services/texts/text.service';

/**
 * Class for the IntroductionComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'introduction',
  templateUrl: 'introduction.html',
  styleUrls: ['introduction.scss'],
})
export class IntroductionComponent {

  @Input() id?: string;
  @Input() language?: string;
  @Input() matches?: Array<string>;
  @Input() itemId?: string;
  @Input() linkID?: string;

  public text: any;
  protected errorMessage?: string;
  textLoading: Boolean = true;

  constructor(
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    private events: EventsService,
    private langService: LanguageService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private analyticsService: AnalyticsService
  ) {
  }

  ngOnInit() {
    this.langService.getLanguage().subscribe(lang => {
      this.textService.getIntroduction(String(this.itemId).split('_')[0], lang).subscribe(
        res => {
            this.textLoading = false;
            // in order to get id attributes for tooltips
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );
          },
        error =>  {this.errorMessage = <any>error; this.textLoading = false; }
      );
    });
    this.doAnalytics();
  }

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event: Event) => {
      try {
        const elem: HTMLElement = event.target as HTMLElement;
        const targetId = elem.getAttribute('href');
        if (targetId !== null) {
          const target = document.getElementById(targetId) as HTMLElement;
          if ( target !== null ) {
            this.scrollToElement(target, event);
          }
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
    this.analyticsService.doAnalyticsEvent('Introduction', 'Introduction', String(this.itemId));
  }
}
