import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

import { TopMenuComponent } from './top-menu/top-menu';
import { SplitPaneToggleComponent } from './split-pane-toggle/split-pane-toggle';
import { TableOfContentsDrilldownMenuComponent } from './table-of-contents-drilldown-menu/table-of-contents-drilldown-menu';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { StaticPagesTocDrilldownMenuComponent } from './static-pages-toc-drilldown-menu/static-pages-toc-drilldown-menu';
import { PipesModule } from '../pipes/pipes.module';
import { HttpClient } from '@angular/common/http';
import { TocMenuComponent } from './toc-menu/toc-menu';
import { TitleLogoComponent } from './title-logo/title-logo';
import { TextChangerComponent } from './text-changer/text-changer';
import { SimpleSearchComponent } from './simple-search/simple-search';
import { SocialSharingComponent } from './social-sharing/social-sharing';
import { ShareButtonsModule } from 'ngx-sharebuttons';
import { UserSettingsService } from '../app/services/settings/user-settings.service';
import { SongExampleComponent } from './song-example/song-example';
import { DigitalEditionListChildrenComponent } from './digital-edition-list-children/digital-edition-list-children';
import { TableOfContentsAccordionComponent } from './table-of-contents-accordion/table-of-contents-accordion';
import { ListOfSongsComponent } from './list-of-songs/list-of-songs';
import { NgxExtendedPdfViewerComponent } from './ngx-extended-pdf-viewer/ngx-extended-pdf-viewer.component';
import { IllustrationsComponent } from './illustrations/illustrations';
import { TableOfContentLetterFilterComponent } from './table-of-content-letter-filter/table-of-content-letter-filter';
import { DateHistogram } from './date-histogram/date-histogram';
import { LanguageService } from '../app/services/languages/language.service';
import { MathJaxComponent } from './math-jax/math-jax';


export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    TitleLogoComponent,
    TopMenuComponent,
    TopMenuComponent,
    SplitPaneToggleComponent,
    TableOfContentsDrilldownMenuComponent,
    StaticPagesTocDrilldownMenuComponent,
    TocMenuComponent,
    TextChangerComponent,
    SimpleSearchComponent,
    SocialSharingComponent,
    SongExampleComponent,
    DigitalEditionListChildrenComponent,
    TableOfContentsAccordionComponent,
    ListOfSongsComponent,
    NgxExtendedPdfViewerComponent,
    IllustrationsComponent,
    TableOfContentLetterFilterComponent,
    DateHistogram,
    MathJaxComponent,
  ],
  imports: [
    IonicModule,
    PipesModule,
    ShareButtonsModule.forRoot(),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  exports: [
    TitleLogoComponent,
    TopMenuComponent,
    TopMenuComponent,
    SplitPaneToggleComponent,
    TableOfContentsDrilldownMenuComponent,
    StaticPagesTocDrilldownMenuComponent,
    TocMenuComponent,
    TextChangerComponent,
    SimpleSearchComponent,
    SocialSharingComponent,
    SongExampleComponent,
    DigitalEditionListChildrenComponent,
    TableOfContentsAccordionComponent,
    ListOfSongsComponent,
    NgxExtendedPdfViewerComponent,
    TableOfContentLetterFilterComponent,
    DateHistogram,
    IllustrationsComponent,
    TableOfContentLetterFilterComponent,
    DateHistogram,
    MathJaxComponent,
  ],
  providers: [
    UserSettingsService,
    LanguageService
  ]
})
export class ComponentsModule { }
