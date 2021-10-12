import { Component, HostListener, EventEmitter, Input } from '@angular/core';
import {} from 'fs';
import { exit } from 'process';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';

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

  @Input() epubFileName?: String;

  public tocMenuOpen: boolean;
  public searchMenuOpen: boolean;

  constructor( private userSettingsService: UserSettingsService ) {
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
      this.rendition = this.book.renderTo(area,   { width: '70%', height: vh, spread: 'always' });
    } else {
      this.rendition = this.book.renderTo(area,   { width: '100%', height: vh, spread: 'always' });
    }
    const __this = this;
    this.rendition.on('resized', function(size) {
      __this.rendition.resize(size.width, size.height);
    });

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
  }

  doSearch(q): Promise<any> {
    const search = String(this.searchText);
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

  nextSearch(forward?: boolean) {
    if ( forward === undefined && this.searchResultIndex !== 0 ) {
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
    if ( forward === true && this.searchResultIndex < (this.searchResults.length - 1) ) {
      this.searchResultIndex++;
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
}
