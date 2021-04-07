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
import { MetadataService } from '../../app/services/metadata/metadata.service';

/**
 * Generated class for the CoverPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'cover-page',
  segment: 'publication-cover/:collectionID',
  priority: 'high'
})
@Component({
  selector: 'page-cover',
  templateUrl: 'cover.html',
})
export class CoverPage {

  errorMessage: any;
  mdContent: string;
  lang = 'sv';
  hasMDCover = false;
  hasDigitalEditionListChildren = false;
  childrenPdfs = [];
  protected id: string;
  protected text: any;
  protected collection: any;
  coverSelected: boolean;
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
    public mdContentService: MdContentService,
    private metadataService: MetadataService
  ) {
    this.coverSelected = true;
    this.id = this.params.get('collectionID');
    console.log(`Coverpage id is ${this.id}`);
    this.lang = this.config.getSettings('i18n.locale');
    this.collection = this.params.get('collection');
    if ( this.params.get('publicationID') === undefined ) {
      this.coverSelected = true;
    } else {
      this.coverSelected = false;
    }
    this.mdContent = '';
    try {
      this.hasMDCover = this.config.getSettings('ProjectStaticMarkdownCoversFolder');
    } catch (e) {
      this.hasMDCover = false;
    }

    this.events.subscribe('language:change', () => {
      this.langService.getLanguage().subscribe((lang) => {
        this.lang = lang;
        this.ionViewDidLoad();
      });
    });

    this.checkIfCollectionHasChildrenPdfs();

    if (!isNaN(Number(this.id))) {
      if (this.hasMDCover) {
        const folder = this.hasMDCover;
        this.getMdContent(`${this.lang}-${folder}-${this.id}`);
      }
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('language:change');
  }

  checkIfCollectionHasChildrenPdfs() {
    this.collectionID = this.params.get('collectionID');
    let configChildrenPdfs = [];

    try {
      configChildrenPdfs = this.config.getSettings(`collectionChildrenPdfs.${this.collectionID}`);
    } catch (e) {}

    if (configChildrenPdfs.length) {
      this.childrenPdfs = configChildrenPdfs;
      this.hasDigitalEditionListChildren = true;
      this.events.publish('CollectionWithChildrenPdfs:highlight', this.collectionID);
    }
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);

    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publish('musicAccordion:reset', true);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {'selected': 'cover'});

    this.events.publish('SelectedItemInMenu', {
      menuID: this.params.get('collectionID'),
      component: 'cover-page'
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
      return [{}];
    }
    this.tableOfContentsService.getTableOfContents(id)
    .subscribe(
        tocItems => {
          tocItems.coverSelected = this.coverSelected;
          this.events.publish('tableOfContents:loaded', {tocItems: tocItems, searchTocItem: true, collectionID: tocItems.collectionId, 'caller':  'cover'});
          this.storage.set('toc_' + id, tocItems);
        },
      error =>  {this.errorMessage = <any>error});
  }

  ionViewDidLoad() {
    this.getTocRoot(this.params.get('collectionID'));
    this.events.publish('pageLoaded:cover');
    if (!isNaN(Number(this.id))) {
      if (!this.hasMDCover) {
        this.langService.getLanguage().subscribe(lang => {
          this.textService.getCoverPage(this.id, lang).subscribe(
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
      } else {
        if (isNaN(Number(this.id))) {
          this.langService.getLanguage().subscribe(lang => {
            const fileID = lang + '-08';
            this.hasMDCover = true;
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
        }
      }
    }
  }
}
