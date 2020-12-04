import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { StaticPage } from '../../app/models/static-pages.model';
import { MdContentService } from '../../app/services/md/md-content.service';
import { App, Events, Nav, Platform } from 'ionic-angular';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';
import { LanguageService } from '../../app/services/languages/language.service';

/**
 * Generated class for the StaticPagesTocDrilldownMenuComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'static-pages-toc-drilldown-menu',
  templateUrl: 'static-pages-toc-drilldown-menu.html'
})
export class StaticPagesTocDrilldownMenuComponent {
  @Input() jsonObjectID?: string;
  @Input() backButtonAtRoot?: boolean;
  @Output() clickedBack = new EventEmitter<boolean>();

  root: StaticPage[];
  pages: StaticPage;
  menuStack: any[];
  titleStack: string[];
  language = 'sv';
  errorMessage: string;
  currentItemId: any;

  constructor(
    private events: Events,
    public mdcontentService: MdContentService,
    private app: App,
    private platform: Platform,
    public languageService: LanguageService,
    private config: ConfigService,
    private userSettingsService: UserSettingsService
  ) {
    this.menuStack = [];
    this.titleStack = [];
    this.language = this.config.getSettings('i18n.locale');
    this.events.subscribe('language-static:change', () => {
      this.languageService.getLanguage().subscribe((lang: string) => {
        this.menuStack = [];
        this.titleStack = [];
        this.language = lang;
        this.getPages(this.language);
      });
    });
  }

  getPages(lang?) {
    if ( lang !== undefined ) {
      this.language = lang;
    }
    if ( !String(this.jsonObjectID).includes(this.language) ) {
      const tmpObj = String(this.jsonObjectID).split('-');
      this.jsonObjectID = this.language + '-' + tmpObj[1];
    }

    this.mdcontentService.getStaticPagesToc(this.language)
        .subscribe(
          data => {
            if (this.jsonObjectID) {
              this.pages = this.getNodeById(this.jsonObjectID, data);

              if (this.backButtonAtRoot) {
                this.setFirstItemRoot();
              }
              if ( this.pages !== null && this.pages.children !== undefined ) {
                this.menuStack.push(this.pages.children);
                this.titleStack.push(this.pages.title || '');
              }
            } else {
              try {
                const startIndex: number = Number(this.config.getSettings('staticPages.about_index'));
                this.pages = data.children[startIndex].children;
                this.menuStack.push(this.pages);
                this.titleStack.push(data.children[startIndex].title || '');
              } catch (e) {
                this.pages = data.children[3].children;
                this.menuStack.push(this.pages);
                this.titleStack.push(data.children[3].title || '');
              }
            }
          },
          err => console.error(err)
        );
  }

  /**
   * Set first item root so that we know where to set a back button
   * that takes us back to the main toc menu.
   */
  setFirstItemRoot() {
    const firstItem = this.pages.children.reduce((prev, current) => {
      return (prev.id < current.id) ? prev : current
    })

    const result = this.pages.children.filter(page => {
      if (page.id === firstItem.id) {
        page['root'] = true;
      }
    })
  }

  ngOnDestroy() {
    this.events.unsubscribe('language:change');
  }

  /**
   * Used for component interaction.
   * Sends an output event that takes us back to the main toc menu.
   */
  goBack() {
    this.clickedBack.emit(true);
  }

  /**
   * Find a node by id in a JSON tree
   */
  getNodeById(id, tree) {
    const reduce = [].reduce;
    const runner = (result, node) => {
        if (result || !node) { return result; }
        return node.id === id && node ||
            runner(null, node.children) ||
            reduce.call(Object(node), runner, result);
    }
    return runner(null, tree);
  }

  ngOnInit() {
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.getPages(this.language);
    });
  }

  drillDown(item) {
    this.titleStack.push(item.title);
    this.menuStack.push(item.children);
  }

  unDrill() {
    // don't go to far
    if ( this.menuStack.length > 1 ) {
      this.titleStack.pop();
      this.menuStack.pop();
    }
  }

  open(item: StaticPage) {
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      this.openWithLanguage(item);
    });
  }

  openWithLanguage(itemId) {
    if ( !String(itemId).includes(this.language) ) {
      const tmpId = String(itemId).split('-')
      itemId = this.language + '-' + tmpId[1] + '-' + tmpId[2];
    }

    this.currentItemId = itemId;

    const params = {id: itemId};
    const nav = this.app.getActiveNavs();

    if ((this.platform.is('mobile') || this.userSettingsService.isMobile()) && !this.userSettingsService.isDesktop()) {
      nav[0].push('content', params);
    } else {
      nav[0].setRoot('content', params);
    }
  }

  public front() {
    this.events.publish('topMenu:front');
  }

  private exit() {
    const nav = this.app.getActiveNavs();
    nav[0].setRoot('EditionsPage', [], {animate: true, direction: 'back', animation: 'ios-transition'});
  }

}
