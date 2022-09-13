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
import { Subscription } from 'rxjs/Subscription';

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
  image_alt = '';
  image_src = '';
  lang = 'sv';
  hasMDCover = false;
  hasDigitalEditionListChildren = false;
  childrenPdfs = [];
  protected id: string;
  protected text: any;
  protected collection: any;
  coverSelected: boolean;
  collectionID: any;
  languageSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected params: NavParams,
    protected events: Events,
    private storage: Storage,
    private userSettingsService: UserSettingsService,
    protected tableOfContentsService: TableOfContentsService,
    public config: ConfigService,
    private mdContentService: MdContentService,
    private metadataService: MetadataService
  ) {
    this.coverSelected = true;
    this.id = this.params.get('collectionID');
    // console.log(`Coverpage id is ${this.id}`);
    if ( this.params.get('publicationID') === undefined ) {
      this.coverSelected = true;
    } else {
      this.coverSelected = false;
    }
    try {
      this.hasMDCover = this.config.getSettings('ProjectStaticMarkdownCoversFolder');
    } catch (e) {
      this.hasMDCover = false;
    }

    this.checkIfCollectionHasChildrenPdfs();
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

  ionViewDidLoad() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      if (lang) {
        this.loadCover(lang);
      } else {
        this.langService.getLanguage().subscribe(language => {
          this.loadCover(language);
        });
      }
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

  loadCover(lang: string) {
    this.getTocRoot(this.params.get('collectionID'));
    this.events.publish('pageLoaded:cover');
    if (!isNaN(Number(this.id))) {
      if (!this.hasMDCover) {
        /**
         * ! The necessary API endpoint for getting the cover page via textService has not been
         * ! implemented, so getting the cover this way does not work. It has to be given in a
         * ! markdown file.
         */
        this.textService.getCoverPage(this.id, lang).subscribe(
          res => {
            // in order to get id attributes for tooltips
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                .replace(/\.png/g, '.svg')
            );
          },
          error => { this.errorMessage = <any>error; }
        );
      } else {
        this.getCoverImageFromMdContent(`${lang}-${this.hasMDCover}-${this.id}`);
      }
    }
  }

  getCoverImageFromMdContent(fileID: string) {
    this.mdContentService.getMdContent(fileID).subscribe(
      text => {
        /* Extract image url and alt-text from markdown content. */
        this.image_alt = text.content.match(/!\[(.*?)\]\(.*?\)/)[1];
        if (this.image_alt === null) {
          this.image_alt = 'Cover image';
        }
        this.image_src = text.content.match(/!\[.*?\]\((.*?)\)/)[1];
        if (this.image_src === null) {
          this.image_src = '';
        }
      },
      error =>  {this.errorMessage = <any>error}
    );
  }

  getTocRoot(id: string) {
    if ( id === 'mediaCollections' || id === undefined ) {
      return [{}];
    }
    this.tableOfContentsService.getTableOfContents(id).subscribe(
      tocItems => {
        tocItems.coverSelected = this.coverSelected;
        this.events.publish('tableOfContents:loaded', {tocItems: tocItems, searchTocItem: true, collectionID: tocItems.collectionId, 'caller':  'cover'});
        this.storage.set('toc_' + id, tocItems);
      },
      error =>  {this.errorMessage = <any>error}
    );
  }

}
