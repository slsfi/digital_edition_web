import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, PopoverController, ModalController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { Storage } from '@ionic/storage';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { ConfigService } from '@ngx-config/core';
import { MdContentService } from '../../app/services/md/md-content.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { ReadPopoverPage } from '../read-popover/read-popover';
import { ReferenceDataModalPage } from '../../pages/reference-data-modal/reference-data-modal';
import { Subscription } from 'rxjs/Subscription';

/**
 * Generated class for the TitlePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'title-page',
  segment: 'publication-title/:collectionID',
  priority: 'high'
})
@Component({
  selector: 'page-title',
  templateUrl: 'title.html',
})
export class TitlePage {

  errorMessage: any;
  mdContent: string;
  hasMDTitle = '';
  hasDigitalEditionListChildren = false;
  childrenPdfs = [];
  protected id: string;
  protected text: any;
  protected collection: any;
  titleSelected: boolean;
  collectionID: any;
  showURNButton: boolean;
  showDisplayOptionsButton: Boolean = true;
  textLoading: Boolean = false;
  languageSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private langService: LanguageService,
    private textService: TextService,
    private mdService: MdContentService,
    protected sanitizer: DomSanitizer,
    protected params: NavParams,
    protected events: Events,
    private storage: Storage,
    private userSettingsService: UserSettingsService,
    protected tableOfContentsService: TableOfContentsService,
    public config: ConfigService,
    public mdContentService: MdContentService,
    protected popoverCtrl: PopoverController,
    public readPopoverService: ReadPopoverService,
    private modalController: ModalController
  ) {
    this.titleSelected = true;
    this.id = this.params.get('collectionID');

    this.collection = this.params.get('collection');
    if ( this.params.get('publicationID') === undefined ) {
      this.titleSelected = true;
    } else {
      this.titleSelected = false;
    }
    this.mdContent = '';
    try {
      this.hasMDTitle = this.config.getSettings('ProjectStaticMarkdownTitleFolder');
    } catch (e) {
      this.hasMDTitle = '';
    }

    try {
      this.showURNButton = this.config.getSettings('showURNButton.pageTitle');
    } catch (e) {
      this.showURNButton = false;
    }

    try {
      this.showDisplayOptionsButton = this.config.getSettings('showDisplayOptionsButton.pageTitle');
    } catch (e) {
      this.showDisplayOptionsButton = true;
    }

    this.languageSubscription = null;

    // Check if id not a Number
    let idNaN = isNaN(Number(this.id));
    if ( this.id === null || this.id === 'null' ) {
      idNaN = true;
    }

    // idNaN === false, id is a number
    if ( idNaN === false ) {
      this.checkIfCollectionHasChildrenPdfs();
    }
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  checkIfCollectionHasChildrenPdfs() {
    let configChildrenPdfs = [];

    try {
      configChildrenPdfs = this.config.getSettings(`collectionChildrenPdfs.${this.id}`);
    } catch (e) {}

    if (configChildrenPdfs.length) {
      this.childrenPdfs = configChildrenPdfs;
      this.hasDigitalEditionListChildren = true;
      this.events.publish('CollectionWithChildrenPdfs:highlight', this.id);
    }
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('musicAccordion:reset', true);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'title'});
    this.events.publish('SelectedItemInMenu', {
      menuID: this.params.get('collectionID'),
      component: 'title-page'
    });

  }

  getMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => { this.mdContent = text.content; },
            error =>  {this.errorMessage = <any>error}
        );
  }

  getTocRoot(id: string) {
    if ( id === 'mediaCollections' || id === undefined ) {
      this.events.publish('tableOfContents:loaded', {tocItems: this.collection, searchTocItem: false});
    } else {
      this.tableOfContentsService.getTableOfContents(id)
      .subscribe(
          tocItems => {
            tocItems.titleSelected = this.titleSelected;
            this.events.publish('tableOfContents:loaded', {tocItems: tocItems, searchTocItem: true, collectionID: tocItems.collectionId, 'caller':  'title'});
        },
        error =>  {this.errorMessage = <any>error});
    }

  }

  ionViewDidLoad() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadTitle(lang);
      } else {
        this.langService.getLanguage().subscribe(language => {
          this.loadTitle(language);
        });
      }
    });
  }

  loadTitle(lang: string) {
    this.textLoading = true;
    this.getTocRoot(this.params.get('collectionID'));
    const isIdText = isNaN(Number(this.id));
    if (this.hasMDTitle === '') {
      if (isIdText === false) {
        this.textService.getTitlePage(this.id, lang).subscribe(
          res => {
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                .replace(/\.png/g, '.svg')
            );
            this.textLoading = false;
          },
          error => {
            this.errorMessage = <any>error;
            this.textLoading = false;
          }
        );
      }
    } else {
      if (isIdText === false) {
        const fileID = `${lang}-${this.hasMDTitle}-${this.id}`;
        this.mdService.getMdContent(fileID).subscribe(
          res => {
            this.mdContent = res.content;
            this.textLoading = false;
          },
          error => {
            this.errorMessage = <any>error;
            this.textLoading = false;
          }
        );
      } else {
        this.mdContentService.getMdContent(`${lang}-gallery-intro`).subscribe(
          text => {
            this.mdContent = text.content;
            this.textLoading = false;
          },
          error =>  {
            this.errorMessage = <any>error;
            this.textLoading = false;
          }
        );
      }
    }
    this.events.publish('pageLoaded:title');
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
    const modal = this.modalController.create(ReferenceDataModalPage, {id: document.URL, type: 'reference', origin: 'page-title'});
    modal.present();
    modal.onDidDismiss(data => {
      // console.log('dismissed', data);
    });
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-title-content';
    } else {
      return '';
    }
  }
}
