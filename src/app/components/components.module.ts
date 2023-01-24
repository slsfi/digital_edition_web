import { NgModule } from '@angular/core';

// import { SplitPaneToggleComponent } from './split-pane-toggle/split-pane-toggle';
// import { TableOfContentsDrilldownMenuComponent } from './table-of-contents-drilldown-menu/table-of-contents-drilldown-menu';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { StaticPagesTocDrilldownMenuComponent } from './static-pages-toc-drilldown-menu/static-pages-toc-drilldown-menu';
import { HttpClient } from '@angular/common/http';
// import { TocMenuComponent } from './toc-menu/toc-menu';
// import { TextChangerComponent } from './text-changer/text-changer';
import { SimpleSearchComponent } from './simple-search/simple-search';
// import { SocialSharingComponent } from './social-sharing/social-sharing';
// import { UserSettingsService } from '../app/services/settings/user-settings.service';
// import { SongExampleComponent } from './song-example/song-example';
import { DigitalEditionListChildrenComponent } from './digital-edition-list-children/digital-edition-list-children';
// import { TableOfContentsAccordionComponent } from './table-of-contents-accordion/table-of-contents-accordion';
// import { ListOfSongsComponent } from './list-of-songs/list-of-songs';
// import { NgxExtendedPdfViewerComponent } from './ngx-extended-pdf-viewer/ngx-extended-pdf-viewer.component';
// import { IllustrationsComponent } from './illustrations/illustrations';
// import { TableOfContentLetterFilterComponent } from './table-of-content-letter-filter/table-of-content-letter-filter';
import { DateHistogram } from './date-histogram/date-histogram';
// import { MathJaxComponent } from './math-jax/math-jax';
import { IonicModule } from '@ionic/angular';
import { UserSettingsService } from '../services/settings/user-settings.service';
import { PipesModule } from 'src/pipes/pipes.module';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../services/languages/language.service';
import { FormsModule } from '@angular/forms';
import { TopMenuComponent } from './top-menu/top-menu';
import { TitleLogoComponent } from './title-logo/title-logo';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    TitleLogoComponent,
    TopMenuComponent,
    // SplitPaneToggleComponent,
    // TableOfContentsDrilldownMenuComponent,
    // StaticPagesTocDrilldownMenuComponent,
    // TocMenuComponent,
    // TextChangerComponent,
    SimpleSearchComponent,
    // SocialSharingComponent,
    // SongExampleComponent,
    DigitalEditionListChildrenComponent,
    // TableOfContentsAccordionComponent,
    // ListOfSongsComponent,
    // NgxExtendedPdfViewerComponent,
    // IllustrationsComponent,
    // TableOfContentLetterFilterComponent,
    DateHistogram,
    // MathJaxComponent,
  ],
  imports: [
    IonicModule,
    PipesModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    CommonModule,
    FormsModule,
  ],
  exports: [
    TitleLogoComponent,
    TopMenuComponent,
    // SplitPaneToggleComponent,
    // TableOfContentsDrilldownMenuComponent,
    // StaticPagesTocDrilldownMenuComponent,
    // TocMenuComponent,
    // TextChangerComponent,
    SimpleSearchComponent,
    // SocialSharingComponent,
    // SongExampleComponent,
    DigitalEditionListChildrenComponent,
    // TableOfContentsAccordionComponent,
    // ListOfSongsComponent,
    // NgxExtendedPdfViewerComponent,
    // TableOfContentLetterFilterComponent,
    // DateHistogram,
    // IllustrationsComponent,
    // TableOfContentLetterFilterComponent,
    DateHistogram,
    // MathJaxComponent,
  ],
  providers: [
    UserSettingsService,
    LanguageService
  ]
})
export class ComponentsModule { }
