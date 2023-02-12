import { Component, Input } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { GeneralTocItem, TableOfContentsCategory } from 'src/app/models/table-of-contents.model';
import { EventsService } from 'src/app/services/events/events.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { StorageService } from 'src/app/services/storage/storage.service';

/**
 * Class for the TableOfContentsDrilldownMenuComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'table-of-contents-drilldown-menu',
  templateUrl: 'table-of-contents-drilldown-menu.html',
  styleUrls: ['table-of-contents-drilldown-menu.scss'],
})
export class TableOfContentsDrilldownMenuComponent {
  root: TableOfContentsCategory[] | any;
  visibleMenuStack = [] as any;
  menuStack = [] as any;
  thematicMenuStack = [];
  chronologicalMenuStack = [] as any;
  chronologicalTitleStack = [] as any;
  alphabeticalMenuStack?: any[];

  chronologicalOrderActive?: boolean;
  thematicOrderActive = true;
  alphabethicOrderActive?: boolean;

  titleStack?: string[];
  thematicTitleStack?: any[];
  alphabeticalTitleStack?: any[];
  errorMessage?: string;
  currentItem?: any;
  collectionId?: string | null;
  collectionName?: string | null;
  titleText?: string;
  introText?: string;
  coverSelected: boolean;
  introductionSelected: boolean;

  sortableLetters = [] as any;
  letterView = false;
  visibleTitleStack = [] as any;

  constructor(
    private events: EventsService,
    private tableOfContentsService: TableOfContentsService,
    public platform: Platform,
    protected storage: StorageService,
    public translate: TranslateService,
    private config: ConfigService,
    private router: Router,
  ) {
    // this.open = this.action === 'open' ? true : false;
    this.registerEventListeners();
    this.getTOCItem();
    this.coverSelected = false;
    this.introductionSelected = false;
  }

  ionViewWillEnter() {
    this.registerEventListeners();
  }

  getTOCItem() {
    this.storage.get('currentTOCItem').then((tocItem) => {
      if (tocItem) {
        this.currentItem = tocItem;
      } else {
        this.currentItem = new GeneralTocItem();
      }
    });
  }

  setActiveSortingType(e: any) {
    const thematic = e.target.id === 'thematic' || e.target.parentElement.parentElement.id === 'thematic';
    const alphabetic = e.target.id === 'alphabetical' || e.target.parentElement.parentElement.id === 'alphabetical';
    const chronological = e.target.id === 'chronological' || e.target.parentElement.parentElement.id === 'chronological';

    if (thematic) {
        this.alphabethicOrderActive = false;
        this.chronologicalOrderActive = false;
        this.thematicOrderActive = true;
    } else if (alphabetic) {
        this.alphabethicOrderActive = true;
        this.chronologicalOrderActive = false;
        this.thematicOrderActive = false;
    } else if (chronological) {
        this.alphabethicOrderActive = false;
        this.chronologicalOrderActive = true;
        this.thematicOrderActive = false;
    }
  }

  constructAlphabeticalTOC(data: any) {
    this.alphabeticalMenuStack = [];
    this.alphabeticalTitleStack = [];
    const list = data.tocItems.children;

    for (const child of list) {
        if (child.date && child.type !== 'section_title') {
            this.alphabeticalMenuStack.push(child);
        }
    }

    this.alphabeticalMenuStack.sort((a, b) =>
      (a.text.toUpperCase() < b.text.toUpperCase()) ? -1 : (a.text.toUpperCase() > b.text.toUpperCase()) ? 1 : 0);
  }

  constructChronologicalTOC(data: any) {
    this.chronologicalMenuStack = [];
    this.chronologicalTitleStack = [];
    const list = data.tocItems.children;

    for (const child of list) {
        if (child.date && child.type !== 'section_title') {
            this.chronologicalMenuStack.push(child);
        }
    }

    this.chronologicalMenuStack.sort((a: any, b: any) => (a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0);

  }

  flattenList(data: any) {
    const list = [data];
    if (!data.children) {
      return list;
    }

    for (const child of data.children) {
      list.concat(this.flattenList(child));
    }
    return list;
  }

  constructToc(data: any) {
    this.getTOCItem();
    this.root = data.tocItems.children;
    this.menuStack = [];

    if ( data.tocItems.children !== undefined ) {
      this.menuStack.push(data.tocItems.children);
    } else {
      this.menuStack.push(data.tocItems);
    }

    try {
      this.sortableLetters = this.config.getSettings('settings.sortableLetters');
    } catch (e) {
      this.sortableLetters = null;
      console.log(e);
    }

    this.collectionId = data.tocItems.collectionId;
    this.collectionName = data.tocItems.text;

    this.titleStack = [];
    this.titleStack.push(data.tocItems.text || '');

    this.titleText = '';
    this.introText = '';

    let pushToMenu = true;
    for (let menuItemIndex = 0; menuItemIndex <= (this.menuStack[0].length - 1); menuItemIndex++) {
      const menuItem = this.menuStack[0][menuItemIndex];
      if ( menuItem.children !== undefined ) {
        for (let menuSubitemIndex = 0; menuSubitemIndex <= (menuItem.children.length - 1); menuSubitemIndex++) {
          const menuSubitem = menuItem.children[menuSubitemIndex];
          if ( this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children !== undefined ) {
            for (let menuSubSubitemIndex = 0;
              menuSubSubitemIndex <= (this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children.length - 1);
              menuSubSubitemIndex++) {
              const menuSubSubitem = menuSubitem.children[menuSubSubitemIndex];
              if ( menuSubSubitem.itemId === data.tocItems.selectedCollId + '_' + data.tocItems.selectedPubId) {
                this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children[menuSubSubitemIndex].selected = true;
                if ( pushToMenu ) {
                  this.menuStack.push(this.menuStack[0][menuItemIndex].children);
                  this.menuStack.push(this.menuStack[0][menuItemIndex].children[menuSubitemIndex].children);
                  this.titleStack.push(this.menuStack[0][menuItemIndex].children[menuSubitemIndex].text);
                  pushToMenu = false;
                }
              }
            }
          } else {
            if ( menuSubitem.itemId === data.tocItems.selectedCollId + '_' + data.tocItems.selectedPubId) {
              this.menuStack[0][menuItemIndex].children[menuSubitemIndex].selected = true;
              if ( pushToMenu ) {
                this.menuStack.push(this.menuStack[0][menuItemIndex].children);
                this.titleStack.push(this.menuStack[0][menuItemIndex].text);
                pushToMenu = false;
              }
            }
          }
        }
      } else {
        if ( menuItem.itemId === data.tocItems.selectedCollId + '_' + data.tocItems.selectedPubId) {
          this.menuStack[0][menuItemIndex].selected = true;
          if ( pushToMenu ) {
            this.menuStack.push(this.menuStack[0]);
            this.titleStack.push(this.menuStack[0][menuItemIndex].text);
            pushToMenu = false;
          }
        }
      }
    }

    if ( data.tocItems.coverSelected !== undefined ) {
      this.coverSelected = true;
    } else {
      this.coverSelected = false;
    }

    if ( data.tocItems.introductionSelected !== undefined ) {
      this.introductionSelected = true;
    } else {
      this.introductionSelected = false;
    }

    this.translate.get('Read.TitlePage.Title').subscribe(
      retData => {
        this.titleText = retData;
      }, error => {

      }
    );
    this.translate.get('Read.Introduction.Title').subscribe(
      retData => {
        this.introText = retData;
      }, error => {

      }
    );
  };


  registerEventListeners() {
    this.events.getTableOfContentsLoaded().subscribe((data: any) => {
      console.log('tableOfContents:loaded in table-of-contents-drilldown.ts');

      this.constructToc(data);
      this.constructAlphabeticalTOC(data);
      this.constructChronologicalTOC(data);


      this.visibleMenuStack = this.menuStack;
    });
  }
  ngOnDestroy() {
    this.events.getTableOfContentsLoaded().complete();
  }

  drillDown(item: any) {
    this.visibleMenuStack.push(item.children);
    this.visibleTitleStack.push(item.text);
  }

  unDrill() {
    if ( this.visibleMenuStack.length === 2 && this.visibleMenuStack[0] === this.visibleMenuStack[1] ) {
      this.exit();
    }
    // document.getElementById('contentMenu').classList.add('menu-enabled');
    // document.getElementById('tableOfContentsMenu').classList.remove('menu-enabled');

    this.visibleMenuStack.pop();
    this.visibleTitleStack.pop();
  }

  open(item: any, type?: any, html?: any) {
    this.currentItem = item;
    if (this.currentItem) {
      this.currentItem.selected = true;
    }
    this.storage.set('currentTOCItem', item);
    const params = {root: this.root, tocItem: item, collection: {title: item.title}} as any;

    this.coverSelected = false;
    this.introductionSelected = false;

    for (let menuItemIndex = 0; menuItemIndex < this.visibleMenuStack.length; menuItemIndex++) {
      const menuItem = this.visibleMenuStack[menuItemIndex];
      for (let menuSubitemIndex = 0; menuSubitemIndex < menuItem.length; menuSubitemIndex++) {
        const menuSubitem = menuItem[menuSubitemIndex];
        this.visibleMenuStack[menuItemIndex].selected = false;
        if ( menuSubitem.itemId === item.itemId) {
          this.visibleMenuStack[menuItemIndex].selected = true;
          this.visibleMenuStack[menuItemIndex][menuSubitemIndex].selected = true;
        } else {
          this.visibleMenuStack[menuItemIndex].selected = false;
          this.visibleMenuStack[menuItemIndex][menuSubitemIndex].selected = false;
        }
      }
    }

    if (item.url) {
      params['url'] = item.url;
    }

    if (item.datafile) {
      params['song_datafile'] = item.datafile;
    }

    if (item.itemId) {
      params['tocLinkId'] = item.itemId;
      const parts = item.itemId.split('_');
      params['collectionID'] = parts[0];
      params['publicationID'] = parts[1];
      if ( parts[2] !== undefined ) {
        params['chapterID'] = parts[2];
      }
    }

    if ( this.currentItem['facsimilePage'] ) {
      params['facsimilePage'] = this.currentItem['facsimilePage'];
    }

    params['facs_id'] = 'not';
    params['facs_nr'] = 'infinite';
    params['song_id'] = 'nosong';

    if (type && type === 'facsimile') {
      params['collectionID'] = this.collectionId;
      params['publicationID'] = item.publication_id;
      params['tocLinkId'] = `${this.collectionId}_${item.publication_id}`;

      params['facs_id'] = item.facsimile_id;
      params['facs_nr'] = item.facs_nr;
    }

    if (type && type === 'song-example') {
      params['collectionID'] = this.collectionId;
      params['publicationID'] = item.publication_id;
      params['tocLinkId'] = `${this.collectionId}_${item.publication_id}`;
      params['song_id'] = item.song_id;
      params['facs_id'] = item.facsimile_id;
      params['facs_nr'] = item.facs_nr;
    }

    if ( this.platform.is('desktop') ) {
      this.events.publishTitleLogoShow(true);
    } else {
      this.events.publishTitleLogoShow(false);
    }
    console.log('Opening read from TableOfContentsDrilldownMenuComponent.open()');
    // TODO Sami
    this.router.navigate(['/read'], { queryParams: params });

    try {
      const element = document.getElementById(html);
      if (element) {
        this.scrollToTOC(element);
      }
    } catch ( e ) {
    }
  }

  openIntroduction() {
    const params = {root: this.root, tocItem: null, collection: JSON.stringify({title: 'Introduction'})} as any;
    this.router.navigate([`/publication-introduction/${this.collectionId}`], { queryParams: params });
  }

  openTitlePage() {
    const params = {root: this.root, tocItem: null, collection: JSON.stringify({title: 'Title Page'})} as any;
     params['firstItem'] = '1';
    this.router.navigate([`/publication-title/${this.collectionId}`], { queryParams: params });
  }

  private scrollToTOC(element: HTMLElement) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'center'});
    } catch ( e ) {
      console.log(e);
    }
  }

  private exit() {
    this.visibleMenuStack = [];
    this.visibleTitleStack = [];
    this.menuStack = [];
    this.collectionId = null;
    this.collectionName = null;
    this.router.navigate(['/publications']);
    this.events.publishExitedTo('EditionsPage');
  }
}

