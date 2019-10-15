import { Component, Input } from '@angular/core';

import { App, Events } from 'ionic-angular';

import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SingleEditionPagePart } from '../../pages/single-edition-part/single-edition-part';
import { ReadPage } from '../../pages/read/read';
import { DigitalEdition } from '../../app/models/digital-edition.model';
import { TableOfContentsCategory, GeneralTocItem } from '../../app/models/table-of-contents.model';
import { LanguageService } from '../../app/services/languages/language.service';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';


@Component({
  selector: 'table-of-contents',
  templateUrl: `table-of-contents.component.html`
})
export class TableOfContentsList {
  errorMessage: string;
  @Input() collection: DigitalEdition;
  @Input() tableOfContents: TableOfContentsCategory[];
  @Input() root: TableOfContentsCategory[];

  @Input() tocItems: GeneralTocItem[];
  @Input() showIntroduction: boolean;

  language: string;

  constructor(
    private app:
    App, private tableOfContentsService: TableOfContentsService,
    public translate: TranslateService,
    public languageService: LanguageService,
    public events: Events) {
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
    });
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  openIntroduction() {
    const params = {root: this.root, tocItem: null, collection: {title: 'Introduction'}};
    params['collectionID'] = this.collection.id;
    params['publicationID'] = 'introduction';
    params['firstItem'] = '1'; // this.getFirstLink(this.tocItems);
    const nav = this.app.getActiveNavs();
    nav[0].push('read', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
  }

  getFirstLink(items) {
    const len = items.length
    let i, j, len2;

    for (i = 0; i < len; i++) {
      if (items[i].toc_linkID) {
        return items[i];
      }
      const children = items[i].items;
      console.log(children);
      for (j = 0, len2 = children.length; j < len2; j++) {
        if (children[i].toc_linkID) {
          return children[i];
        }
      }
    }
  }

  openTocItem(tocItem: any) {
    const params = {root: this.root, tocItem: tocItem, collection: {title: tocItem.title}};
    const nav = this.app.getActiveNavs();

    if (tocItem.toc_linkID) {
      params['tocLinkId'] = tocItem.toc_ed_id + '_' + tocItem.toc_linkID;
      params['publicationID'] = tocItem.toc_linkID;
      params['collectionID'] = tocItem.toc_ed_id;
      nav[0].push('read', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
    } else {
      params['collectionID'] = this.collection.id;
      params['publicationID'] = tocItem.toc_id;

      nav[0].push('single-edition-part', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
    }
  }
}
