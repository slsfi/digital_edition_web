import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DigitalEdition } from 'src/app/models/digital-edition.model';
import { GeneralTocItem, TableOfContentsCategory } from 'src/app/models/table-of-contents.model';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';

@Component({
  selector: 'table-of-contents',
  templateUrl: `table-of-contents.component.html`
})
export class TableOfContentsList {
  errorMessage?: string;
  @Input() collection?: DigitalEdition;
  @Input() tableOfContents?: TableOfContentsCategory[];
  @Input() root?: TableOfContentsCategory[];

  @Input() tocItems?: GeneralTocItem[];
  @Input() showIntroduction?: boolean;

  language?: string;

  constructor(
    private tableOfContentsService: TableOfContentsService,
    public translate: TranslateService,
    public languageService: LanguageService,
    public events: EventsService,
    public router: Router,
  ) {
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
    });
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
  }

  openIntroduction() {
    const params = {root: this.root, tocItem: null, collection: {title: 'Introduction'}} as any;
    params['collectionID'] = this.collection?.id;
    params['publicationID'] = 'introduction';
    params['firstItem'] = '1'; // this.getFirstLink(this.tocItems);
    // TODO Sami
    this.router.navigate(['read'], { queryParams: params });
  }

  getFirstLink(items: any) {
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
    const params = {root: this.root, tocItem: tocItem, collection: {title: tocItem.title}} as any;

    if (tocItem.toc_linkID) {
      params['tocLinkId'] = tocItem.toc_ed_id + '_' + tocItem.toc_linkID;
      params['publicationID'] = tocItem.toc_linkID;
      params['collectionID'] = tocItem.toc_ed_id;
      // TODO Sami
      this.router.navigate(['read'], { queryParams: params });
    } else {
      params['publicationID'] = tocItem.toc_id;
      this.router.navigate([`publication-part-toc/${this.collection?.id}`], { queryParams: params });
    }
  }
}
