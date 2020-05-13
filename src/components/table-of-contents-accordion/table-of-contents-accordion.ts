import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, OnInit } from '@angular/core';
import { Platform, Events, App, LoadingController } from 'ionic-angular';
import { MenuOptionModel } from '../../app/models/menu-option.model';
import { SideMenuSettings } from '../../app/models/side-menu-settings';
import { SideMenuRedirectEvent, SideMenuRedirectEventData } from '../../app/models/sidemenu-redirect-events';
import { Storage } from '@ionic/storage';
import { GeneralTocItem } from '../../app/models/table-of-contents.model';
import { TocAccordionMenuOptionModel } from '../../app/models/toc-accordion-menu-option.model';
import { ConfigService,  } from '@ngx-config/core';
import { LanguageService } from '../../app/services/languages/language.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ThrowStmt } from '@angular/compiler';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

/*-------------------------------------*/

// All children will be stored here in order to reduce lag
// They will be used everytime a parent is toggled in toggleItemOptions
const childrenToc = {};
const searchChildrenToc = {};
let childrenTocIdCounter = 1;

class InnerMenuOptionModel {
  public static counter = 1;

  id?: number;
  iconName?: string;
  text?: string;
  title?: string;
  targetOption?: TocAccordionMenuOptionModel;
  parent?: InnerMenuOptionModel;
  selected?: boolean;
  expanded?: boolean;
  childrenCount?: number;
  subOptions?: Array<InnerMenuOptionModel>;
  type?: string;
  publication_id?: any;
  facsimile_id?: any;
  page_nr?: any;
  facs_nr?: any;
  children?: Array<InnerMenuOptionModel>;
  is_child?: boolean;
  itemId?: any;
  markdownID?: any;
  datafile?: any;
  url?: any;
  song_id?: any;
  amountOfParents?: any;
  openByDefault?: boolean;
  collectionId?: any;
  loading?: boolean;
  children_id?: any;
  search_children_id?: any;
  important?: boolean;

  public static fromMenuOptionModel(
                  option: TocAccordionMenuOptionModel,
                  parent?: InnerMenuOptionModel,
                  isChild?: boolean,
                  searchingTocItem?: Boolean
                ): InnerMenuOptionModel {

    const innerMenuOptionModel = new InnerMenuOptionModel();

    innerMenuOptionModel.id = this.counter++;
    innerMenuOptionModel.targetOption = option;
    innerMenuOptionModel.parent = parent || null;
    innerMenuOptionModel.type = option.type;
    innerMenuOptionModel.selected = option.selected;

    innerMenuOptionModel.important = option.important ? option.important : false;

    if (['file', 'folder'].indexOf(option.type) !== -1) {
      innerMenuOptionModel.markdownID = option.id;
    }

    if (option.text) {
      innerMenuOptionModel.text = option.text;
    } else if (option.title) {
      innerMenuOptionModel.text = option.title;
    }

    innerMenuOptionModel.publication_id = option.publication_id || null;
    innerMenuOptionModel.page_nr = option.page_nr || null;
    innerMenuOptionModel.facs_nr = option.facs_nr || null;

    if (option.itemId) {
      innerMenuOptionModel.itemId = option.itemId;

      const legacyID = option.itemId;
      const legacyData = legacyID.split('_');

      if (legacyData.length === 2 && innerMenuOptionModel.publication_id === null) {
        innerMenuOptionModel.publication_id = legacyData[1];
      }
    }

    if (option.facsimile_id) {
      innerMenuOptionModel.facsimile_id = option.facsimile_id;
    }

    if (option.song_id) {
      innerMenuOptionModel.song_id = option.song_id;
    }

    if (option.openByDefault) {
      innerMenuOptionModel.openByDefault = true;
    }

    if (isChild) {
      innerMenuOptionModel.is_child = true;
    } else {
      innerMenuOptionModel.is_child = false;
    }

    if (option.children) {
      innerMenuOptionModel.expanded = false;
      let storeChildren = false;

      if (option.openByDefault) {
        // innerMenuOptionModel.expanded = true;
      }

      innerMenuOptionModel.childrenCount = option.children.length;
      innerMenuOptionModel.subOptions = [];

      if (
        option.children && option.children.length &&
        !option.children_id && !option.search_children_id &&
        !innerMenuOptionModel.markdownID &&
        !searchingTocItem
      ) {
        innerMenuOptionModel.children_id = childrenTocIdCounter;
        childrenToc[innerMenuOptionModel.children_id] = [];
        childrenTocIdCounter++;
        storeChildren = true;
      }

      option.children.forEach(subItem => {

      const innerSubItem = InnerMenuOptionModel.fromMenuOptionModel(subItem, innerMenuOptionModel, true, searchingTocItem);

      if (innerSubItem.text) {
        if (storeChildren) {
          childrenToc[innerMenuOptionModel.children_id].push(innerSubItem);
        } else {
          innerMenuOptionModel.subOptions.push(innerSubItem);
        }
      }

      // Select the parent if any
      // child option is selected
      if (subItem.selected) {
        innerSubItem.parent.selected = true;
        innerSubItem.parent.expanded = true;
      }

      });
    }

    return innerMenuOptionModel;
  }
}


@Component({
  selector: 'table-of-contents-accordion',
  templateUrl: 'table-of-contents-accordion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TableOfContentsAccordionComponent {
  // Main inputs
  public menuSettings: SideMenuSettings;
  public menuOptions: Array<TocAccordionMenuOptionModel>;
  public selectedOption: InnerMenuOptionModel;
  public collapsableItems: Array<InnerMenuOptionModel> = [];

  @Input('options')
  set options(value: {
    toc: Array<MenuOptionModel>,
    searchTocItem?: Boolean,
    searchPublicationId?: Number,
    searchTitle?: String
  }) {
    if (value && value.toc && value.toc.length > 0) {
      if (value.searchTocItem) {
        this.searchingForTocItem = true;
      }
      this.menuOptions = value.toc;
      this.collapsableItems = new Array<InnerMenuOptionModel>();

      let foundSelected = false;
      // Map the options to our internal models
      this.menuOptions.forEach(option => {
        const innerMenuOption = InnerMenuOptionModel.fromMenuOptionModel(option, null, false, value.searchTocItem);
        this.collapsableItems.push(innerMenuOption);

        // Check if there's any option marked as selected
        if (option.selected) {
          this.selectedOption = innerMenuOption;
        } else if (innerMenuOption.childrenCount) {
          innerMenuOption.subOptions.forEach(subItem => {
            if (subItem.selected) {
              this.selectedOption = subItem;
              foundSelected = true;
            }
          });
        }
      });

      if ( !foundSelected ) {
      } else {
        console.log('found menu item');
      }

      if (value.searchTocItem) {
        // Find toc item and open its parents
        if (value.searchPublicationId && value.searchTitle) {
          this.findTocByPubAndTitle(this.collapsableItems, value.searchPublicationId, value.searchTitle);
          this.events.publish('typesAccordion:change', {
            expand: true
          });
        } else if (value.searchPublicationId) {
          this.findTocByPubOnly(this.collapsableItems, value.searchPublicationId);
          this.events.publish('typesAccordion:change', {
            expand: true
          });
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
        }
      }

      this.searchingForTocItem = false;
    }
  }

  @Input('settings')
  set settings(value: SideMenuSettings) {
    if (value) {
      this.menuSettings = value;
      this.mergeSettings();
    }
  }

  @Input() collectionId: string;
  @Input() collectionName: string;
  @Input() showBackButton?: Boolean;
  @Input() isMarkdown?: Boolean;
  @Input() isGallery?: Boolean;
  @Output() selectOption = new EventEmitter<any>();

  currentItem: GeneralTocItem;
  currentOption: any;
  searchingForTocItem = false;
  searchTocItemInAccordionByTitle = false;
  tocItemSearchChildrenCounter = 0;
  foundTocItem = false;
  coverSelected: boolean;
  titleSelected: boolean;
  root: any;
  hasCover: boolean;
  hasIntro: boolean;
  playmanTraditionPageInMusicAccordion = false;
  playmanTraditionPageID = '03-03';
  constructor(
    public platform: Platform,
    public events: Events,
    public cdRef: ChangeDetectorRef,
    protected storage: Storage,
    public app: App,
    public loadingCtrl: LoadingController,
    public config: ConfigService,
    public languageService: LanguageService,
    public userSettingsService: UserSettingsService,
    public translate: TranslateService
  ) {
    this.setConfigs();
    // Handle the redirect event
    this.events.subscribe(SideMenuRedirectEvent, (data: SideMenuRedirectEventData) => {
      this.updateSelectedOption(data);
    });

    this.events.subscribe('SelectedItemInMenu', (menu) => {
      if (this.collectionId !== menu.menuID && this.currentOption) {
        this.currentOption.selected = false;
        this.currentOption = null;
        this.cdRef.detectChanges();
      }
    });

    this.coverSelected = false;
    this.titleSelected = false;

    try {
      this.hasCover = this.config.getSettings('HasCover');
    } catch (e) {
      this.hasCover = false;
    }

    try {
      this.hasIntro = this.config.getSettings('HasIntro');
    } catch (e) {
      this.hasIntro = false;
    }

    if ( this.hasCover ) {
      this.coverSelected = true;
    } else if ( this.hasIntro ) {
      this.titleSelected = true;
    }

    this.events.subscribe('tableOfContents:findMarkdownTocItem', (data) => {
      if (data && data.markdownID) {
        if (this.collectionId !== 'songTypesMarkdown' && this.collectionId !== 'aboutMarkdown') {
          return;
        }

        if (this.collectionId === 'songTypesMarkdown') {
          this.findTocByMarkdownID(this.collapsableItems, data.markdownID);
          this.events.publish('typesAccordion:change', {
            expand: true
          });
        }

        let language = 'sv';
        this.languageService.getLanguage().subscribe((lang: string) => {
          language = lang;
        });

        // checking for ${language}-03 prevents opening about accordion on refresh if another menu is active
        if (this.collectionId === 'aboutMarkdown' && data.markdownID.indexOf(`${language}-03`) !== -1) {
          this.findTocByMarkdownID(this.collapsableItems, data.markdownID);
          this.events.publish('aboutAccordion:change', {
            expand: true
          });
        }

      }
    });

    this.unSelectSelectedTocItemEventListener();
  }

  ngOnChanges(about) {
    if ( Array.isArray(about) ) {
      this.menuOptions = about;
      this.collapsableItems = new Array<InnerMenuOptionModel>();

      let foundSelected = false;
      // Map the options to our internal models
      this.menuOptions.forEach(option => {
        const innerMenuOption = InnerMenuOptionModel.fromMenuOptionModel(option, null, false, false);
        this.collapsableItems.push(innerMenuOption);

        // Check if there's any option marked as selected
        if (option.selected) {
          this.selectedOption = innerMenuOption;
        } else if (innerMenuOption.childrenCount) {
          innerMenuOption.subOptions.forEach(subItem => {
            if (subItem.selected) {
              this.selectedOption = subItem;
              foundSelected = true;
            }
          });
        }
      });
      this.cdRef.detectChanges();
    }
  }

  ngOnInit() {
    let language = 'sv';
    this.languageService.getLanguage().subscribe((lang: string) => {
      language = lang;
    });

    this.playmanTraditionPageID = `${language}-${this.playmanTraditionPageID}`;
    this.cdRef.detectChanges();
  }

  setConfigs() {
    try {
      this.searchTocItemInAccordionByTitle = this.config.getSettings('SearchTocItemInAccordionByTitle');
    } catch (e) {
      console.log(e);
    }

    let playManTraditionPageInMusicAccordion = false;

    try {
      playManTraditionPageInMusicAccordion = this.config.getSettings('MusicAccordionShow.PlaymanTraditionPage');
    } catch (e) {
      playManTraditionPageInMusicAccordion = false;
    }

    this.playmanTraditionPageInMusicAccordion = playManTraditionPageInMusicAccordion;
  }

  unSelectSelectedTocItemEventListener() {
    this.events.subscribe('tableOfContents:unSelectSelectedTocItem', (data) => {
      if (!data) {
        return;
      }

      this.currentOption = null;
      if ( this.hasCover ) {
        this.coverSelected = true;
      } else if ( this.hasIntro ) {
        this.titleSelected = true;
      }
      this.unSelectAllItems(this.collapsableItems);
      this.cdRef.detectChanges();
    });
  }

  /**
   * Opens tocItem parents and saves children to childrenToc object
   * so that we only have to render current tocItem's parents in the view template.
   * @param tocItem
   */
  openTocItemParentAccordions(tocItem) {
    try {
      if (tocItem.parent) {
        tocItem.important = true;
        tocItem.parent.expanded = true;

        for (const child of tocItem.parent.subOptions) {
          if (child.subOptions && child.subOptions.length && !child.important) {
            child['search_children_id'] = this.tocItemSearchChildrenCounter;
            searchChildrenToc[child.search_children_id] = child.subOptions;
            child.subOptions = [];
            this.tocItemSearchChildrenCounter++;
          }
        }
        tocItem.parent.important = true;
        tocItem.parent.selected = true;
        this.openTocItemParentAccordions(tocItem.parent);
      }
    } catch (e) {console.log(e)}
  }

  openMarkdownTocItemParentAccordions(tocItem) {
    try {
      if (tocItem.parent) {
        tocItem.parent.expanded = true;
        this.cdRef.detectChanges();
        this.openMarkdownTocItemParentAccordions(tocItem.parent);
      }
    } catch (e) {}
  }

  findTocByMarkdownID(list, markdownID) {
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

  findTocByPubAndTitle(list, publicationID, text) {
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

  findTocByPubOnly(list, publicationID) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.findTocByPubOnly(item.subOptions, publicationID);
      } else if (
        item.publication_id &&
        (String(item.publication_id) === String(publicationID) || Number(item.publication_id) === Number(publicationID))
      ) {
        item.selected = true;
        this.currentOption = item;
        this.openTocItemParentAccordions(item);
        this.foundTocItem = true;
        break;
      }
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe(SideMenuRedirectEvent);
    this.events.unsubscribe('tableOfContents:unSelectSelectedTocItem');
    this.events.unsubscribe('SelectedItemInMenu');
  }

  // Send the selected option to the caller component
  public select(item: InnerMenuOptionModel): void {

    if (this.currentOption) {
      this.currentOption.selected = false;
    }

    this.currentOption = item;
    item.selected = true;

    this.events.publish('SelectedItemInMenu', {
      menuID: this.collectionId,
      component: 'table-of-contents-accordion-component'
    });

    this.unSelectOptions(this.collapsableItems);

    if (this.isMarkdown) {
      this.selectMarkdown(item);
    } else if (this.isGallery) {
      this.selectGallery(item);
    } else {
      this.storage.set('currentTOCItem', item);
      const params = {root: this.options, tocItem: item, collection: {title: item.text}};
      const nav = this.app.getActiveNavs();

      this.coverSelected = false;
      this.titleSelected = false;

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

      if ( this.platform.is('core') ) {
        this.events.publish('title-logo:show', true);
      } else {
        this.events.publish('title-logo:show', false);
      }

      nav[0].setRoot('read', params);
    }
  }

  selectMarkdown(item) {
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

    const nav = this.app.getActiveNavs();

    if ((this.platform.is('mobile') || this.userSettingsService.isMobile()) && !this.userSettingsService.isDesktop()) {
      nav[0].push('content', params);
      console.log('pushed mobile')
    } else {
      nav[0].setRoot('content', params);
    }
  }

  selectGallery(item) {
    const nav = this.app.getActiveNavs();
    if ( item.targetOption.id === 'all' ) {
      const params = {};
      nav[0].push('media-collections', params, { animate: false, direction: 'forward', animation: 'ios-transition' });
    } else {
      const params = {mediaCollectionId: item.targetOption.id , mediaTitle: item.targetOption.title, fetch: false};
      nav[0].push('media-collection', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
    }
  }

  openIntroduction() {
    const params = {root: this.root, tocItem: null, collection: {title: 'Introduction'}};
    params['collectionID'] = this.collectionId;
    this.titleSelected = true;
    this.coverSelected = false;
    const nav = this.app.getActiveNavs();
    if (this.platform.is('mobile')) {
      nav[0].push('introduction', params);
    } else {
      nav[0].setRoot('introduction', params);
    }
  }

  openTitlePage() {
    const params = {root: this.root, tocItem: null, collection: {title: 'Title Page'}};
    params['collectionID'] = this.collectionId;
    params['firstItem'] = '1';
    this.coverSelected = true;
    this.titleSelected = false;
    const nav = this.app.getActiveNavs();
    if (this.platform.is('mobile')) {
      nav[0].push('title-page', params);
    } else {
      nav[0].setRoot('title-page', params);
    }
  }

  unSelectOptions(list) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.unSelectOptions(item.subOptions);
      } else {
        if (item.publication_id && item.publication_id !== this.currentOption.publication_id) {
          item.selected = false;
        }
      }
    }
  }

  unSelectAllItems(list) {
    for (const item of list) {
      if (item.subOptions && item.subOptions.length) {
        this.unSelectAllItems(item.subOptions);
      } else {
        item.selected = false;
      }
    }
  }

  exit() {
    this.collectionId = null;
    this.collectionName = null;
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('EditionsPage', [], {animate: false, direction: 'back', animation: 'ios-transition'});
  }

  /**
   * Fetch suboptions from childrenToc.
   * Toggle the sub options of the selected item.
   */
  public toggleItemOptions(targetOption: InnerMenuOptionModel): void {

    if (!targetOption) { return; }

    // Fetch suboptions if item doesn't have them already
    if (!targetOption.subOptions.length) {
      if (targetOption.children_id) {
        targetOption.subOptions = childrenToc[targetOption.children_id];
      } else if (targetOption.search_children_id) {
        targetOption.subOptions = searchChildrenToc[targetOption.search_children_id];
      }
    }
    // Toggle the selected option
    targetOption.expanded = !targetOption.expanded;
  }

  // Reset the entire menu
  public collapseAllOptions(): void {
    this.collapsableItems.forEach(option => {
      if (!option.selected) {
        option.expanded = false;
      }

      if (option.childrenCount) {
        option.subOptions.forEach(subItem => {
          if (subItem.selected) {
            // Expand the parent if any of
            // its childs is selected
            subItem.parent.expanded = true;
          }
        });
      }
    });

    // Update the view since there wasn't
    // any user interaction with it
    this.cdRef.detectChanges();
  }

  // Get the proper indentation of each option
  public get subOptionIndentation(): string {
    if (this.platform.is('ios')) { return this.menuSettings.subOptionIndentation.ios; }
    if (this.platform.is('windows')) { return this.menuSettings.subOptionIndentation.wp; }
    return this.menuSettings.subOptionIndentation.md;
  }

  // Get the proper height of each option
  public get itemHeight(): number {
    if (this.platform.is('ios')) { return this.menuSettings.itemHeight.ios; }
    if (this.platform.is('windows')) { return this.menuSettings.itemHeight.wp; }
    return this.menuSettings.itemHeight.md;
  }

  // Method that set the selected option and its parent
  public setSelectedOption(option: InnerMenuOptionModel) {
    if (!option.targetOption.component) { return; }

    // Clean the current selected option if any
    if (this.selectedOption) {
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

    this.collapsableItems.forEach(option => {
      if (option.text.toLowerCase() === data.text.toLowerCase()) {
        targetOption = option;
      } else if (option.childrenCount) {
        option.subOptions.forEach(subOption => {
          if (subOption.text.toLowerCase() === data.text.toLowerCase()) {
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
      arrowIcon: 'ios-arrow-forward',
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
      this.menuSettings.itemHeight.ios = this.isDefinedAndPositive(this.menuSettings.itemHeight.ios) ? this.menuSettings.itemHeight.ios : defaultSettings.itemHeight.ios;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.itemHeight.md = this.isDefinedAndPositive(this.menuSettings.itemHeight.md) ? this.menuSettings.itemHeight.md : defaultSettings.itemHeight.md;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.itemHeight.wp = this.isDefinedAndPositive(this.menuSettings.itemHeight.wp) ? this.menuSettings.itemHeight.wp : defaultSettings.itemHeight.wp;
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
      this.menuSettings.subOptionIndentation.ios = this.isDefined(this.menuSettings.subOptionIndentation.ios) ? this.menuSettings.subOptionIndentation.ios : defaultSettings.subOptionIndentation.ios;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.subOptionIndentation.md = this.isDefined(this.menuSettings.subOptionIndentation.md) ? this.menuSettings.subOptionIndentation.md : defaultSettings.subOptionIndentation.md;
      // tslint:disable-next-line:max-line-length
      this.menuSettings.subOptionIndentation.wp = this.isDefined(this.menuSettings.subOptionIndentation.wp) ? this.menuSettings.subOptionIndentation.wp : defaultSettings.subOptionIndentation.wp;
    }
  }

  public isDefined(property: any): boolean {
    return property !== null && property !== undefined;
  }

  public isDefinedAndPositive(property: any): boolean {
    return this.isDefined(property) && !isNaN(property) && property > 0;
  }
}
