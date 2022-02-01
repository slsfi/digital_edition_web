import { Component, EventEmitter, Input } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import {} from 'fs';
import { PopoverController } from 'ionic-angular';
import { MdContentService } from '../../app/services/md/md-content.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ReadPopoverPage } from '../../pages/read-popover/read-popover';

declare var ePub;
/**
 * Generated class for the MathJaxComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */

 export class Book {
  label: string;
  file: string;
}

@Component({
  selector: 'epub',
  templateUrl: 'epub.html'
})
export class EpubComponent {

  text: string;
  book: any;
  rendition: any;
  displayed: any;
  loading: boolean;
  currentPageNumber: number;
  nextPageNumber: number;
  searchText: string;
  searchResults: any[];
  searchResultIndex: number;
  currentHighlight: any;

  @Input() epubFileName?: string;

  public tocMenuOpen: boolean;
  public searchMenuOpen: boolean;

  public availableEpubs: object;
  public downloadURL: any;

  constructor( private userSettingsService: UserSettingsService,
    public mdContentService: MdContentService,
    protected popoverCtrl: PopoverController,
    public readPopoverService: ReadPopoverService,
    private config: ConfigService ) {
    this.tocMenuOpen = false;
    this.searchMenuOpen = false;
    this.loading = true;
    this.searchResults = [];
    this.searchResultIndex = 0;
  }

  ngAfterViewInit() {
    this.book = ePub('../assets/books/' + this.epubFileName);
    // Get viewport width and height. Make it a bit smaller
    const vw = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) * 0.8;
    const vh = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0)) * 0.8;
    const area = document.getElementById('area');
    if ( this.userSettingsService.isDesktop() ) {
      this.rendition = this.book.renderTo(area,   { width: vw, height: vh, spread: 'always' });
    } else {
      this.rendition = this.book.renderTo(area,   { width: vw, height: vh, spread: 'always' });
    }
    const __this = this;
    this.rendition.on('resized', function(size) {
      __this.rendition.resize(size.width, size.height);
    });

    this.rendition.themes.default({ 'p': { 'font-size': '1.1em !important'}})

    this.displayed = this.rendition.display();

    this.book.ready.then( () => {
      setTimeout(() => {
        this.loading = false;
      }, 2500);
      this.createTOC();
      this.setPageNumbers();
    });

    const __parent = this;
    document.addEventListener('keydown', function( event ) {
      // event.preventDefault();
      switch (event.code) {
        case 'ArrowLeft':
          __parent.prev();
          break;
        case 'ArrowRight':
          __parent.next();
          break;
      }
    });

    try {
      this.availableEpubs = this.config.getSettings('AvailableEpubs');
      for ( const epub in this.availableEpubs ) {
        if ( this.availableEpubs[epub]['filename'] === this.epubFileName ) {
          this.downloadURL = this.availableEpubs[epub]['download'];
        }
      }

    } catch (e) {
      this.availableEpubs = [];
    }
  }

  doSearch(q): Promise<any> {
    const search = String(this.searchText);
    if ( search.length > 0 ) {
      const _book = this.book;
      this.searchResultIndex = 0;
      this.searchResults = [];
      return Promise.all(
        _book.spine.spineItems.map(item =>
          item
          .load(_book.load.bind(_book))
          .then(item.find.bind(item, search))
        )
      ).then(results =>
        Promise.resolve(
          this.searchResults = [].concat.apply([], results)
        ).then( () => {
          this.nextSearch(true);
          }
        )

      );
    }
  };

  applyHighlight(cfiRange) {
    // Apply a class to selected text
    if ( this.currentHighlight !== undefined ) {
      this.rendition.annotations.remove(this.currentHighlight, 'highlight');
    }
    this.rendition.annotations.highlight(cfiRange, {}, (e) => {
    });
    this.currentHighlight = cfiRange;
  }

  nextSearch( first?: boolean ) {
    console.log(this.searchResultIndex);
    if ( this.searchResultIndex < (this.searchResults.length - 1) && first === undefined ) {
      this.searchResultIndex++;
    }
    if ( this.searchResults !== undefined ) {
      const res = this.searchResults[this.searchResultIndex];
      if ( res !== undefined && res['cfi'] !== undefined ) {
        const url = res['cfi'];
        if (  url !== undefined ) {
          this.openChapter(url);
          this.applyHighlight(url);
        }
      }
    }
    console.log(this.searchResultIndex);
  }

  prevSearch() {
    if ( this.searchResultIndex !== 0 ) {
      this.searchResultIndex--;
    }
    if ( this.searchResults !== undefined ) {

      const res = this.searchResults[this.searchResultIndex];
      if ( res !== undefined && res['cfi'] !== undefined ) {
        const url = res['cfi'];
        if (  url !== undefined ) {
          this.openChapter(url);
          this.applyHighlight(url);
        }
      }
    }
  }

  createTOC() {
    const _this = this;
    this.book.loaded.navigation.then(
      function( toc ) {
        const tocDiv = <HTMLDivElement> document.getElementById('toc_text');
        const tocUl = document.createElement('ul');
        tocUl.className = 'topchapter';
        const docfrag = <DocumentFragment> document.createDocumentFragment();
        toc.forEach( (chapter) => {
          // Adds TOC elements recursively to div
          docfrag.appendChild(_this.createTocElement(chapter));
          return null;
        });
        tocUl.appendChild(docfrag);
        tocDiv.appendChild(tocUl);
      }
    );
  }

  // Recursive TOC creation
  createTocElement( chapter ): DocumentFragment {
    const docfrag = <DocumentFragment>document.createDocumentFragment();
    const element = document.createElement('li');
    const link = document.createElement('a');
    const _parent = this;
    link.textContent = chapter.label;
    link.setAttribute('href', chapter.href);
    // Make the TOC links clickable
    link.addEventListener('click', function( event ) {
      event.preventDefault();
      _parent.openChapter(chapter.href);
    });
    if ( chapter.subitems.length > 0 ) {
      element.className = 'has_subchapters';
    }
    element.appendChild(link);
    docfrag.appendChild(element);
    if ( chapter.subitems.length > 0 ) {
      const subTocUl = document.createElement('ul');
      subTocUl.className = 'subchapters';
      chapter.subitems.forEach( (subChapter) => {
        subTocUl.appendChild(this.createTocElement(subChapter));
      });
      docfrag.appendChild(subTocUl);
    }
    return docfrag;
  }

  openChapter( url ) {
    this.rendition.display(url);
  }

  toggleTocMenu() {
    if ( this.tocMenuOpen ) {
      this.tocMenuOpen = false;
    } else {
      this.tocMenuOpen = true;
    }
  }

  toggleSearchMenu() {
    if ( this.searchMenuOpen ) {
      this.searchMenuOpen = false;
    } else {
      this.searchMenuOpen = true;
    }
  }

  setPageNumbers() {
    try {
      const _parent = this;
      this.rendition.on('relocated', function(location) {
        _parent.currentPageNumber = location.start.index;
        _parent.nextPageNumber = location.end.index;
      });
    } catch (error) {
      console.log(error)
    }
  }

  ngOnDestroy() {
    this.book.destroy();
  }

  swipePrevNext(ev) {
    if (ev.direction !== undefined) {
      if (ev.direction === 2) {
        this.next();
      } else if (ev.direction === 4) {
        this.prev();
      }
    }
  }

  next() {
    this.rendition.next();
    this.setPageNumbers();
  }

  prev() {
    this.rendition.prev();
    this.setPageNumbers();
  }

  showReadSettingsPopover(myEvent) {
    const toggles = {
      'comments': false,
      'personInfo': false,
      'placeInfo': false,
      'workInfo': false,
      'changes': false,
      'normalisations': false,
      'abbreviations': false,
      'pageNumbering': false,
      'pageBreakOriginal': false,
      'pageBreakEdition': false
    };
    const popover = this.popoverCtrl.create(ReadPopoverPage, {toggles}, { cssClass: 'popover_settings' });
    popover.present({
      ev: myEvent
    });
    popover.onDidDismiss( ret => {
      /*switch(this.readPopoverService.fontsize){
        case 0:
          this.rendition.themes.default({ "p": { "font-size": "0.8rem !important"}})
        case 1:
          this.rendition.themes.default({ "p": { "font-size": "1rem !important"}})
        case 2:
          this.rendition.themes.default({ "p": { "font-size": "1.2rem !important"}})
        case 3:
          this.rendition.themes.default({ "p": { "font-size": "1.7rem !important"}})
        case 4:
          this.rendition.themes.default({ "p": { "font-size": "1.9rem !important"}})
      }*/

    } )
  }

  downloadEpub() {
    const ref = window.open(this.downloadURL, '_blank');
  }
}
