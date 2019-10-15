import { Component, Output, EventEmitter } from '@angular/core';
import { TocItem } from '../../app/models/toc-item.model';
import { Events, App } from 'ionic-angular';
import { TableOfContentsService } from '../../app/services/toc/table-of-contents.service';

/**
 * Generated class for the TocMenuComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'toc-menu',
  templateUrl: 'toc-menu.html'
})
export class TocMenuComponent {
  root: TocItem[];
  tocItems: any[];
  menuStack: any[];
  titleStack: string[];
  language = 'sv';
  errorMessage: string;

  constructor(
    private events: Events,
    private tableOfContentsService: TableOfContentsService,
    private app: App
  ) {
    this.menuStack = [];
    this.titleStack = [];
  }

  getTocItems() {

  }

  ngOnInit() {
    this.getTocItems();
  }

  drillDown(item: TocItem) {
    this.titleStack.push(item.title);
    this.menuStack.push(item.children);

    if (item.type === 'title' && item.id) {
      // this.openCollection(item);
    }
  }

  unDrill(item: TocItem) {
    this.titleStack.pop();
    this.menuStack.pop();
  }

  open(item: TocItem) {
    if (item.type === 'link') {
      this.openRead(item);
    } else if (item.type === 'page') {
      this.openPage(item.url);
    }
  }

  openPage(page: string) {
    const nav = this.app.getActiveNavs();

    if (page.length && page.length > 0) {
      nav[0].setRoot(page);
    }
  }

  openRead(item: TocItem) {
    const params = {root: this.root, tocItem: item, collection: {title: item.title}};
    params['tocLinkId'] = item.id;
    params['collectionID'] = item.id.split('_')[0];
    params['publicationID'] = item.id.split('_')[1];
    params['legacyId'] = item.id;

    const nav = this.app.getActiveNavs();
    nav[0].setRoot('read', params);
  }

  private openCollection(item: TocItem) {
    const params = {collection: item, fetch: false, id: item.id};
    const nav = this.app.getActiveNavs();

    nav[0].setRoot('single-edition', params, {animate: false, direction: 'forward', animation: 'ios-transition'});
  }

}
