import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, PopoverController, ModalController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { ConfigService } from '@ngx-config/core';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { ReadPopoverPage } from '../read-popover/read-popover';
import { ReferenceDataModalPage } from '../reference-data-modal/reference-data-modal';
import { Subscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';

/**
 * Generated class for the ForewordPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'foreword-page',
  segment: 'publication-foreword/:collectionID',
  priority: 'high'
})
@Component({
  selector: 'page-foreword',
  templateUrl: 'foreword.html',
})
export class ForewordPage {

  errorMessage: any;
  protected id: string;
  protected text: any;
  protected collection: any;
  forewordSelected: boolean;
  collectionID: any;
  showURNButton: boolean;
  showDisplayOptionsButton: Boolean = true;
  textLoading: Boolean = true;
  languageSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected params: NavParams,
    protected events: Events,
    private userSettingsService: UserSettingsService,
    protected tableOfContentsService: TableOfContentsService,
    public config: ConfigService,
    protected popoverCtrl: PopoverController,
    public readPopoverService: ReadPopoverService,
    private modalController: ModalController,
    public translateService: TranslateService,
  ) {
    this.id = this.params.get('collectionID');
    this.collection = this.params.get('collection');

    if (this.params.get('publicationID') === undefined) {
      this.forewordSelected = true;
    } else {
      this.forewordSelected = false;
    }

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

  ionViewDidLoad() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadForeword(lang);
      }
    });
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'foreword'});
    this.events.publish('SelectedItemInMenu', {
      menuID: this.params.get('collectionID'),
      component: 'foreword-page'
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadForeword(lang: string) {
    this.textLoading = true;
    this.getTocRoot(this.id);
    this.textService.getForewordPage(this.id, lang).subscribe(
      res => {
        if (res.content !== 'File not found') {
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
    this.events.publish('pageLoaded:foreword');
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
    if (id === 'mediaCollections' || id === undefined) {
      this.events.publish('tableOfContents:loaded', {tocItems: this.collection, searchTocItem: false});
    } else {
      this.tableOfContentsService.getTableOfContents(id).subscribe(
        tocItems => {
          tocItems.forewordSelected = this.forewordSelected;
          this.events.publish('tableOfContents:loaded', {tocItems: tocItems, searchTocItem: true, collectionID: tocItems.collectionId, 'caller':  'foreword'});
        },
        error => { this.errorMessage = <any>error; }
      );
    }
  }

  showReadSettingsPopover(myEvent) {
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
    const popover = this.popoverCtrl.create(ReadPopoverPage, {toggles}, { cssClass: 'popover_settings' });
    popover.present({
      ev: myEvent
    });
  }

  private showReference() {
    // Get URL of Page and then the URI
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference', origin: 'page-foreword'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-foreword-content';
    } else {
      return '';
    }
  }
}
