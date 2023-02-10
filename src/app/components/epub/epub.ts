import { Component, Input, NgZone, Renderer2 } from '@angular/core';
import {} from 'fs';
import { Subscription } from 'rxjs';
import { ModalController, PopoverController } from '@ionic/angular';
import { Fontsize, ReadPopoverService } from 'src/app/services/settings/read-popover.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { MdContentService } from 'src/app/services/md/md-content.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { ReferenceDataModalPage } from 'src/app/modals/reference-data-modal/reference-data-modal';
import { ReadPopoverPage } from 'src/app/modals/read-popover/read-popover';

declare var ePub: any;

export class Book {
  label?: string;
  file?: string;
}

@Component({
  selector: 'epub',
  templateUrl: 'epub.html',
  styleUrls: ['epub.scss']
})
export class EpubComponent {

  text?: string;
  book: any;
  rendition: any;
  displayed: any;
  loading: boolean;
  searchText?: string;
  searchResults: any[];
  searchResultIndex: number;
  currentHighlight: any;
  fontsize: Fontsize;
  splitPaneObserver: any;
  splitPaneVisible: boolean;
  epubCreators: string[];
  epubContributors: string[];
  epubTitle: string;
  epubCoverImageBlob: Blob | null;
  currentLocationCfi: any;
  previousLocationCfi: any;
  atStart: boolean;
  atEnd: boolean;
  currentPositionPercentage: string;
  currentSectionLabel: string;
  fontsizeSubscription: Subscription | null;
  windowResizeTimeoutId: any;
  handleWindowResize: any;
  epubFileExists: boolean;
  appName?: string;

  @Input() epubFileName?: string;

  public tocMenuOpen: boolean;
  public searchMenuOpen: boolean;

  public availableEpubs?: any;
  public downloadURL: any;

  public showURNButton: boolean;
  showDisplayOptionsButton: Boolean = true;

  private unlistenKeyDownEvents?: () => void;

  constructor( public userSettingsService: UserSettingsService,
    public mdContentService: MdContentService,
    protected popoverCtrl: PopoverController,
    private modalController: ModalController,
    public readPopoverService: ReadPopoverService,
    private renderer2: Renderer2,
    private ngZone: NgZone,
    private config: ConfigService,
    public commonFunctions: CommonFunctionsService,
    private languageService: LanguageService,
  ) {
    this.tocMenuOpen = false;
    this.searchMenuOpen = false;
    this.loading = true;
    this.searchResults = [];
    this.searchResultIndex = 0;
    this.splitPaneObserver = null;
    this.splitPaneVisible = false;
    this.fontsize = this.readPopoverService.fontsize;
    this.epubCreators = [];
    this.epubContributors = [];
    this.epubTitle = '';
    this.epubCoverImageBlob = null;
    this.currentLocationCfi = '';
    this.previousLocationCfi = '';
    this.atStart = true;
    this.atEnd = false;
    this.currentPositionPercentage = '0 %';
    this.currentSectionLabel = '';
    this.fontsizeSubscription = null;
    this.windowResizeTimeoutId = null;
    this.handleWindowResize = null;
    this.epubFileExists = true;

    try {
      this.showURNButton = this.config.getSettings('showURNButton.pageEpub') as any;
    } catch (e) {
      this.showURNButton = false;
    }

    try {
      this.showDisplayOptionsButton = this.config.getSettings('showDisplayOptionsButton.pageEpub') as any;
    } catch (e) {
      this.showDisplayOptionsButton = true;
    }

    this.languageService.getLanguage().subscribe((lang: string) => {
      this.appName = this.config.getSettings('app.name.' + lang);
    });
  }

  ngOnInit() {
    this.subscribeToReadPopoverFontsizeChanges();
  }

  ngOnDestroy() {
    if (this.splitPaneObserver !== null && this.splitPaneObserver !== undefined) {
      this.splitPaneObserver.disconnect();
    }
    if (this.fontsizeSubscription !== null && this.fontsizeSubscription !== undefined) {
      this.fontsizeSubscription.unsubscribe();
    }
    if (this.unlistenKeyDownEvents !== undefined) {
      this.unlistenKeyDownEvents();
    }
    if (this.handleWindowResize !== null && this.handleWindowResize !== undefined) {
      window.removeEventListener('resize', this.handleWindowResize);
    }
    if (this.book !== undefined) {
      this.book.destroy();
    }
  }

  ngAfterViewInit() {
    const epubFilePath = '/assets/books/' + this.epubFileName;
    this.commonFunctions.urlExists(epubFilePath).then((res) => {
      if (res > 0) {
        this.loadEpub('..' + epubFilePath);
      } else {
        this.epubFileExists = false;
        this.loading = false;
      }
    });
  }

  loadEpub(epubFilePath: string) {
    this.ngZone.runOutsideAngular(() => {
      console.log('Loading epub from ', epubFilePath);
      this.book = ePub(epubFilePath);
      /*
        Get the dimensions of the epub rendering area. Adjust the size of the rendering
        to even numbers (helps rendering of spreads).
      */
      const area = document.getElementById('area');
      let areaWidth = Math.floor(area?.getBoundingClientRect().width || 1);
      let areaHeight = Math.floor(area?.getBoundingClientRect().height || 1);
      if (!this.commonFunctions.numberIsEven(areaWidth)) {
        areaWidth = areaWidth - 1;
      }
      if (!this.commonFunctions.numberIsEven(areaHeight)) {
        areaHeight = areaHeight - 1;
      }

      this.rendition = this.book.renderTo(area, { width: areaWidth, height: areaHeight, spread: 'auto' });

      /*
        Register epub themes for switching font size and setting font family to browser default serif for the
        search to highlight matches correctly.
      */
      this.rendition.themes.register('fontsize_0', { 'body': { 'font-size': '1em' },
        'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('fontsize_1', { 'body': { 'font-size': '1.0625em' },
        'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('fontsize_2', { 'body': { 'font-size': '1.125em' },
        'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('fontsize_3', { 'body': { 'font-size': '1.1875em' },
        'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('fontsize_4', { 'body': { 'font-size': '1.3125em' },
        'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('search_fontsize_0', { '*': { 'font-family': 'serif !important' },
        'body': { 'font-size': '1em' }, 'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('search_fontsize_1', { '*': { 'font-family': 'serif !important' },
        'body': { 'font-size': '1.0625em' }, 'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('search_fontsize_2', { '*': { 'font-family': 'serif !important' },
        'body': { 'font-size': '1.125em' }, 'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('search_fontsize_3', { '*': { 'font-family': 'serif !important' },
        'body': { 'font-size': '1.1875em' }, 'img': { 'max-width': '100% !important;' } });
      this.rendition.themes.register('search_fontsize_4', { '*': { 'font-family': 'serif !important' },
        'body': { 'font-size': '1.3125em' }, 'img': { 'max-width': '100% !important;' } });

      this.rendition.themes.select('fontsize_' + this.fontsize);

      this.displayed = this.rendition.display();

      this.book.ready.then( () => {
        // Remove loading spinner with a delay
        setTimeout(() => {
          this.ngZone.run(() => {
            this.loading = false;
          });
        }, 1000);

        /*
          Get epub title, creator(s), contributor(s) and cover image (as a blob) from the epub.
          Since the metadata object provided by the epub.js library doesn't support multiple
          creators or contributors we have to get those directly from the epub package document.
        */
        this.epubTitle = this.book.package.metadata.title;

        let opfFilePath = String(this.book.container.packagePath);
        if (!opfFilePath.startsWith('/')) {
          opfFilePath = '/' + opfFilePath;
        }

        this.book.archive.getText(opfFilePath).then((res: any) => {
          try {
            if (res !== undefined && res !== null) {
              const parser = new DOMParser();
              const opf = parser.parseFromString(res, 'text/xml');
              const creatorElements = opf.getElementsByTagName('dc:creator');
              for (let i = 0; i < creatorElements.length; i++) {
                if (creatorElements && creatorElements.item(i)?.textContent) {
                  const text = creatorElements.item(i)?.textContent;
                  if (text) {
                    this.epubCreators.push(text);
                  }
                }
              }
              const contributorElements = opf.getElementsByTagName('dc:contributor');
              for (let i = 0; i < contributorElements.length; i++) {
                if (creatorElements && contributorElements.item(i)?.textContent) {
                  const text = contributorElements.item(i)?.textContent;
                  if (text) {
                    this.epubContributors.push(text);
                  }
                }
              }
            }
          } catch {}
        });

        this.book.archive.getBlob(this.book.cover).then((res: any) => {
          try {
            this.epubCoverImageBlob = res;
          } catch (e) {
            this.epubCoverImageBlob = null;
          }
          // Generate table of contents view
          this.ngZone.run(() => {
            this.createTOC();
          });
        });

        // Generate locations for calculating percentage positions throughout the book
        this.book.locations.generate();
      });

      // Event fired when current location (i.e. page or spread) in book changes
      this.rendition.on('relocated', (location: any) => {
        this.ngZone.run(() => {

          // Store current cfi location in book and check if at start or end of book
          this.previousLocationCfi = this.currentLocationCfi;
          this.currentLocationCfi = location.start.cfi;
          if (location.atStart) {
            this.atStart = true;
          } else {
            this.atStart = false;
          }
          if (location.atEnd) {
            this.atEnd = true;
          } else {
            this.atEnd = false;
          }

          // Get the current position in the book as a percentage with one decimal
          if (this.atStart) {
            this.currentPositionPercentage = '0.0 %';
          } else if (this.atEnd) {
            this.currentPositionPercentage = '100.0 %';
          } else {
            this.currentPositionPercentage = (parseFloat(this.book.locations.percentageFromCfi(this.currentLocationCfi)) * 100).toFixed(1)
            + ' %';
          }
        });

        // Get the label of the current section from the epub
        const getNavItemByHref = (href: any) => (function flatten(arr) {
          return [].concat(...arr.map((v: any) => [v, ...flatten(v.subitems)]));
        })(this.book.navigation.toc).filter(
            (item: any) => this.book.canonical(item.href.split('#')[0]) === this.book.canonical(href)
        )[0] || null;

        const navItemHref = getNavItemByHref(this.rendition.currentLocation().start.href) as any;

        this.ngZone.run(() => {
          if (navItemHref !== null && navItemHref !== undefined) {
            this.currentSectionLabel = navItemHref.label;
          } else {
            this.currentSectionLabel = '';
          }
          if (this.currentSectionLabel === null || this.currentSectionLabel === undefined) {
            this.currentSectionLabel = '';
          }
        });
      });

      this.setUpInputListeners();

      this.setUpDOMMutationObservers();

      this.setUpWindowResizeListener();

    }); // End of runOutsideAngular

    try {
      this.availableEpubs = this.config.getSettings('AvailableEpubs') as any;
      for ( const epub in this.availableEpubs ) {
        if ( this.availableEpubs[epub]['filename'] === this.epubFileName ) {
          this.downloadURL = this.availableEpubs[epub]['download'];
        }
      }
    } catch (e) {
      this.availableEpubs = [];
    }
  }

  doSearch(q: any): Promise<any> | void {
    const search = String(this.searchText);
    if ( search.length > 0 ) {
      const _book = this.book;
      this.searchResultIndex = 0;
      this.searchResults = [];
      return Promise.all(
        _book.spine.spineItems.map((item: any) =>
          item
          .load(_book.load.bind(_book))
          .then(item.find.bind(item, search))
        )
      ).then(results =>
        Promise.resolve(
          this.searchResults = [].concat.apply([], results)
        ).then( () => {
          // console.log(this.searchResults);
          this.nextSearch(true);
          }
        )
      );
    }
  };

  applyHighlight(cfiRange: any) {
    // Apply a class to selected text
    if ( this.currentHighlight !== undefined ) {
      this.rendition.annotations.remove(this.currentHighlight, 'highlight');
    }
    this.rendition.annotations.highlight(cfiRange);
    this.currentHighlight = cfiRange;
  }

  nextSearch( first?: boolean ) {
    if ( this.searchResultIndex < (this.searchResults.length - 1) && first === undefined ) {
      this.searchResultIndex++;
    }
    if ( this.searchResults !== undefined ) {
      const res = this.searchResults[this.searchResultIndex];
      // console.log(res);
      if ( res !== undefined && res.cfi !== undefined ) {
        const url = res.cfi;
        if ( url !== undefined ) {
          this.rendition.display(url).then( () => {
            this.applyHighlight(url);
          });
        }
      }
    }
  }

  prevSearch() {
    if ( this.searchResultIndex !== 0 ) {
      this.searchResultIndex--;
    }
    if ( this.searchResults !== undefined ) {
      const res = this.searchResults[this.searchResultIndex];
      if ( res !== undefined && res.cfi !== undefined ) {
        const url = res.cfi;
        if ( url !== undefined ) {
          this.rendition.display(url).then( () => {
            this.applyHighlight(url);
          });
        }
      }
    }
  }

  clearSearch() {
    if ( this.currentHighlight !== undefined ) {
      this.rendition.annotations.remove(this.currentHighlight, 'highlight');
    }
    this.searchText = '';
    this.searchResultIndex = 0;
    this.searchResults = [];
  }

  createTOC() {
    const _this = this;
    this.book.loaded.navigation.then(
      function( toc: any ) {
        const tocDiv = <HTMLDivElement> document.getElementById('toc_text');
        const tocUl = document.createElement('ol');
        tocUl.className = 'topchapter';
        const docfrag = <DocumentFragment> document.createDocumentFragment();

        toc.forEach( (chapter: any) => {
          // Adds TOC elements recursively to div
          docfrag.appendChild(_this.createTocElement(chapter));
          return null;
        });
        tocUl.appendChild(docfrag);

        // Add cover, creator(s)/contributor(s) and title to TOC
        if (_this.epubCoverImageBlob !== null && _this.epubCoverImageBlob !== undefined) {
          const tocCoverImg = document.createElement('img');
          tocCoverImg.className = 'epub_cover';
          tocCoverImg.alt = 'cover';
          tocCoverImg.src = URL.createObjectURL(_this.epubCoverImageBlob);
          tocDiv.appendChild(tocCoverImg);
        }

        if (_this.epubCreators.length > 0) {
          const tocCreatorP = document.createElement('p');
          tocCreatorP.className = 'epub_creator';
          tocCreatorP.innerText = _this.commonFunctions.concatenateNames(_this.epubCreators, ',');
          tocDiv.appendChild(tocCreatorP);
        }

        // If no creators, use contributors instead
        if (_this.epubCreators.length < 1 && _this.epubContributors.length > 0) {
          const tocCreatorP = document.createElement('p');
          tocCreatorP.className = 'epub_creator';
          tocCreatorP.innerText = _this.commonFunctions.concatenateNames(_this.epubContributors, ',');
          tocDiv.appendChild(tocCreatorP);
        }

        if (_this.epubTitle) {
          const tocTitleP = document.createElement('p');
          tocTitleP.className = 'epub_title';
          tocTitleP.innerText = _this.epubTitle;
          tocDiv.appendChild(tocTitleP);
        }

        // Add horizontal ruler
        if (_this.epubCreators.length > 0 || _this.epubContributors.length > 0 || _this.epubTitle) {
          tocDiv.appendChild(document.createElement('hr'));
        }

        tocDiv.appendChild(tocUl);
      }
    );
  }

  // Recursive TOC creation
  createTocElement( chapter: any ): DocumentFragment {
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
      const subTocUl = document.createElement('ol');
      subTocUl.className = 'subchapters';
      chapter.subitems.forEach( (subChapter: any) => {
        subTocUl.appendChild(this.createTocElement(subChapter));
      });
      docfrag.appendChild(subTocUl);
    }
    return docfrag;
  }

  openChapter( url: any ) {
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
    let currentLocation = this.currentLocationCfi;
    if ( this.searchMenuOpen ) {
      this.searchMenuOpen = false;
      if (this.currentHighlight !== undefined && this.currentHighlight !== null) {
        currentLocation = this.currentHighlight;
      }
      this.clearSearch();
      this.rendition.themes.select('fontsize_' + this.fontsize);
      try {
        this.rendition.clear();
        this.rendition.start();
      } catch {}
      this.rendition.display(currentLocation);
    } else {
      this.searchMenuOpen = true;
      this.rendition.themes.select('search_fontsize_' + this.fontsize);
      this.rendition.display(currentLocation);
    }
  }

  next() {
    this.rendition.next();
  }

  prev() {
    this.rendition.prev();
  }

  async showReadSettingsPopover(myEvent: any) {
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
    const popover = await this.popoverCtrl.create({
      component: ReadPopoverPage,
      componentProps: {
        toggles,
      },
      cssClass: 'popover_settings'
    });
    popover.present(myEvent);
  }

  downloadEpub() {
    const ref = window.open(this.downloadURL, '_blank');
  }

  /**
   * Set up a DOM mutation observer for detecting when the left menu (ion-split-pane)
   * is opened and closed. Resize epub when this happens. This is necessary for the
   * epub to render correctly in mobile mode when the split pane is opened and closed.
   */
  setUpDOMMutationObservers() {
    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: false, subtree: false };

    // Check if split pane menu is visible
    if (document.querySelector('ion-split-pane.split-pane-visible') !== null) {
      this.splitPaneVisible = true;
    } else {
      this.splitPaneVisible = false;
    }

    // Select ion-split-pane element in order to observe for mutations
    const splitPaneElement = document.querySelector('top-menu + ion-split-pane');

    // Callback function to execute when mutations are observed
    const that = this;
    const callbackSplitPane = function(mutationsList: any, observer: any) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'class') {
            if ((mutation.target.className.includes('split-pane-visible') && !that.splitPaneVisible)
              || (!mutation.target.className.includes('split-pane-visible') && that.splitPaneVisible)) {
              that.splitPaneVisible = !that.splitPaneVisible;
              // Split pane has been either opened or closed --> resize epub
              that.resizeEpub();
            }
          }
        }
      }
    }.bind(this);

    // Create an observer instance linked to the callback function
    this.splitPaneObserver = new MutationObserver(callbackSplitPane);

    // Start observing the target node for configured mutations
    this.splitPaneObserver.observe(splitPaneElement, config);

  }

  /**
   * Get fontsize changes from the read popover service and update epub font size
   * when new size has been set.
   */
  subscribeToReadPopoverFontsizeChanges() {
    this.fontsizeSubscription = this.readPopoverService.fontsize$.subscribe(newFontsize => {
      if (newFontsize in Fontsize && newFontsize !== this.fontsize) {
        this.setEpubFontsize(newFontsize);
      }
    });
  }

  setEpubFontsize(fontsize: Fontsize) {
    const currentLocation = this.currentLocationCfi;
    if (this.searchMenuOpen) {
      this.rendition.themes.select('search_fontsize_' + fontsize);
    } else {
      this.rendition.themes.select('fontsize_' + fontsize);
    }
    this.fontsize = fontsize;
    try {
      this.rendition.clear();
      this.rendition.start();
    } catch {}
    this.rendition.display(currentLocation);
  }

  private setUpInputListeners() {
    /*
      1. Listen for keydown events inside the epub rendition. This is needed for prev/next on keydown
      to work after the user has clicked inside the epub iframe.
    */
    this.rendition.on('keydown', (event: any) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });

    /*
      2. Add touch event listeners to the epub content in order to enable swipe gestures for flipping page.
    */
    /**
      * ! SWIPE SUPPORT DISABLED for now. It works great until this.rendition.clear() and
      * ! this.rendition.start() have to be run, i.e. when changing epub theme and font size.
      * ! After that swiping turns multiple pages/spreads instead of one.
      */
    /*
    this.rendition.hooks.content.register((contents) => {
      const el = contents.document.documentElement;
      if (el) {
        let start: Touch;
        let end: Touch;

        // Define the minimum length of the horizontal touch action to be registered as a swipe.
        // This is a fraction between 0 and 1 and is relative to the epub's width.
        const horizontalTouchLengthThreshold = 0.12;

        el.addEventListener('touchstart', (event: TouchEvent) => {
          start = event.changedTouches[0];
        });

        el.addEventListener('touchend', (event: TouchEvent) => {
          end = event.changedTouches[0];
          const elBook = document.querySelector('div.toc-epub-container'); // Parent div, which contains div#area
          if (elBook) {
            const bound = elBook.getBoundingClientRect();
            const hr = (end.screenX - start.screenX) / bound.width;
            const vr = Math.abs((end.screenY - start.screenY) / bound.height);
            if (hr > horizontalTouchLengthThreshold && vr < 0.1) {
              return this.prev();
            }
            if (hr < -horizontalTouchLengthThreshold && vr < 0.1) {
              return this.next();
            }
          }
        });
      }
    });
    */

    /*
      3. We also need to listen on the whole document for next/prev in epub to work when the user has clicked
      somewhere outside the epub iframe.
    */
    this.unlistenKeyDownEvents = this.renderer2.listen('document', 'keydown', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
        case 'Enter':
          /*
            Move to next search match if 'enter' key pressed in epub search bar. Since we are
            listening on the whole document we need to make sure we catch the key stroke in
            the epub's search bar and not elsewhere.
          */
          if (event.target.className.includes('searchbar-input')) {
            if (event.target.parentElement !== null) {
              if (event.target.parentElement.parentElement !== null) {
                if (event.target.parentElement.parentElement.className.includes('epub-search-bar')) {
                  this.nextSearch();
                  break;
                }
              }
            }
          }
      }
    });
  }

  private setUpWindowResizeListener() {
    this.handleWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.handleWindowResize);
  }

  private onWindowResize() {
    const timeout = 300;
    // clear the timeout
    clearTimeout(this.windowResizeTimeoutId);
    // start timing for event "completion"
    this.windowResizeTimeoutId = setTimeout(() => {
      this.resizeEpub();
    }, timeout);
  }

  resizeEpub() {
    // Get the dimensions of the epub containing element, div#area, and round off to even integers
    const area = document.querySelector('.toc-epub-container > #area');
    let areaWidth = Math.floor(area?.getBoundingClientRect().width || 1);
    let areaHeight = Math.floor(area?.getBoundingClientRect().height || 1);
    if (!this.commonFunctions.numberIsEven(areaWidth)) {
      areaWidth = areaWidth - 1;
    }
    if (!this.commonFunctions.numberIsEven(areaHeight)) {
      areaHeight = areaHeight - 1;
    }
    // Resize the epub rendition with the area's dimensions
    try {
      this.rendition.resize(areaWidth, areaHeight);
    } catch {
      console.log('epub.js threw an error resizing the rendering area');
    }
  }

  public async showReference() {
    // Get URL of Page and then the URI
    const modal = await this.modalController.create({
      component: ReferenceDataModalPage,
      componentProps: {id: document.URL, type: 'reference', origin: 'page-epub'},
      cssClass: 'popover_settings'
    });
    modal.present();
  }
}
