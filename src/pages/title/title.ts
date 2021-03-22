import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { Storage } from '@ionic/storage';
import { LanguageService } from '../../app/services/languages/language.service';
import { TextService } from '../../app/services/texts/text.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';
import { ConfigService } from '@ngx-config/core';
import { MdContentService } from '../../app/services/md/md-content.service';

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
  lang = 'sv';
  hasMDTitle = '';
  hasDigitalEditionListChildren = false;
  childrenPdfs = [];
  protected id: string;
  protected text: any;
  protected collection: any;
  titleSelected: boolean;
  collectionID: any;

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
    public mdContentService: MdContentService
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

    this.lang = this.config.getSettings('i18n.locale');
    this.events.subscribe('language:change', () => {
      this.langService.getLanguage().subscribe((lang) => {
        this.lang = lang;
        this.ionViewDidLoad();
      });
    });

    this.langService.getLanguage().subscribe((lang) => {
      // Check if not a Number
      let idNaN = isNaN(Number(this.id));
      if ( this.id === null || this.id === 'null' ) {
        idNaN = true;
      }

      // idNaN === false, id is a number
      if ( idNaN === false ) {
        this.checkIfCollectionHasChildrenPdfs();
      }

      // idNaN === false, id is a number
      if ( idNaN === false ) {
        if (this.hasMDTitle !== '') {
          this.getMdContent(`${lang}-${this.hasMDTitle}-${this.id}`);
        }
      } else {
        this.getMdContent(`${lang}-gallery-intro`);
      }
    });
  }

  ngOnDestroy() {
    this.events.unsubscribe('language:change');
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
    this.getTocRoot(this.params.get('collectionID'));
    const isIdText = isNaN(Number(this.id));
    if (this.hasMDTitle === '') {
      if (isIdText === false) {
        this.langService.getLanguage().subscribe(lang => {
          this.textService.getTitlePage(this.id, lang).subscribe(
            res => {
              // in order to get id attributes for tooltips
              this.text = this.sanitizer.bypassSecurityTrustHtml(
                res.content.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
              );
            },
            error => {
              this.errorMessage = <any>error;
            }
          );
        });
      }
    } else {
      if (isIdText === false) {
        this.langService.getLanguage().subscribe(lang => {
          const fileID = `${lang}-${this.hasMDTitle}-${this.id}`;
          this.mdService.getMdContent(fileID).subscribe(
            res => {
              // in order to get id attributes for tooltips
              this.mdContent = res.content;
            },
            error => {
              this.errorMessage = <any>error;
            }
          );
        });
      } else {
        this.langService.getLanguage().subscribe(lang => {
          this.mdContentService.getMdContent(`${lang}-gallery-intro`)
          .subscribe(
              text => {
                 this.mdContent = text.content;
              },
              error =>  {
                this.errorMessage = <any>error
              }
          );
        });
      }
    }
    this.events.publish('pageLoaded:title');
  }
}
