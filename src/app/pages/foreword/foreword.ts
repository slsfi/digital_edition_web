import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ModalController, NavController, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ReferenceDataModalPage } from 'src/app/modals/reference-data-modal/reference-data-modal';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { TextService } from 'src/app/services/texts/text.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { ReadPopoverPage } from 'src/pages/read-popover/read-popover';

/**
 * Generated class for the ForewordPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'foreword-page',
//   segment: 'publication-foreword/:collectionID',
//   priority: 'high'
// })
@Component({
  selector: 'page-foreword',
  templateUrl: 'foreword.html',
  styleUrls: ['foreword.scss']
})
export class ForewordPage {

  errorMessage: any;
  protected id?: string;
  protected text: any;
  protected collection: any;
  forewordSelected?: boolean;
  collectionID: any;
  showURNButton: boolean;
  showDisplayOptionsButton: Boolean = true;
  textLoading: Boolean = true;
  languageSubscription: Subscription | null;
  lang: any;

  constructor(
    public navCtrl: NavController,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected events: EventsService,
    public userSettingsService: UserSettingsService,
    protected tableOfContentsService: TableOfContentsService,
    public config: ConfigService,
    protected popoverCtrl: PopoverController,
    public readPopoverService: ReadPopoverService,
    private modalController: ModalController,
    public translateService: TranslateService,
    private route: ActivatedRoute,
  ) {
    try {
      this.showURNButton = this.config.getSettings('showURNButton.pageForeword');
    } catch (e) {
      this.showURNButton = false;
    }

    try {
      this.showDisplayOptionsButton = this.config.getSettings('showDisplayOptionsButton.pageForeword');
    } catch (e) {
      this.showDisplayOptionsButton = true;
    }

    this.languageSubscription = null;
  }

  ngOnInit() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.lang = lang;
      if (this.lang && this.id) {
        this.loadForeword(lang, this.id);
      }
    });

    this.route.params.subscribe(params => {
      this.id = params['collectionID'];

      if (this.lang && this.id) {
        this.loadForeword(this.lang, this.id);
      }

      this.events.publishSelectedItemInMenu({
        menuID: this.id,
        component: 'foreword-page'
      });
    })

    this.route.queryParams.subscribe(params => {
      this.collection = params['collection'];

      if (params['publicationID'] === undefined) {
        this.forewordSelected = true;
      } else {
        this.forewordSelected = false;
      }
    })
  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    this.events.publishTableOfContentsUnSelectSelectedTocItem({'selected': 'foreword'});
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadForeword(lang: string, id: string) {
    this.textLoading = true;
    this.getTocRoot(id);
    this.textService.getForewordPage(id, lang).subscribe(
      res => {
        if (res.content && res.content !== 'File not found') {
          this.text = this.sanitizer.bypassSecurityTrustHtml(
            res.content.replace(/images\//g, 'assets/images/')
              .replace(/\.png/g, '.svg')
          );
        } else {
          this.setNoForewordText();
        }
        this.textLoading = false;
      },
      error => {
        this.errorMessage = <any>error;
        this.textLoading = false;
        this.setNoForewordText();
      }
    );
    this.events.publishPageLoadedForeword();
  }

  setNoForewordText() {
    this.translateService.get('Read.ForewordPage.NoForeword').subscribe(
      translation => {
        this.text = translation;
      },
      translationError => { this.text = ''; }
    );
  }

  getTocRoot(id: string) {
    if (id === 'mediaCollections') {
      this.events.publishTableOfContentsLoaded({tocItems: this.collection, searchTocItem: false});
    } else {
      this.tableOfContentsService.getTableOfContents(id).subscribe(
        (tocItems: any) => {
          console.log(tocItems);
          tocItems.forewordSelected = this.forewordSelected;
          this.events.publishTableOfContentsLoaded({tocItems: tocItems, searchTocItem: true, collectionID: tocItems.collectionId, 'caller':  'foreword'});
        },
        error => { 
          this.errorMessage = <any>error;
         }
      );
    }
  }

  async showReadSettingsPopover(myEvent: any) {
    const toggles = {
      'comments': false,
      'personInfo': false,
      'placeInfo': false,
      'workInfo': false,
      'changes': false,
      'normalisations': false,
      'abbreviations': false,
      'pageNumbering': false,
      'pageBreakOriginal': false,
      'pageBreakEdition': false
    };
    const popover = await this.popoverCtrl.create({
      component: ReadPopoverPage,
      componentProps: { toggles },
      cssClass: 'popover_settings',
    });
    popover.present(myEvent);
  }

  public async showReference() {
    // Get URL of Page and then the URI
    const modal = await this.modalController.create({
      component: ReferenceDataModalPage,
      componentProps: {id: document.URL, type: 'reference', origin: 'page-foreword'},
    });
    modal.present();
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-foreword-content';
    } else {
      return '';
    }
  }
}
