import { Component, Input, ElementRef, EventEmitter, Output, Renderer2, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { IllustrationPage } from 'src/app/modals/illustration/illustration';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { TextService } from 'src/app/services/texts/text.service';
/**
 * Generated class for the ReadTextComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'read-text',
  templateUrl: 'read-text.html',
  styleUrls: ['read-text.scss']
})
export class ReadTextComponent {

  @Input() link?: string;
  @Input() matches?: Array<string>;
  @Input() external?: string;
  @Input() nochapterPos?: string;
  @Output() openNewIllustrView: EventEmitter<any> = new EventEmitter();
  public text: any;
  protected errorMessage?: string;
  defaultView: string;
  apiEndPoint: string;
  appMachineName: string;
  textLoading: Boolean = true;
  illustrationsVisibleInReadtext: Boolean = false;
  illustrationsViewAvailable: Boolean = false;
  intervalTimerId: number;
  estID: string;
  pos?: string;
  private unlistenClickEvents?: () => void;

  constructor(
    public events: EventsService,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    protected storage: StorageService,
    private toastCtrl: ToastController,
    private renderer2: Renderer2,
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private config: ConfigService,
    public userSettingsService: UserSettingsService,
    public translate: TranslateService,
    protected modalController: ModalController,
    private analyticsService: AnalyticsService,
    public commonFunctions: CommonFunctionsService
  ) {
    this.appMachineName = this.config.getSettings('app.machineName');
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.defaultView = this.config.getSettings('defaults.ReadModeView');
    this.intervalTimerId = 0;
    this.estID = '';

    try {
      const displayTypes = this.config.getSettings('settings.displayTypesToggles');
      if (displayTypes.illustrations === true) {
        this.illustrationsViewAvailable = true;
      }
    } catch (e) {
      this.illustrationsViewAvailable = false;
    }
  }

  ngOnInit() {
    if ( this.external !== undefined && this.external !== null ) {
      const extParts = String(this.external).split(' ');
      this.textService.getCollectionAndPublicationByLegacyId(extParts[0] + '_' + extParts[1]).subscribe(data => {
        if ( data[0] !== undefined ) {
          this.link = data[0]['coll_id'] + '_' + data[0]['pub_id'];
        }
        this.setText();
        this.setIllustrationsInReadtextStatus();
      });
    } else {
      this.setText();
      this.setIllustrationsInReadtextStatus();
    }
    this.setUpTextListeners();
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      // Scroll to link position if defined.
      let iterationsLeft = 10;
      clearInterval(this.intervalTimerId);
      const that = this;
      this.intervalTimerId = window.setInterval(function() {
        if (iterationsLeft < 1) {
          clearInterval(that.intervalTimerId);
        } else {
          iterationsLeft -= 1;
          let posId = null;
          if (that.nochapterPos !== undefined && that.nochapterPos !== null) {
            posId = that.nochapterPos;
          } else if ( that.link !== undefined ) {
            const linkData = that.link.split(';');
            if (linkData[1]) {
              posId = linkData[1];
            } else {
              clearInterval(that.intervalTimerId);
            }
          } else {
            clearInterval(that.intervalTimerId);
          }

          if (posId) {
            let target = document.querySelector('page-read:not([hidden]) [name="' + posId + '"]') as HTMLAnchorElement;
            if ( target && ((target.parentElement && target.parentElement.classList.contains('ttFixed'))
            || (target.parentElement?.parentElement && target.parentElement?.parentElement.classList.contains('ttFixed'))) ) {
              // Position in footnote --> look for second target
              target = document.querySelectorAll('page-read:not([hidden]) [name="' + posId + '"]')[1] as HTMLAnchorElement;
            }
            if (target) {
              that.commonFunctions.scrollToHTMLElement(target);
              clearInterval(that.intervalTimerId);
            }
          } else {
            clearInterval(that.intervalTimerId);
          }
        }
      }.bind(this), 1000);
    });
  }

  ngOnDestroy() {
    this.unlistenClickEvents?.();
  }

  /**
   * ! This method does not work when an open illustrations-view has been previously
   * ! removed and then an attempt to reopen one from the read-text is made. New
   * ! illustrations-views are opened with the openIllustrationInNewView method.
   */
  openNewView( event: any, id: any, type: string ) {
    let openId = id;
    let chapter = null;
    if (String(id).includes('ch')) {
      openId = String(String(id).split('ch')[0]).trim();
      chapter = 'ch' + String(String(id).split('ch')[1]).trim();
    }
    this.events.publishShowView({
      type, openId, chapter
    });
  }

  /** Function for opening the passed image in a new illustrations-view. */
  openIllustrationInNewView(image: any) {
    image.viewType = 'illustrations';
    image.id = null;
    this.openNewIllustrView.emit(image);
    this.commonFunctions.scrollLastViewIntoView();
  }

  private setIllustrationImages() {
    if (this.link) {
      this.textService.getEstablishedText(this.link).subscribe(text => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/html');
        const images: any = xmlDoc.querySelectorAll('img.est_figure_graphic');
        for (let i = 0; i < images.length ; i++) {
          images[i].classList.add('show-illustration');
        }
      });
    }
  }

  async openIllustration(imageNumber: any) {
    const modal = await this.modalController.create({
      component: IllustrationPage,
      componentProps: { 'imageNumber': imageNumber },
      cssClass: 'foo',
    });
    modal.present();
  }

  setText() {
    // Construct estID for storing read-text in storage
    if (!this.link) {
      return;
    }

    if (this.link.indexOf(';') < 0) {
      // No pos in link
      this.estID = this.link + '_est';
    } else {
      const posIndex = this.link.indexOf(';');
      if (this.link.indexOf('_', posIndex) < 0) {
        // Not a multilingual est link but has pos
        this.estID = this.link.split(';')[0] + '_est';
      } else {
        // Multilingual est link with pos, remove pos
        this.estID = this.link.split(';')[0] + '_' + this.link.substring(this.link.lastIndexOf('_') + 1) + '_est';
      }
    }
    // console.log('this.estID:', this.estID);

    if (this.textService.readtextIdsInStorage.includes(this.estID)) {
      this.storage.get(this.estID).then((readtext) => {
        if (readtext) {
          this.textLoading = false;
          if (this.matches) {
            readtext = this.commonFunctions.insertSearchMatchTags(readtext, this.matches);
            this.text = this.sanitizer.bypassSecurityTrustHtml(readtext);
          }
          console.log('Retrieved read-text from cache');
        } else {
          console.log('Failed to retrieve read-text text from cache');
          this.textService.readtextIdsInStorage.splice(this.textService.readtextIdsInStorage.indexOf(this.estID), 1);
          this.getEstText();
        }
      });
    } else {
      this.getEstText();
    }
    this.doAnalytics();
  }

  getEstText() {
    if (!this.link) {
      return;
    }
    this.textService.getEstablishedText(this.link).subscribe(
      content => {
        this.textLoading = false;
        if (content === '' || content === '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>File not found</body></html>') {
          console.log('no reading text');
          this.translate.get('Read.Established.NoEstablished').subscribe(
            translation => {
              this.text = translation;
            }, error => {
              console.error(error);
              this.text = 'Ingen lästext';
            }
          );
        } else {
          const c_id = String(this.link).split('_')[0];
          let processedText = this.textService.postprocessEstablishedText(content, c_id);

          if (!this.textService.readtextIdsInStorage.includes(this.estID)) {
            this.textService.readtextIdsInStorage.push(this.estID);
            this.storage.set(this.estID, processedText);
          }

          if (this.matches) {
            processedText = this.commonFunctions.insertSearchMatchTags(processedText, this.matches);
            this.text = this.sanitizer.bypassSecurityTrustHtml(processedText);
          }
        }
      },
      error => { this.errorMessage = <any>error; this.textLoading = false; this.text = 'Lästexten kunde inte hämtas.'; }
    );
  }

  /**
   * Checks config settings if the current reading text has illustrations that are
   * shown inline in the reading text view (based on matching publication id or collection id).
   * Sets this.illustrationsVisibleInReadtext either true or false.
   */
  private setIllustrationsInReadtextStatus() {
    let showIllustrations = [];
    try {
      showIllustrations = this.config.getSettings('settings.showReadTextIllustrations');
    } catch (e) {
      showIllustrations = [];
    }
    if (showIllustrations.includes(this.link?.split('_')[0]) || showIllustrations.includes(this.link?.split('_')[1])) {
        this.illustrationsVisibleInReadtext = true;
    } else {
      this.illustrationsVisibleInReadtext = false;
    }
  }

  private setUpTextListeners() {
    const nElement: HTMLElement = this.elementRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {

      /* CLICK EVENTS */
      this.unlistenClickEvents = this.renderer2.listen(nElement, 'click', (event) => {
        try {
          const eventTarget = event.target as HTMLElement;

          // Some of the texts e.g. ordsprak.sls.fi links to external sites
          if ( eventTarget.hasAttribute('href') === true && eventTarget.getAttribute('href')?.includes('http') === false ) {
            event.preventDefault();
          }

          if (!this.userSettingsService.isMobile()) {
            let image = null as any;

            // Check if click on an illustration or icon representing an illustration
            if (eventTarget.classList.contains('doodle') && eventTarget.hasAttribute('src')) {
              // Click on a pictogram ("doodle")
              image = {src: '/assets/images/verk/' + String(eventTarget.dataset['id']).replace('tag_', '') + '.jpg', class: 'doodle'};
            } else if (this.illustrationsVisibleInReadtext) {
              // There are possibly visible illustrations in the read text. Check if click on such an image.
              if (eventTarget.classList.contains('est_figure_graphic') && eventTarget.hasAttribute('src')) {
                image = {src: event.target.src, class: 'visible-illustration'};
              }
            } else {
              // Check if click on an icon representing an image which is NOT visible in the reading text
              if (eventTarget.previousElementSibling !== null
              && eventTarget.previousElementSibling.classList.contains('est_figure_graphic')
              && eventTarget.previousElementSibling.hasAttribute('src')) {
                image = {src: event.target.previousElementSibling.src, class: 'illustration'};
              }
            }

            // Check if we have an image to show in the illustrations-view
            if (image !== null) {
              // Check if we have an illustrations-view open, if not, open and display the clicked image there
              if (document.querySelector('page-read:not([hidden]) illustrations') === null) {
                this.ngZone.run(() => {
                  this.openIllustrationInNewView(image);
                });
              } else {
                // Display image in an illustrations-view which is already open
                this.ngZone.run(() => {
                  this.events.publishGiveIllustration(image);
                });
              }
            }
          }
        } catch (e) {
          console.error(e);
        }

        // Check if click on an icon which links to an illustration that should be opened in a modal
        if (event.target.parentNode.classList.contains('ref_illustration')) {
          const hashNumber = event.target.parentNode.hash;
          const imageNumber = hashNumber.split('#')[1];
          this.ngZone.run(() => {
            this.openIllustration(imageNumber);
          });
        }
      });

    });
  }

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Established', 'Established', String(this.link));
  }

}
