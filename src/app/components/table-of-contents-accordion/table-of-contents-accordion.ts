import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, Platform } from '@ionic/angular';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InnerMenuOptionModel } from 'src/app/models/inner-menu-option.model';
import { MenuOptionModel } from 'src/app/models/menu-option.model';
import { SideMenuSettings } from 'src/app/models/side-menu-settings';
import { SideMenuRedirectEvent, SideMenuRedirectEventData } from 'src/app/models/sidemenu-redirect-events';
import { GeneralTocItem } from 'src/app/models/table-of-contents.model';
import { TocAccordionMenuOptionModel } from 'src/app/models/toc-accordion-menu-option.model';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { EventsService } from 'src/app/services/events/events.service';
import { LanguageService } from 'src/app/services/languages/language.service';
import { MetadataService } from 'src/app/services/metadata/metadata.service';
import { UserSettingsService } from 'src/app/services/settings/user-settings.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { TextService } from 'src/app/services/texts/text.service';
import { TableOfContentsService } from 'src/app/services/toc/table-of-contents.service';

@Component({
  selector: 'table-of-contents-accordion',
  templateUrl: 'table-of-contents-accordion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TableOfContentsAccordionComponent {
  // Main inputs
  public menuSettings?: SideMenuSettings;
  public menuOptions?: Array<TocAccordionMenuOptionModel>;
  public selectedOption?: InnerMenuOptionModel | null;
  public collapsableItems: Array<InnerMenuOptionModel> = [];

  @Input('options')
  set options(value: {
    toc?: Array<TocAccordionMenuOptionModel>,
    searchTocItem?: Boolean,
    searchPublicationId?: Number,
    searchItemId?: String,
    searchTitle?: String
  }) {
    // console.log('toc accordion options:', value);
    if (this.alphabethicOrderActive && this.sortableLetters.includes(this.collectionId)) {
      this.activeMenuTree = this.alphabeticalactiveMenuTree as any;
      this.textService.activeTocOrder = 'alphabetical';
    } else if (this.chronologicalOrderActive && this.sortableLetters.includes(this.collectionId)) {
      this.activeMenuTree = this.chronologicalactiveMenuTree;
      this.textService.activeTocOrder = 'chronological';
    } else {
      this.textService.activeTocOrder = 'thematic';
      if (value && value.toc && value.toc.length > 0) {
        if (value.searchTocItem !== undefined && value.searchTocItem === true) {
          this.searchingForTocItem = true;
        }
        this.menuOptions = value.toc;
        this.collapsableItems = new Array<InnerMenuOptionModel>();

        let foundSelected = false;
        // Map the options to our internal models
        this.menuOptions.forEach(option => {
          const innerMenuOption = InnerMenuOptionModel.fromMenuOptionModel(option, null, false, value.searchTocItem);
          // console.log(innerMenuOption);
          if ( this.collapsableItems.indexOf(innerMenuOption) === -1 ) {
            this.collapsableItems.push(innerMenuOption);
          }

          // Check if there's any option marked as selected
          if (option.selected) {
            this.selectedOption = innerMenuOption;
            foundSelected = true;
          } else if (innerMenuOption.childrenCount) {
            innerMenuOption.subOptions?.forEach(subItem => {
              if (subItem.selected) {
                this.selectedOption = subItem;
                foundSelected = true;
              }
            });
          }
        });

        if ( !foundSelected ) {
        } else {
          console.log('accordion toc options input: found menu item');
        }

        if (value.searchTocItem !== undefined && value.searchTocItem) {
          // Find toc item and open its parents
          if (value.searchItemId) {
            value.searchItemId = String(value.searchItemId).replace('_nochapter', '').replace(':chapterID', '').replace('%3AchapterID', '');
            // Try to find the correct position in the TOC. If not found, try to find the nearest.
            if ( this.findTocByPubOnly(this.collapsableItems, value.searchItemId) === false ) {
              // try to find without position
              value.searchItemId = String(value.searchItemId).split(';')[0];
              if (this.findTocByPubOnly(this.collapsableItems, value.searchItemId) === false
              && value.searchItemId.split('_').length > 2) {
                // try to find without chapter if any
                value.searchItemId = String(value.searchItemId).slice(0, String(value.searchItemId).lastIndexOf('_'));
                this.findTocByPubOnly(this.collapsableItems, value.searchItemId);
              }
            }
            this.events.publishTypesAccordionChange({expand: true});
          } else if (value.searchPublicationId && value.searchTitle) {
            this.findTocByPubAndTitle(this.collapsableItems, value.searchPublicationId, value.searchTitle);
            this.events.publishTypesAccordionChange({expand: true});
          }

          if (this.foundTocItem) {
            // Empty children in all other branches in this toc tree for faster rendering
            // If collapsable item is important, it's only showing necessary parents and children for current toc item
            for (let i = 0; i < this.collapsableItems.length; i++) {
              if (!this.collapsableItems[i].important) {
                const innerMenuOptionWithoutChildren = InnerMenuOptionModel.fromMenuOptionModel(this.menuOptions[i], null, false, false);
                this.collapsableItems[i] = innerMenuOptionWithoutChildren;
              }
            }
            // console.log('collapsable items', this.collapsableItems);
          }

        }
        this.searchingForTocItem = false;
      }
      this.activeMenuTree = this.collapsableItems;
    }
  }

  @Input('settings')
  set settings(value: SideMenuSettings) {
    if (value) {
      this.menuSettings = value;
      this.mergeSettings();
    }
  }

  @Input() collectionId?: string;
  @Input() collectionName?: string;
  @Input() showBackButton?: Boolean;
  @Input() isMarkdown?: Boolean;
  @Input() defaultSelectedItem?: String;
  @Input() isGallery?: Boolean;
  @Input() open?: Boolean;
  @Output() selectOption = new EventEmitter<any>();

  // All children will be stored here in order to reduce lag
  // They will be used everytime a parent is toggled in toggleItemOptions
  childrenToc = {} as any;
  searchChildrenToc = {} as any;
  // childrenTocIdCounter = 1;

  currentItem?: any;
  currentOption: any;
  searchingForTocItem = false;
  searchTocItemInAccordionByTitle = false;
  tocItemSearchChildrenCounter = 0;
  foundTocItem = false;
  selectedTocItem?: InnerMenuOptionModel;
  foundSelectedTocItem = false;
  coverSelected?: boolean;
  titleSelected?: boolean;
  forewordSelected?: boolean;
  introductionSelected?: boolean;
  root: any;
  hasCover?: boolean;
  hasTitle?: boolean;
  hasForeword?: boolean;
  hasIntro?: boolean;
  playmanTraditionPageInMusicAccordion = false;
  playmanTraditionPageID = '03-03';

  chronologicalOrderActive?: boolean;
  thematicOrderActive = true;
  alphabethicOrderActive?: boolean;

  visibleactiveMenuTree = [];
  visibleTitleStack = [];

  chronologicalactiveMenuTree = [] as any;
  alphabeticalactiveMenuTree?: any[];

  activeMenuTree = [] as any;

  sortableLetters = [] as any;
  sortSelectOptions: Record<string, any> = {};

  constructor(
    public platform: Platform,
    public events: EventsService,
    public cdRef: ChangeDetectorRef,
    protected storage: StorageService,
    public loadingCtrl: LoadingController,
    public config: ConfigService,
    public languageService: LanguageService,
    public userSettingsService: UserSettingsService,
    public translate: TranslateService,
    public metadataService: MetadataService,
    protected textService: TextService,
    public tocService: TableOfContentsService,
    public commonFunctions: CommonFunctionsService,
    private ngZone: NgZone,
    private router: Router,
  ) {
  }

  constructAlphabeticalTOC(data: any) {
    this.alphabeticalactiveMenuTree = [];
    const itemArray = [];
    const list = this.flattenList(data.tocItems);

    for (const child of list) {
      if (child.type === 'est' && child.itemId) {
        itemArray.push(child);
      }
    }

    itemArray.sort(
      (a, b) =>
        (a.text !== undefined && b.text !== undefined) ?
          ((String(a.text).toUpperCase() < String(b.text).toUpperCase()) ? -1 :
          (String(a.text).toUpperCase() > String(b.text).toUpperCase()) ? 1 : 0) : 0
    );

    this.alphabeticalactiveMenuTree = new Array<InnerMenuOptionModel>();

    // Map the options to our internal models
    itemArray.forEach(option => {
      const innerMenuOption = InnerMenuOptionModel.fromMenuOptionModel(option, null, false, false);
      if ( this.alphabeticalactiveMenuTree?.indexOf(innerMenuOption) === -1 ) {
        this.alphabeticalactiveMenuTree.push(innerMenuOption);
      }

      // Check if there's any option marked as selected
      if (option.selected) {
        option.selected = false;
      } else if (innerMenuOption.childrenCount) {
        innerMenuOption.subOptions?.forEach(subItem => {
          if (subItem.selected) {
            subItem.selected = false;
          }
        });
      }
    });

    if (data['collectionID']) {
      this.storage.set('toc_alphabetical_' + data['collectionID'], this.alphabeticalactiveMenuTree);
    }
  }

  constructChronologicalTOC(data: any) {
    this.chronologicalactiveMenuTree = [];

    const list = this.flattenList(data.tocItems);

    for (const child of list) {
      if (child.date && child.type === 'est' && child.itemId) {
        this.chronologicalactiveMenuTree.push(child);
      }
    }

    this.chronologicalactiveMenuTree.sort((a: any, b: any) => (a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0);
    let prevYear = '';

    const itemArray = [] as any;
    let childItems = [];
    for ( let i = 0; i < this.chronologicalactiveMenuTree.length; i++) {
      const item = this.chronologicalactiveMenuTree[i];
      const currentYear = String(item['date']).slice(0, 4);
      if ( prevYear === '' ) {
        prevYear = currentYear;
        itemArray.push({type: 'subtitle', collapsed: true, text: prevYear, children: []});
      }

      if ( prevYear !==  currentYear ) {
        itemArray[itemArray.length - 1].children = childItems;
        itemArray[itemArray.length - 1].childrenCount = true;
        childItems = [];
        prevYear = currentYear;
        itemArray.push({type: 'subtitle', collapsed: true, text: prevYear});
      }
      childItems.push(this.chronologicalactiveMenuTree[i]);
    }
    if ( itemArray.length > 0 ) {
      itemArray[itemArray.length - 1].children = childItems;
      itemArray[itemArray.length - 1].childrenCount = true;
    } else {
      itemArray[0] = {};
      itemArray[0].children = childItems;
      itemArray[0].childrenCount = true;
    }

    this.chronologicalactiveMenuTree = new Array<InnerMenuOptionModel>();

    // Map the options to our internal models
    itemArray.forEach((option: any) => {
      const innerMenuOption = InnerMenuOptionModel.fromMenuOptionModel(option, null, false, false);
      if ( this.chronologicalactiveMenuTree.indexOf(innerMenuOption) === -1 ) {
        this.chronologicalactiveMenuTree.push(innerMenuOption);
      }

      // Check if there's any option marked as selected
      if (option.selected) {
        option.selected = false;
      } else if (innerMenuOption.childrenCount) {
        innerMenuOption.subOptions?.forEach(subItem => {
          if (subItem.selected) {
            subItem.selected = false;
          }
        });
      }
    });

    if (data['collectionID']) {
      this.storage.set('toc_chronological_' + data['collectionID'], this.chronologicalactiveMenuTree);
    }
  }

  flattenList(data: any) {
    data.childrenCount = 0;
    let list = [data];
    if (!data.children) {
      return list;
    }
    for (const child of data.children) {
      list = list.concat(this.flattenList(child));
    }
    return list;
  }

  setActiveSortingType(type: any) {
    if (type === 'alphabetical') {
      this.textService.activeTocOrder = 'alphabetical';
      this.alphabethicOrderActive = true;
      this.chronologicalOrderActive = false;
      this.thematicOrderActive = false;
      this.storage.get('toc_alphabetical_' + this.collectionId).then((storageToc) => {
        if ( (storageToc === null || storageToc === undefined) && this.collectionId ) {
          this.tocService.getTableOfContents(this.collectionId).subscribe(
            toc => {
              const data = {
                collectionID: this.collectionId,
                tocItems: toc
              };
              this.constructAlphabeticalTOC(data);
              if (this.currentOption && this.currentOption.itemId) {
                this.unSelectAllItems(this.alphabeticalactiveMenuTree);
                this.selectOneItem(this.currentOption.itemId, this.alphabeticalactiveMenuTree);
              }
              this.activeMenuTree = this.alphabeticalactiveMenuTree;
              this.cdRef.detectChanges();
              this.events.publishTocActiveSorting(type);
            }
          );
        } else {
          this.alphabeticalactiveMenuTree = storageToc;
          if (this.currentOption && this.currentOption.itemId) {
            this.unSelectAllItems(this.alphabeticalactiveMenuTree);
            this.selectOneItem(this.currentOption.itemId, this.alphabeticalactiveMenuTree);
          }
          this.activeMenuTree = this.alphabeticalactiveMenuTree;
          this.cdRef.detectChanges();
          this.events.publishTocActiveSorting(type);
        }
      });
    } else if (type === 'chronological') {
      this.textService.activeTocOrder = 'chronological';
      this.alphabethicOrderActive = false;
      this.chronologicalOrderActive = true;
      this.thematicOrderActive = false;
      this.storage.get('toc_chronological_' + this.collectionId).then((storageToc) => {
        if ( (storageToc === null || storageToc === undefined) && this.collectionId ) {
          this.tocService.getTableOfContents(this.collectionId).subscribe(
            toc => {
              const data = {
                collectionID: this.collectionId,
                tocItems: toc
              };
              this.constructChronologicalTOC(data);
              if (this.currentOption && this.currentOption.itemId) {
                this.unSelectAllItems(this.chronologicalactiveMenuTree);
                this.selectOneItem(this.currentOption.itemId, this.chronologicalactiveMenuTree);
              }
              this.activeMenuTree = this.chronologicalactiveMenuTree;
              this.cdRef.detectChanges();
              this.events.publishTocActiveSorting(type);
            }
          );
        } else {
          this.chronologicalactiveMenuTree = storageToc;
          if (this.currentOption && this.currentOption.itemId) {
            this.unSelectAllItems(this.chronologicalactiveMenuTree);
            this.selectOneItem(this.currentOption.itemId, this.chronologicalactiveMenuTree);
          }
          this.activeMenuTree = this.chronologicalactiveMenuTree;
          this.cdRef.detectChanges();
          this.events.publishTocActiveSorting(type);
        }
      });
    } else {
      this.textService.activeTocOrder = 'thematic';
      this.alphabethicOrderActive = false;
      this.chronologicalOrderActive = false;
      this.thematicOrderActive = true;
      if (this.currentOption && this.currentOption.itemId) {
        this.unSelectAllItems(this.collapsableItems);
        this.selectOneItem(this.currentOption.itemId, this.collapsableItems);
      }
      this.activeMenuTree = this.collapsableItems;
      this.cdRef.detectChanges();
      this.events.publishTocActiveSorting('thematic');
    }
    const that = this;
    this.ngZone.runOutsideAngular(() => {
      setTimeout(function () {
        try {
          if (that.currentOption && that.currentOption.itemId) {
            const itemId = 'toc_' + that.currentOption.itemId;
            let foundElem = document.getElementById(itemId);
            if (foundElem === null) {
              // Scroll to toc item without position
              foundElem = document.getElementById((itemId.split(';').shift() || ''));
            }
            if (foundElem) {
              that.commonFunctions.scrollElementIntoView(foundElem);
            }
          }
        } catch (e) {
          console.log(e);
        }
      }.bind(this), 1000);
    });
  }

  ngOnChanges(about: any) {
    if ( Array.isArray(about) && (this.isMarkdown || this.isGallery) ) {
      // console.log('toc-accordion ngOnChanges initialized', about);
      this.menuOptions = about;
      this.collapsableItems = new Array<InnerMenuOptionModel>();
      this.activeMenuTree = [];

      // Map the options to our internal models
      this.menuOptions.forEach(option => {
        let innerMenuOption = InnerMenuOptionModel.fromMenuOptionModel(option, null, false, false);
        // Check if there's any option marked as selected
        if (option.selected !== undefined && option.selected === true) {
          this.selectedOption = innerMenuOption;
        } else if (innerMenuOption.childrenCount) {
          innerMenuOption.subOptions?.forEach(subItem => {
            if (subItem.selected) {
              this.selectedOption = subItem;
            }
          });
        }
        // In some cases, like when opening a markdown page from the home page, the selected page is not
        // marked as selected and it's parents are collapsed since ngOnChanges refreshes the toc with
        // default values. That's why we have to run this recursive search for selected markdown menu options
        if (this.currentOption && this.currentOption.markdownID) {
          innerMenuOption = this.searchInnerMenuForSelectedMarkdownOption(innerMenuOption);
        }

        if ( this.collapsableItems.indexOf(innerMenuOption) === -1 ) {
          this.collapsableItems.push(innerMenuOption);
        }
      });

      this.activeMenuTree = this.collapsableItems;
      this.cdRef.detectChanges();
    }

    if ( this.titleSelected === false && this.coverSelected === false
    && this.introductionSelected === false && this.forewordSelected === false ) {
      if ( this.hasCover && this.defaultSelectedItem === 'cover' ) {
        this.coverSelected = true;
      } else if ( this.hasTitle && this.defaultSelectedItem === 'title' ) {
        this.titleSelected = true;
      } else if ( this.hasForeword && this.defaultSelectedItem === 'foreword' ) {
        this.forewordSelected = true;
      } else if ( this.hasIntro && this.defaultSelectedItem === 'introduction' ) {
        this.introductionSelected = true;
      }
    }

    if (this.alphabethicOrderActive && this.sortableLetters.includes(this.collectionId)) {
      this.textService.activeTocOrder = 'alphabetical';
    } else if (this.chronologicalOrderActive && this.sortableLetters.includes(this.collectionId)) {
      this.textService.activeTocOrder = 'chronological';
    } else {
      this.textService.activeTocOrder = 'thematic';
    }
    // console.log('ngOnChanges this.activeMenuTree', this.activeMenuTree);
  }

  ngOnInit() {
    // console.log('toc-accordion ngOnInit initialized');

    let language = 'sv';
    this.languageService.getLanguage().subscribe((lang: string) => {
      language = lang;
    });
    this.playmanTraditionPageID = `${language}-${this.playmanTraditionPageID}`;

    this.setConfigs();

    this.translate.get('TOC.SortOptions.SortTOC').subscribe(
      translation => {
        this.sortSelectOptions = {
          title: translation,
          cssClass: 'select-text-alert'
        };
      }, error => { }
    );

    this.coverSelected = false;
    this.titleSelected = false;
    this.forewordSelected = false;
    this.introductionSelected = false;

    const currentPage = String(window.location.href);
    if ( this.hasCover && currentPage.includes('/publication-cover/') ) {
      this.coverSelected = true;
    } else if ( this.hasTitle && currentPage.includes('/publication-title/') ) {
      this.titleSelected = true;
    } else if ( this.hasForeword && currentPage.includes('/publication-foreword/') ) {
      this.forewordSelected = true;
    } else if ( this.hasIntro && currentPage.includes('/publication-introduction/') ) {
      this.introductionSelected = true;
    }

    this.registerEventListeners();
    this.cdRef.detectChanges();
  }

  setConfigs() {
    try {
      this.searchTocItemInAccordionByTitle = this.config.getSettings('SearchTocItemInAccordionByTitle') as any;
    } catch (e) {
      this.searchTocItemInAccordionByTitle = false;
    }

    try {
      this.playmanTraditionPageInMusicAccordion = this.config.getSettings('MusicAccordionShow.PlaymanTraditionPage') as any;
    } catch (e) {
      this.playmanTraditionPageInMusicAccordion = false;
    }

    try {
      this.sortableLetters = this.config.getSettings('settings.sortableLetters');
    } catch (e) {
      this.sortableLetters = [];
    }

    try {
      this.hasCover = this.config.getSettings('HasCover') as any;
    } catch (e) {
      this.hasCover = false;
    }

    try {
      this.hasTitle = this.config.getSettings('HasTitle') as any;
    } catch (e) {
      this.hasTitle = false;
    }

    try {
      this.hasForeword = this.config.getSettings('HasForeword') as any;
    } catch (e) {
      this.hasForeword = false;
    }

    try {
      this.hasIntro = this.config.getSettings('HasIntro') as any;
    } catch (e) {
      this.hasIntro = false;
    }
  }

  registerEventListeners() {
    this.events.getTableOfContentsLoaded().subscribe((data: any) => {
      if (this.sortableLetters.includes(this.collectionId)) {
        this.storage.get('toc_alphabetical_' + data['collectionID']).then((toc) => {
          if ( toc === null || toc === undefined ) {
            this.constructAlphabeticalTOC(data);
          } else {
            this.alphabeticalactiveMenuTree = toc;
          }
        });
        this.storage.get('toc_chronological_' + data['collectionID']).then((toc) => {
          if ( toc === null || toc === undefined ) {
            this.constructChronologicalTOC(data);
          } else {
            this.chronologicalactiveMenuTree = toc;
          }
        });
      }
    });

    this.events.getSidemenuRedirect().subscribe((data: SideMenuRedirectEventData) => {
      // console.log('toc: updating selected option');
      this.updateSelectedOption(data);
    });

    this.events.getSelectedItemInMenu().subscribe((menu: any) => {
      // console.log('this.collectionId', this.collectionId);
      // console.log('menu.menuID', menu.menuID);
      if ( this.collectionId === undefined || this.collectionId === null ) {
        this.collectionId = menu.menuID;
      }
      // console.log('selectedItemInMenu', menu);
      // console.log('this.currentOption', this.currentOption);
      if (this.collectionId !== menu.menuID && this.currentOption && this.collectionId !== 'mediaCollections') {
        this.currentOption.selected = false;
        this.currentOption = null;
      } else {
        // console.log('event: SelectedItemInMenu; this.collectionId', this.collectionId);
        if (menu && menu.component) {
          if (menu.component === 'cover-page') {
            this.coverSelected = true;
            this.titleSelected = false;
            this.forewordSelected = false;
            this.introductionSelected = false;
          } else if (menu.component === 'title-page') {
            this.coverSelected = false;
            this.titleSelected = true;
            this.forewordSelected = false;
            this.introductionSelected = false;
          } else if (menu.component === 'foreword-page') {
            this.coverSelected = false;
            this.titleSelected = false;
            this.forewordSelected = true;
            this.introductionSelected = false;
          } else if (menu.component === 'introduction') {
            this.coverSelected = false;
            this.titleSelected = false;
            this.forewordSelected = false;
            this.introductionSelected = true;
          } else if (menu.component === 'media-collections' || menu.component === 'media-collection') {
            this.coverSelected = false;
            this.titleSelected = false;
            this.forewordSelected = false;
            this.introductionSelected = false;
            this.collapsableItems.forEach(element => {
              if (element.targetOption && element.targetOption?.id === menu.menuID) {
                element.targetOption.selected = true;
                element.selected = true;
              }
            });
          }
        }
      }
      this.cdRef.detectChanges();
    });

    this.events.getSelectOneItem().subscribe((itemId: any) => {
      if (this.currentOption) {
        this.currentOption.selected = false;
      }

      this.coverSelected = false;
      this.titleSelected = false;
      this.forewordSelected = false;
      this.introductionSelected = false;
      if (this.alphabethicOrderActive) {
        this.unSelectAllItems(this.alphabeticalactiveMenuTree);
        this.selectOneItem(itemId, this.alphabeticalactiveMenuTree);
        this.activeMenuTree = this.alphabeticalactiveMenuTree;
      } else if (this.chronologicalOrderActive) {
        this.unSelectAllItems(this.chronologicalactiveMenuTree);
        this.selectOneItem(itemId, this.chronologicalactiveMenuTree);
        this.activeMenuTree = this.chronologicalactiveMenuTree;
      } else {
        this.unSelectAllItems(this.collapsableItems);
        this.selectOneItem(itemId, this.collapsableItems);
        this.activeMenuTree = this.collapsableItems;
      }
      this.cdRef.detectChanges();
    });

    this.events.getTableOfContentsFindMarkdownTocItem().subscribe((data: any) => {
      if (data && data.markdownID) {
        if (this.collectionId !== 'songTypesMarkdown' && this.collectionId !== 'aboutMarkdown') {
          return;
        }

        if (this.collectionId === 'songTypesMarkdown') {
          this.findTocByMarkdownID(this.collapsableItems, data.markdownID);
          this.events.publishTypesAccordionChange({expand: true});
        }

        let language = this.config.getSettings('i18n.locale');
        this.languageService.getLanguage().subscribe((lang: string) => {
          language = lang;
        });

        // checking for ${language}-03 prevents opening about accordion on refresh if another menu is active
        if (this.collectionId === 'aboutMarkdown' && data.markdownID.indexOf(`${language}-03`) !== -1) {
          this.findTocByMarkdownID(this.collapsableItems, data.markdownID);
          this.events.publishAboutAccordionChange({expand: true});
        }
      }
    });

    this.events.getTableOfContentsUnSelectSelectedTocItem().subscribe((data: any) => {
      // console.log('subscribe to tableOfContents:unSelectSelectedTocItem activated', data);
      if (!data) {
        return;
      }
      this.unSelectAllItemsByActiveMenuTree();
      this.cdRef.detectChanges();
    });
  }

  /**
   * Opens tocItem parents and saves children to childrenToc object
   * so that we only have to render current tocItem's parents in the view template.
   * @param tocItem
   */
  openTocItemParentAccordions(tocItem: any) {
    try {
      if (tocItem.parent) {
        tocItem.important = true;
        tocItem.parent.expanded = true;
        tocItem.parent.collapsed = false;

        for (const child of tocItem.parent.subOptions) {
          if (child.subOptions && child.subOptions.length && !child.important) {
            child['search_children_id'] = this.tocItemSearchChildrenCounter;
            this.searchChildrenToc[child.search_children_id] = child.subOptions;
            child.subOptions = [];
            this.tocItemSearchChildrenCounter++;
          }
        }
        tocItem.parent.important = true;
        tocItem.parent.selected = false;
        this.openTocItemParentAccordions(tocItem.parent);
      } else {
        tocItem.expanded = true;
        tocItem.collapsed = false;
        tocItem.important = true;

      }
    } catch (e) {console.log(e)}
  }

  openMarkdownTocItemParentAccordions(tocItem: any) {
    try {
      if (tocItem.parent) {
        tocItem.parent.expanded = true;
        tocItem.parent.collapsed = false;
        this.cdRef.detectChanges();
        this.openMarkdownTocItemParentAccordions(tocItem.parent);
      }
    } catch (e) {}
  }

  findTocByMarkdownID(list: any, markdownID: any) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.findTocByMarkdownID(item.subOptions, markdownID);
      } else if (
        item.markdownID &&
        (item.markdownID === markdownID || String(item.markdownID) === String(markdownID))
      ) {
        item.selected = true;
        this.currentOption = item;
        this.openMarkdownTocItemParentAccordions(item);
        this.cdRef.detectChanges();
        break;
      }
    }
  }

  findTocByPubAndTitle(list: any, publicationID: any, text: any) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.findTocByPubAndTitle(item.subOptions, publicationID, text);
      } else if (
        item.publication_id &&
        (item.publication_id === publicationID || Number(item.publication_id) === Number(publicationID))
        && item.text === text
      ) {
        item.selected = true;
        this.currentOption = item;
        this.openTocItemParentAccordions(item);
        this.foundTocItem = true;
        break;
      }
    }
  }

  findTocByPubOnly(list: any, publicationID: any) {
    for (const item of list) {
      if ((String(item.itemId) === String(publicationID) || Number(item.publication_id) === Number(publicationID))
      ) {
        item.selected = true;
        this.currentOption = item;
        this.openTocItemParentAccordions(item);
        this.foundTocItem = true;
        return this.foundTocItem;
      } else if (item.subOptions && item.subOptions.length) {
        this.findTocByPubOnly(item.subOptions, publicationID);
      }
    }
    return this.foundTocItem;
  }

  getSelectedTocItemByItemId(list: any, tocItemId: any) {
    for (const item of list) {
      if (item.itemId && (String(item.itemId) === String(tocItemId) || Number(item.itemId) === Number(tocItemId))) {
        this.selectedTocItem = item;
        this.foundSelectedTocItem = true;
        return this.selectedTocItem;
      } else if (item.subOptions && item.subOptions.length) {
        this.getSelectedTocItemByItemId(item.subOptions, tocItemId);
      }
    }
    return this.selectedTocItem;
  }

  ngOnDestroy() {
    this.events.getSidemenuRedirect().unsubscribe();
    this.events.getSelectedItemInMenu().unsubscribe();
    this.events.getTableOfContentsFindMarkdownTocItem().unsubscribe();
    this.events.getTableOfContentsLoaded().unsubscribe();
    this.events.getTableOfContentsUnSelectSelectedTocItem().unsubscribe();
  }

  /**
   * Send the selected option to the caller component
   */
  public select(item: any, isInnerMenuOptionItem = true): void {
    if (isInnerMenuOptionItem) {
      this.foundSelectedTocItem = true;
      this.selectedTocItem = item;
      // console.log('selecting toc item: ', item);
    } else {
      this.foundSelectedTocItem = false;
      this.getSelectedTocItemByItemId(this.activeMenuTree, item);
      // console.log('selecting toc page-read item: ', item, this.selectedTocItem);
    }

    if (this.foundSelectedTocItem && this.selectedTocItem) {
      if (this.currentOption) {
        this.currentOption.selected = false;
      }

      this.selectedTocItem.selected = true;
      this.currentOption = this.selectedTocItem;

      if (this.alphabethicOrderActive) {
        this.unSelectOptions(this.alphabeticalactiveMenuTree);
      } else if (this.chronologicalOrderActive) {
        this.unSelectOptions(this.chronologicalactiveMenuTree);
      } else {
        this.unSelectOptions(this.collapsableItems);
      }
      this.coverSelected = false;
      this.titleSelected = false;
      this.forewordSelected = false;
      this.introductionSelected = false;

      this.events.publishSelectedItemInMenu({
        menuID: this.collectionId,
        component: 'table-of-contents-accordion-component'
      });

      // Try to remove META-Tags
      this.metadataService.clearHead();
      // Add the new META-Tags
      this.metadataService.addDescription(this.collectionName + ' - ' + this.selectedTocItem.text);
      this.metadataService.addKeywords();

      if (this.isMarkdown) {
        this.coverSelected = false;
        this.titleSelected = false;
        this.forewordSelected = false;
        this.introductionSelected = false;
        this.selectMarkdown(this.selectedTocItem);
      } else if (this.selectedTocItem.is_gallery) {
        this.coverSelected = false;
        this.titleSelected = false;
        this.forewordSelected = false;
        this.introductionSelected = false;
        this.selectGallery(this.selectedTocItem);
      } else if (this.selectedTocItem.itemId !== undefined) {
        this.coverSelected = false;
        this.titleSelected = false;
        this.forewordSelected = false;
        this.introductionSelected = false;

        this.storage.set('currentTOCItem', this.selectedTocItem);

        const params = this.createReadPageParamsFromMenuItem(this.selectedTocItem);

        if (this.textService.readViewTextId && this.selectedTocItem.itemId.split('_').length > 1
        && this.selectedTocItem.itemId.indexOf(';') > -1
        && this.selectedTocItem.itemId.split(';')[0] === this.textService.readViewTextId.split(';')[0]) {
          // The read page we are navigating to is just a different position in the text that is already open
          // --> no need to reload page-read, just scroll to correct position

          this.events.publishUpdatePositionInPageRead(params);
          this.events.publishUpdatePositionInPageReadTextChanger(this.selectedTocItem.itemId);
        } else {
          if ( !this.platform.is('mobile') ) {
            this.events.publishTitleLogoShow(true);
          } else {
            this.events.publishTitleLogoShow(false);
          }
          this.router.navigate(['/read'], { queryParams: params });
        }
      } else {
        this.storage.set('currentTOCItem', this.selectedTocItem);
      }
    }
  }

  createReadPageParamsFromMenuItem(item: any) {
    const relevantItemData = {
      collapsed: item.collapsed,
      description: item.description,
      expanded: item.expanded,
      facs_nr: item.facs_nr,
      id: item.id,
      important: item.important,
      is_child: item.is_child,
      is_gallery: item.is_gallery,
      itemId: item.itemId,
      page_nr: item.page_nr,
      publication_id: item.publication_id,
      selected: item.selected,
      text: item.text,
      type: item.type
    };
    const params = {root: this.options, tocItem: relevantItemData, collection: {title: item.text}} as any;

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
      if ( parts.length > 2 ) {
        params['chapterID'] = parts[2];
      }
    }

    if (this.currentItem && this.currentItem['facsimilePage'] ) {
      params['facsimilePage'] = this.currentItem['facsimilePage'];
    }

    params['facs_id'] = 'not';
    params['facs_nr'] = 'infinite';
    params['song_id'] = 'nosong';

    params['selectedItemInAccordion'] = true;

    params['search_title'] = 'searchtitle';

    if (this.searchTocItemInAccordionByTitle && item.text) {
      params['search_title'] = item.text;
    }

    if (item.type && item.type === 'facsimile') {
      params['collectionID'] = this.collectionId;
      params['publicationID'] = item.publication_id;
      params['tocLinkId'] = `${this.collectionId}_${item.publication_id}`;

      params['facs_id'] = item.facsimile_id;
      params['facs_nr'] = item.facs_nr;
    }

    if (item.type && item.type === 'song-example') {
      params['collectionID'] = this.collectionId;
      params['publicationID'] = item.publication_id;
      params['tocLinkId'] = `${this.collectionId}_${item.publication_id}`;
      params['song_id'] = item.song_id;
      params['facs_id'] = item.facsimile_id;
      params['facs_nr'] = item.facs_nr;
    }
    return params;
  }

  selectMarkdown(item: any) {
    if (!item.markdownID) {
      return;
    }

    let language = '';
    this.languageService.getLanguage().subscribe((lang: string) => {
      language = lang;
    });

    if ( !String(item.markdownID).includes(language) ) {
      const tmpId = String(item.id).split('-')
      item.id = language + '-' + tmpId[1] + '-' + tmpId[2];
    }

    const params = {
      id: item.markdownID,
      selectedItemInAccordion: true
    };

    if ((this.platform.is('mobile') || this.userSettingsService.isMobile()) && !this.userSettingsService.isDesktop()) {
      this.router.navigate(['/content'], { queryParams: params });
      console.log('pushed mobile')
    } else {
      this.router.navigate(['/content'], { queryParams: params });
    }
  }

  selectGallery(item: any) {
    if ( item.targetOption.id === 'all' ) {
      const params = {};
      this.router.navigate(['/media-collections'], { queryParams: params });
    } else {
      const params = {mediaCollectionId: item.targetOption.id , mediaTitle: item.targetOption.title, fetch: false};
      this.router.navigate(['/media-collection'], { queryParams: params });
    }
  }

  openIntroduction(id: any) {
    const params = {root: this.root, tocItem: null, collection: {title: 'Introduction'}} as any;
    params['collectionID'] = id;
    this.coverSelected = false;
    this.titleSelected = false;
    this.forewordSelected = false;
    this.introductionSelected = true;
    this.currentOption = null;
    this.unSelectAllItemsByActiveMenuTree();
    if (this.platform.is('mobile')) {
      this.router.navigate(['/introduction'], { queryParams: params });
    } else {
      this.router.navigate(['/introduction'], { queryParams: params });
    }
  }

  openForewordPage(id: any) {
    const params = {root: this.root, tocItem: null, collection: {title: 'Foreword Page'}} as any;
    params['collectionID'] = id;
    params['firstItem'] = '1';
    this.coverSelected = false;
    this.titleSelected = false;
    this.forewordSelected = true;
    this.introductionSelected = false;
    this.currentOption = null;
    this.unSelectAllItemsByActiveMenuTree();
    if (this.platform.is('mobile')) {
      this.router.navigate(['/foreword-page'], { queryParams: params });
    } else {
      this.router.navigate(['/foreword-page'], { queryParams: params });
    }
  }

  openTitlePage(id: any) {
    const params = {root: this.root, tocItem: null, collection: {title: 'Title Page'}} as any;
    params['collectionID'] = id;
    params['firstItem'] = '1';
    this.coverSelected = false;
    this.titleSelected = true;
    this.forewordSelected = false;
    this.introductionSelected = false;
    this.currentOption = null;
    this.unSelectAllItemsByActiveMenuTree();
    if (this.platform.is('mobile')) {
      this.router.navigate(['/title-page'], { queryParams: params });
    } else {
      this.router.navigate(['/title-page'], { queryParams: params });
    }
  }

  openCoverPage(id: any) {
    const params = {root: this.root, tocItem: null, collection: {title: 'Cover Page'}} as any;
    params['collectionID'] = id;
    params['firstItem'] = '1';
    this.coverSelected = true;
    this.titleSelected = false;
    this.forewordSelected = false;
    this.introductionSelected = false;
    this.currentOption = null;
    this.unSelectAllItemsByActiveMenuTree();
    if (this.platform.is('mobile')) {
      this.router.navigate(['/cover-page'], { queryParams: params });
    } else {
      this.router.navigate(['/cover-page'], { queryParams: params });
    }
  }

  unSelectOptions(list: any) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.unSelectOptions(item.subOptions);
      } else {
        if (item.publication_id && this.currentOption && item.publication_id !== this.currentOption.publication_id) {
          item.selected = false;
        }
      }
    }
  }

  /**
   * This function is used to find and select a toc-item when the text-changer has been used to
   * select a text. The function repopulates this.collapsableItems with subOptions which are normally
   * stripped for faster rendering.
   */
  selectOneItem(itemId: any, list: any, parent?: any) {
    list.forEach((option: any) => {
      if (option.itemId === itemId) {
        option.selected = true;
        this.currentOption = option;
        this.openTocItemParentAccordions(option);
      } else if (option.childrenCount) {
        if (option.subOptions.length) {
          this.selectOneItem(itemId, option.subOptions, option.subOptions);
        } else {
          if (option.search_children_id > -1) {
            option.subOptions = this.searchChildrenToc[option.search_children_id];
          } else if (option.children_id > -1) {
            option.subOptions = this.childrenToc[option.children_id];
          }
          this.selectOneItem(itemId, option.subOptions, option.subOptions);
        }
      }
    });
  }

  unSelectAllItems(list: any) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.unSelectAllItems(item.subOptions);
      } else {
        item.selected = false;
      }
    }
    if (this.currentOption) {
      this.currentOption.selected = false;
    }
  }

  unSelectAllItemsByActiveMenuTree() {
    if (this.alphabethicOrderActive) {
      this.unSelectAllItems(this.alphabeticalactiveMenuTree);
    } else if (this.chronologicalOrderActive) {
      this.unSelectAllItems(this.chronologicalactiveMenuTree);
    } else {
      this.unSelectAllItems(this.collapsableItems);
    }
    this.cdRef.detectChanges();
  }

  exit() {
    this.alphabethicOrderActive = false;
    this.chronologicalOrderActive = false;
    this.thematicOrderActive = false;
    this.textService.activeTocOrder = 'thematic';
    this.resetTocAccordionScroll();
    this.events.publishExitActiveCollection();
    const params = {};
    this.router.navigate(['/HomePage'], { queryParams: params });
  }

  resetTocAccordionScroll() {
    const tocElem = document.querySelector('#tableOfContentsMenu ion-content.toc-menu-content > .scroll-content');
    if (tocElem) {
      tocElem.scrollTo(0, 0);
    }
  }

  /**
   * Fetch suboptions from childrenToc.
   * Toggle the sub options of the selected item.
   */
  public toggleItemOptions(item: any, isInnerMenuOptionItem = true): void {
    if (!item) { return; }

    if (isInnerMenuOptionItem) {
      this.foundSelectedTocItem = true;
      this.selectedTocItem = item;
      // console.log('toggling toc item: ', item);
    } else {
      this.foundSelectedTocItem = false;
      this.getSelectedTocItemByItemId(this.activeMenuTree, item);
      // console.log('toggling toc item: ', item, this.selectedTocItem);
    }

    if (this.selectedTocItem) {
      // Fetch suboptions if item doesn't have them already
      if (!this.selectedTocItem.subOptions?.length) {
        if (this.selectedTocItem.search_children_id > -1) {
          this.selectedTocItem.subOptions = this.searchChildrenToc[this.selectedTocItem.search_children_id];
        } else if (this.selectedTocItem.children_id > -1) {
          this.selectedTocItem.subOptions = this.childrenToc[this.selectedTocItem.children_id];
        }
      }
      if ( this.selectedTocItem.collapsed === undefined || String(this.selectedTocItem.collapsed) === '' ) {
        // collapsed is inverted expanded
        this.selectedTocItem.collapsed = this.selectedTocItem.expanded;
        this.selectedTocItem.expanded = !this.selectedTocItem.collapsed;
      } else {
        // Toggle the selected option
        this.selectedTocItem.expanded = this.selectedTocItem.collapsed;
        this.selectedTocItem.collapsed = !this.selectedTocItem.expanded;
      }
      // console.log('this.selectedTocItem.itemId', this.selectedTocItem.itemId);
      if ( this.selectedTocItem.itemId !== undefined ) {
        this.select(this.selectedTocItem, true);
      }
      // console.log('toggleItemOptions, this.selectedTocItem:', this.selectedTocItem);
    }
  }

  // Recursive function for finding selected markdown page in toc, marking it selected and expanding all collapsible parents
  private searchInnerMenuForSelectedMarkdownOption(innerMenuOption: InnerMenuOptionModel, parentInnerMenuOption?: InnerMenuOptionModel) {
    if (this.currentOption && this.currentOption.markdownID && innerMenuOption && innerMenuOption.markdownID
      && this.currentOption.markdownID === innerMenuOption.markdownID) {
        innerMenuOption.selected = true;
        this.selectedOption = innerMenuOption;
        this.currentOption = innerMenuOption;
        if (parentInnerMenuOption) {
          parentInnerMenuOption.collapsed = false;
          parentInnerMenuOption.expanded = true;
          innerMenuOption.parent = parentInnerMenuOption;
          let parentOption = parentInnerMenuOption;
          while (parentOption.parent) {
            parentOption.parent.collapsed = false;
            parentOption.parent.expanded = true;
            parentOption = parentOption.parent;
          }
        }
    }
    if (innerMenuOption.childrenCount) {
      innerMenuOption.subOptions?.forEach(subItem => {
        subItem = this.searchInnerMenuForSelectedMarkdownOption(subItem, innerMenuOption);
      });
    }
    return innerMenuOption;
  }

  // Reset the entire menu
  public collapseAllOptions(): void {
    this.collapsableItems.forEach(option => {
      if (!option.selected) {
        option.expanded = false;
        option.collapsed = true;
      }

      if (option.childrenCount) {
        option.subOptions?.forEach((subItem: any) => {
          if (subItem.selected || subItem['collapsed'] === false) {
            // Expand the parent if any of
            // its childs is selected
            subItem.parent.expanded = true;
            subItem.parent.collapsed = false;
          }
        });
      }
    });

    // Update the view since there wasn't any user interaction with it
    this.cdRef.detectChanges();
  }

  // Get the proper indentation of each option
  public get subOptionIndentation(): string {
    if (this.platform.is('ios')) { return this.menuSettings?.subOptionIndentation?.ios || ''; }
    if (this.platform.is('desktop')) { return this.menuSettings?.subOptionIndentation?.wp || ''; }
    return this.menuSettings?.subOptionIndentation?.md || '';
  }

  // Get the proper height of each option
  public get itemHeight(): number {
    if (this.platform.is('ios')) { return this.menuSettings?.itemHeight?.ios || 1; }
    if (this.platform.is('desktop')) { return this.menuSettings?.itemHeight?.wp || 1; }
    return this.menuSettings?.itemHeight?.md || 1;
  }

  // Method that set the selected option and its parent
  public setSelectedOption(option: InnerMenuOptionModel) {
    if (!option.targetOption?.component) {
      console.log('Cannot set selected option');
      return;
    }

    // Clean the current selected option if any
    if (this.selectedOption && this.selectedOption.targetOption) {
      this.selectedOption.selected = false;
      this.selectedOption.targetOption.selected = false;

      if (this.selectedOption.parent) {
        this.selectedOption.parent.selected = false;
        this.selectedOption.parent.expanded = false;
      }

      this.selectedOption = null;
    }

    // Set this option to be the selected
    option.selected = true;
    option.targetOption.selected = true;

    if (option.parent) {
      option.parent.selected = true;
      option.parent.expanded = true;
    }

    // Keep a reference to the selected option
    this.selectedOption = option;

    // Update the view if needed since we may have
    // expanded or collapsed some options
    this.cdRef.detectChanges();
  }

  // Update the selected option
  public updateSelectedOption(data: SideMenuRedirectEventData): void {
    // tslint:disable-next-line:no-debugger
    // debugger;

    if (!data.text) {
      return;
    }

    let targetOption;

    this.collapsableItems.forEach((option: any) => {
      if (option.text.toLowerCase() === data.text?.toLowerCase()) {
        targetOption = option;
      } else if (option.childrenCount) {
        option.subOptions.forEach((subOption: any) => {
          if (subOption.text.toLowerCase() === data.text?.toLowerCase()) {
            targetOption = subOption;
          }
        });
      }
    });

    if (targetOption) {
      this.setSelectedOption(targetOption);
    }
  }

  // Merge the settings received with the default settings
  public mergeSettings(): void {
    const defaultSettings: SideMenuSettings = {
      accordionMode: false,
      itemHeight: {
        ios: 50,
        md: 50,
        wp: 50
      },
      arrowIcon: 'arrow-forward',
      showSelectedOption: false,
      selectedOptionClass: 'selected-option',
      indentSubOptionsWithoutIcons: false,
      subOptionIndentation: {
        ios: '16px',
        md: '16px',
        wp: '16px'
      }
    }

    if (!this.menuSettings) {
      // Use the default values
      this.menuSettings = defaultSettings;
      return;
    }

    if (!this.menuSettings.itemHeight) {
      this.menuSettings.itemHeight = defaultSettings.itemHeight;
    } else {
      // tslint:disable-next-line:max-line-length
      this.menuSettings.itemHeight.ios = this.isDefinedAndPositive(this.menuSettings.itemHeight.ios) ? this.menuSettings.itemHeight.ios : defaultSettings.itemHeight?.ios;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.itemHeight.md = this.isDefinedAndPositive(this.menuSettings.itemHeight.md) ? this.menuSettings.itemHeight.md : defaultSettings.itemHeight?.md;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.itemHeight.wp = this.isDefinedAndPositive(this.menuSettings.itemHeight.wp) ? this.menuSettings.itemHeight.wp : defaultSettings.itemHeight?.wp;
    }
    // tslint:disable-next-line:max-line-length
    this.menuSettings.showSelectedOption = this.isDefined(this.menuSettings.showSelectedOption) ? this.menuSettings.showSelectedOption : defaultSettings.showSelectedOption;
    // tslint:disable-next-line:max-line-length
    this.menuSettings.accordionMode = this.isDefined(this.menuSettings.accordionMode) ? this.menuSettings.accordionMode : defaultSettings.accordionMode;
    this.menuSettings.arrowIcon = this.isDefined(this.menuSettings.arrowIcon) ? this.menuSettings.arrowIcon : defaultSettings.arrowIcon;
    // tslint:disable-next-line:max-line-length
    this.menuSettings.selectedOptionClass = this.isDefined(this.menuSettings.selectedOptionClass) ? this.menuSettings.selectedOptionClass : defaultSettings.selectedOptionClass;
    // tslint:disable-next-line:max-line-length
    this.menuSettings.subOptionIndentation = this.isDefined(this.menuSettings.subOptionIndentation) ? this.menuSettings.subOptionIndentation : defaultSettings.subOptionIndentation;
    // tslint:disable-next-line:max-line-length
    this.menuSettings.indentSubOptionsWithoutIcons = this.isDefined(this.menuSettings.indentSubOptionsWithoutIcons) ? this.menuSettings.indentSubOptionsWithoutIcons : defaultSettings.indentSubOptionsWithoutIcons;


    if (!this.menuSettings.subOptionIndentation) {
      this.menuSettings.subOptionIndentation = defaultSettings.subOptionIndentation;
    } else {
      // tslint:disable-next-line:max-line-length
      this.menuSettings.subOptionIndentation.ios = this.isDefined(this.menuSettings.subOptionIndentation.ios) ? this.menuSettings.subOptionIndentation.ios : defaultSettings.subOptionIndentation?.ios;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.subOptionIndentation.md = this.isDefined(this.menuSettings.subOptionIndentation.md) ? this.menuSettings.subOptionIndentation.md : defaultSettings.subOptionIndentation?.md;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.subOptionIndentation.wp = this.isDefined(this.menuSettings.subOptionIndentation.wp) ? this.menuSettings.subOptionIndentation.wp : defaultSettings.subOptionIndentation?.wp;
    }
  }

  public isDefined(property: any): boolean {
    return property !== null && property !== undefined;
  }

  public isDefinedAndPositive(property: any): boolean {
    return this.isDefined(property) && !isNaN(property) && property > 0;
  }

}
