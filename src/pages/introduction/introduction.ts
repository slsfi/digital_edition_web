import { Component, Renderer, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

/**
 * Generated class for the IntroductionPage page.
 *
 * Collection introduction.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'introduction',
  segment: 'publication/:collectionID/introduction/'
})
@Component({
  selector: 'page-introduction',
  templateUrl: 'introduction.html',
})
export class IntroductionPage {

  errorMessage: any;
  protected id: string;
  protected text: any;
  protected collection: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected params: NavParams,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private userSettingsService: UserSettingsService,
    private events: Events
  ) {
    this.id = this.params.get('collectionID');
    this.collection = this.params.get('collection');
  }

  ionViewDidLoad() {
    this.langService.getLanguage().subscribe(lang => {
      this.textService.getIntroduction(this.id, lang).subscribe(
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
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
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
      console.log(e);
    }
  }

}
