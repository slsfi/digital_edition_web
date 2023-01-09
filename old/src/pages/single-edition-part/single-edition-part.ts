import { Component } from '@angular/core';
import { NavController, ViewController, NavParams, PopoverController, IonicPage, Events } from 'ionic-angular';

import { ReadPopoverPage } from '../read-popover/read-popover';
import { ConfigService } from '@ngx-config/core';
import { global } from '../../app/global';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TextService } from '../../app/services/texts/text.service';
import { LanguageService } from '../../app/services/languages/language.service';
import { DigitalEdition } from '../../app/models/digital-edition.model';
import { TableOfContentsCategory, GeneralTocItem } from '../../app/models/table-of-contents.model';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';

@IonicPage({
  name: 'single-edition-part',
  segment: 'publication-part-toc/:collectionID/:id/'
})
@Component({
  selector: 'page-single-edition-part',
  templateUrl: 'single-edition-part.html'
})
export class SingleEditionPagePart {

  collection: DigitalEdition;
  shallFetch: boolean;
  errorMessage: string;
  image: string;

  appName: string;
  subTitle: string;

  tableOfContents: TableOfContentsCategory[];
  tocItems: GeneralTocItem[];
  parentItem: GeneralTocItem;
  root: TableOfContentsCategory[];
  items: any;

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public params: NavParams,
    private tableOfContentsService: TableOfContentsService,
    public popoverCtrl: PopoverController,
    private config: ConfigService,
    private textService: TextService,
    private translate: TranslateService,
    private langService: LanguageService,
    private events: Events
  ) {

      console.log('at single collection part...');

      this.collection = this.params.get('collection') || {id: this.params.get('collectionID')};
      this.parentItem = this.params.get('tocItem');
      this.shallFetch = this.params.get('fetch');

      this.langService.getLanguage().subscribe((lang) => {
        this.appName = this.config.getSettings('app.name.' + lang);
      });

    if ( this.parentItem !== undefined ) {
      this.subTitle = this.parentItem.title;
    }

    if ( this.collection !== undefined && this.collection.title !== undefined ) {
      global.setSubtitle(this.collection.title);
    }

    this.collection.title = global.getSubtitle();

        if (!this.shallFetch && this.params.data.tocItem && this.params.data.tocItem.items ) {
            this.items = this.params.data.tocItem.items;
            this.root = this.params.data.root;
        }
        const collectionImages = this.config.getSettings('editionImages');
        this.image = collectionImages[this.collection.id];

  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }

  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
    if (this.collection.id) {
      this.getTocRoot(this.collection.id);
    } else {
      this.getTocGroup(this.parentItem.toc_ed_id, this.parentItem.toc_id);
    }
    this.viewCtrl.setBackButtonText('');
    this.events.publish('pageLoaded:single-edition-part', {'title': this.subTitle});

  }

  setTocItemTitleLevel(tocItems) {
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
            tableOfContents => {
              this.root = tableOfContents;
              this.tableOfContents = tableOfContents;
            },
            error =>  {this.errorMessage = <any>error});
  }

  showPopover(myEvent) {
    const popover = this.popoverCtrl.create(ReadPopoverPage);
    popover.present({
      ev: myEvent
    });
  }
}
