import { Component } from '@angular/core';
import Epub, { NavItem, Rendition } from 'epubjs';
import book from 'epubjs/types/book';
import {} from 'fs';

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
  book: book;
  rendition: Rendition;
  displayed: any;
  loading: boolean;
  currentPageNumber: number;
  nextPageNumber: number;

  public tocMenuOpen: boolean;

  constructor() {
    this.tocMenuOpen = false;
    this.loading = true;
  }

  ngAfterViewInit() {
    this.book = Epub('../assets/books/2685.epub');
    // Get viewport width and height. Make it a bit smaller
    const vw = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) * 0.8;
    const vh = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0)) * 0.8;

    this.rendition = this.book.renderTo('area',  { manager: 'continuous', flow: 'paginated', width: vw, height: vh });
    this.displayed = this.rendition.display();
    this.book.ready.then( () => {
      this.loading = false;
      this.createTOC();
      this.setPageNumbers();
    });
  }

  createTOC() {
    const _this = this;
    this.book.loaded.navigation.then(
      function( toc ) {
        const tocDiv = <HTMLDivElement> document.getElementById('toc_text');
        const tocUl = document.createElement('ul');
        const docfrag = <DocumentFragment> document.createDocumentFragment();
        toc.forEach( (chapter: NavItem) => {
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
  createTocElement( chapter: NavItem ): DocumentFragment {
    const docfrag = <DocumentFragment>document.createDocumentFragment();
    const element = document.createElement('li');
    const link = document.createElement('a');
    const _this = this;
    link.textContent = chapter.label;
    link.setAttribute('href', chapter.href);
    // Make the TOC links clickable
    link.addEventListener('click', function( event ) {
      event.preventDefault();
      _this.openChapter(chapter.href);
    })
    element.appendChild(link);
    docfrag.appendChild(element);
    if ( chapter.subitems.length > 0 ) {
      const subTocUl = document.createElement('ul');
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

  setPageNumbers() {
    try {
      const _this = this;
      this.rendition.on('relocated', function(location) {
        _this.currentPageNumber = location.start.index;
        _this.nextPageNumber = location.end.index;
      });
    } catch (error) {
      console.log(error)
    }
  }

  ngOnDestroy() {
    this.book.destroy();
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
