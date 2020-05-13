import { Component, Renderer, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, Platform } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';

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
  segment: 'publication-introduction/:collectionID/'
})
@Component({
  selector: 'page-introduction',
  templateUrl: 'introduction.html',
})
export class IntroductionPage {

  errorMessage: any;
  protected id: string;
  protected text: any;
  protected textMenu: any;
  protected collection: any;
  public tocMenuOpen: boolean;
  public hasSeparateIntroToc: boolean;

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
    private events: Events,
    private platform: Platform,
    private config: ConfigService
  ) {
    this.id = this.params.get('collectionID');
    this.collection = this.params.get('collection');
    this.tocMenuOpen = true;
    if (this.platform.is('mobile')) {
      this.tocMenuOpen = false;
    }

    try {
      this.hasSeparateIntroToc = this.config.getSettings('separeateIntroductionToc');
    } catch (error) {
      this.hasSeparateIntroToc = false;
    }

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
            const pattern = /<div id="content">(.*?)<\/div>/;
            const matches = String(this.text).match(pattern);
            const the_string = matches[0];
            this.textMenu = the_string;
          },
        error =>  {this.errorMessage = <any>error}
      );
    });

    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      try {
        event.stopPropagation();
        event.preventDefault();
        const elem: HTMLElement = event.target as HTMLElement;
        let targetId = elem.getAttribute('href');
        if ( targetId === null ) {
          targetId = elem.parentElement.getAttribute('href');
        }
        const target = elem.ownerDocument.getElementById(String(targetId).replace('#', '')) as HTMLElement;
        if ( target !== null ) {
           this.scrollToElement(target, event);
        }
      } catch ( e ) {}
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  private scrollToElement(element: HTMLElement, event: Event) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'start'});
    } catch ( e ) {
      console.log(e);
    }
  }

 private toggleTocMenu() {
   if ( this.tocMenuOpen ) {
    this.tocMenuOpen = false;
   } else {
    this.tocMenuOpen = true;
   }
 }
}
