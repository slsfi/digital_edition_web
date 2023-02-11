import { Component } from '@angular/core';

import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { global } from 'src/app/global';
import { GeneralTocItem, TableOfContentsCategory } from 'src/app/models/table-of-contents.model';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { PopoverController } from '@ionic/angular';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { TextService } from 'src/app/services/texts/text.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { EventsService } from 'src/app/services/events/events.service';
import { ReadPopoverPage } from 'src/app/modals/read-popover/read-popover';
import { ActivatedRoute } from '@angular/router';

// @IonicPage({
//   name: 'single-edition-part',
//   segment: 'publication-part-toc/:collectionID/:id/'
// })
@Component({
  selector: 'page-single-edition-part',
  templateUrl: 'single-edition-part.html'
})
export class SingleEditionPagePart {

  collection: any;
  shallFetch?: boolean;
  errorMessage?: string;
  image?: string;

  appName?: string;
  subTitle?: string;

  tableOfContents?: TableOfContentsCategory[];
  tocItems?: GeneralTocItem[];
  parentItem?: any;
  root?: TableOfContentsCategory[];
  items: any;

  constructor(
    private tableOfContentsService: TableOfContentsService,
    public popoverCtrl: PopoverController,
    private config: ConfigService,
    private textService: TextService,
    private translate: TranslateService,
    private langService: LanguageService,
    private events: EventsService,
    private route: ActivatedRoute,
  ) {

      console.log('at single collection part...');

      this.langService.getLanguage().subscribe((lang) => {
        this.appName = this.config.getSettings('app.name.' + lang);
      });

        // if (!this.shallFetch && this.params.data.tocItem && this.params.data.tocItem.items ) {
        //     this.items = this.params.data.tocItem.items;
        //     this.root = this.params.data.root;
        // }
  }

  async ngOnInit() {
    const collectionImages = this.config.getSettings('editionImages');
    this.route.params.subscribe(params => {
      this.collection = {id: params['collectionID']};

      if ( this.collection !== undefined && this.collection.title !== undefined ) {
        global.setSubtitle(this.collection.title);
      }

      this.collection.title = global.getSubtitle();

      this.image = collectionImages[this.collection.id];
    });

    this.route.queryParams.subscribe(params => {
      if (params['collection']) {
        this.collection = params['collection'];
      }

      this.parentItem = params['tocItem'];
      this.shallFetch = params['fetch'];

      if ( this.parentItem !== undefined ) {
        this.subTitle = this.parentItem.title;
      }

      if ( this.collection !== undefined && this.collection.title !== undefined ) {
        global.setSubtitle(this.collection.title);
      }

      this.collection.title = global.getSubtitle();
    });
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }

  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
    if (this.collection.id) {
      this.getTocRoot(this.collection.id);
    } else {
      this.getTocGroup(this.parentItem.toc_ed_id, this.parentItem.toc_id);
    }
    // this.events.publish('pageLoaded:single-edition-part', {'title': this.subTitle});
  }

  setTocItemTitleLevel(tocItems: any) {
    let maxLevel = tocItems[0].titleLevel;
    let minLevel = tocItems[0].titleLevel;
    let allSameLevel = true;
    for ( const item in tocItems ) {
      if ( tocItems[item].titleLevel > maxLevel ) {
        maxLevel = tocItems[item].titleLevel;
        allSameLevel = false;
      }
      if ( tocItems[item].titleLevel < minLevel ) {
        minLevel = tocItems[item].titleLevel;
      }
    }

    for ( const item in tocItems ) {
      tocItems[item].maxTitleLevel = maxLevel;
      tocItems[item].minTitleLevel = minLevel;
      tocItems[item].isIndented = false;
      tocItems[item].isHighLevel = false;
      if ( allSameLevel === false && tocItems[item].titleLevel === maxLevel ) {
        tocItems[item].isIndented = true;
      }

      if ( tocItems[item].titleLevel === minLevel && (maxLevel - minLevel) >= 2 ) {
        tocItems[item].isHighLevel = true;
      }
    }
    return tocItems;
  }

  getTocRoot(id: string) {
    this.tableOfContentsService.getTableOfContents(id)
        .subscribe(
            tocItems => {
              this.tocItems = this.setTocItemTitleLevel(tocItems);
            },
            error =>  {this.errorMessage = <any>error});
  }

  getTocGroup(id: string, group_id: string) {
    this.tableOfContentsService.getTableOfContentsGroup(id, group_id)
        .subscribe(
            tocItems => {
              this.tocItems = this.setTocItemTitleLevel(tocItems);
            },
            error =>  {this.errorMessage = <any>error});
  }

  getTableOfContents(id: string) {
    this.tableOfContentsService.getTableOfContents(id)
        .subscribe(
            (tableOfContents: any) => {
              this.root = tableOfContents;
              this.tableOfContents = tableOfContents;
            },
            error =>  {this.errorMessage = <any>error});
  }

  async showPopover(myEvent: any) {
    const popover = await this.popoverCtrl.create({
      component: ReadPopoverPage
    });
    popover.present(myEvent);
  }
}
