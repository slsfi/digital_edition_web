import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { MetadataService } from 'src/app/services/metadata/metadata.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { TextService } from 'src/app/services/texts/text.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';

/**
 * Generated class for the CoverPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'cover-page',
//   segment: 'publication-cover/:collectionID',
//   priority: 'high'
// })
@Component({
  selector: 'page-cover',
  templateUrl: 'cover.html',
  styleUrls: ['cover.scss']
})
export class CoverPage {

  errorMessage: any;
  image_alt = '';
  image_src = '';
  lang = 'sv';
  hasMDCover = false;
  hasDigitalEditionListChildren = false;
  childrenPdfs = [];
  protected id?: string;
  protected text: any;
  protected collection: any;
  coverSelected: boolean;
  collectionID: any;
  languageSubscription?: Subscription;

  constructor(
    public navCtrl: NavController,
    private langService: LanguageService,
    private textService: TextService,
    protected sanitizer: DomSanitizer,
    protected events: EventsService,
    private storage: Storage,
    public userSettingsService: UserSettingsService,
    protected tableOfContentsService: TableOfContentsService,
    public config: ConfigService,
    private mdContentService: MdContentService,
    private metadataService: MetadataService,
    private route: ActivatedRoute,
  ) {
    this.coverSelected = true;
    try {
      this.hasMDCover = this.config.getSettings('ProjectStaticMarkdownCoversFolder');
    } catch (e) {
      this.hasMDCover = false;
    }
  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);

    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publishMusicAccordionReset(true);
    this.events.publishTableOfContentsUnSelectSelectedTocItem({'selected': 'cover'});
  }

  ngOnInit() {
    this.languageSubscription = this.langService.languageSubjectChange().subscribe(lang => {
      this.lang = lang;
      if (this.lang && this.id) {
        this.loadCover(lang, this.id);
      }
    });
    this.route.queryParams.subscribe(params => {
      this.id = params['collectionID'];

      if (this.lang && this.id) {
        this.loadCover(this.lang, this.id);
      }

      if ( params['publicationID'] === undefined ) {
        this.coverSelected = true;
      } else {
        this.coverSelected = false;
      }

      if (this.collectionID !== params['collectionID']) {
        this.events.publishSelectedItemInMenu({
          menuID: this.collectionID,
          component: 'cover-page'
        });
      }
      this.collectionID = params['collectionID'];
      this.checkIfCollectionHasChildrenPdfs();
    });
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  checkIfCollectionHasChildrenPdfs() {
    let configChildrenPdfs = [];

    try {
      configChildrenPdfs = this.config.getSettings(`collectionChildrenPdfs.${this.collectionID}`);
    } catch (e) {}

    if (configChildrenPdfs.length) {
      this.childrenPdfs = configChildrenPdfs;
      this.hasDigitalEditionListChildren = true;
      this.events.publishCollectionWithChildrenPdfsHighlight(this.collectionID);
    }
  }

  loadCover(lang: string, id: string) {
    this.getTocRoot(this.collectionID);
    this.events.publishPageLoadedCover();
    if (!isNaN(Number(this.id))) {
      if (!this.hasMDCover) {
        /**
         * ! The necessary API endpoint for getting the cover page via textService has not been
         * ! implemented, so getting the cover this way does not work. It has to be given in a
         * ! markdown file.
         */
        this.textService.getCoverPage(id, lang).subscribe(
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
      (tocItems: any) => {
        tocItems.coverSelected = this.coverSelected;
        this.events.publishTableOfContentsLoaded({tocItems: tocItems, searchTocItem: true, collectionID: tocItems.collectionId, 'caller':  'cover'});
        this.storage.set('toc_' + id, tocItems);
      },
      error =>  {this.errorMessage = <any>error}
    );

    return;
  }

  printMainContentClasses() {
    if (this.userSettingsService.isMobile()) {
      return 'mobile-mode-cover-content';
    } else {
      return '';
    }
  }

}
