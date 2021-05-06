import { Component, ElementRef } from '@angular/core';
import  Epub,{ NavItem, Rendition }  from 'epubjs';
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

  public tocMenuOpen: boolean;

  constructor() {
    this.tocMenuOpen = false;
    this.loading = true;
  }

  ngAfterViewInit() {
    this.book = Epub('../assets/books/2685.epub');
    this.rendition = this.book.renderTo('area',  { flow: "paginated", width: "900", height: "600" });
    this.displayed = this.rendition.display();
    this.createTOC();
  }

  createTOC() {
    const _this = this
    this.book.loaded.navigation.then(
      function( toc ) {
			  const tocDiv = <HTMLDivElement>document.getElementById('toc_text');
        const tocUl = document.createElement('ul');
        const docfrag = <DocumentFragment>document.createDocumentFragment();
        toc.forEach( (chapter: NavItem) => {
          // Adds TOC elements recursively to div
          docfrag.appendChild(_this.createTocElement(chapter));
          return null;
        })
        tocUl.appendChild(docfrag);
        tocDiv.appendChild(tocUl);
		});
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

  ngOnDestroy() {
    this.book.destroy();
  }

  next() {
    console.log('next');
    this.rendition.next();
    // this.book.navigation.toc;
  }

  prev() {
    console.log('prev');
    this.rendition.prev();
    // this.book.navigation.toc;
  }
}
