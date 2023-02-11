import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule)
  },
  {
    path: 'content',
    loadChildren: () => import('./pages/content/content.module').then( m => m.ContentPageModule)
  },
  {
    path: 'publication-cover',
    loadChildren: () => import('./pages/cover/cover.module').then( m => m.CoverPageModule)
  },
  {
    path: 'downloads',
    loadChildren: () => import('./pages/downloads/downloads.module').then( m => m.DownloadsPageModule)
  },
  {
    path: 'publications',
    loadChildren: () => import('./pages/editions/editions.module').then( m => m.EditionsPageModule)
  },
  {
    path: 'elastic-search',
    loadChildren: () => import('./pages/elastic-search/elastic-search.module').then( m => m.ElasticSearchPageModule)
  },
  {
    path: 'epub',
    loadChildren: () => import('./pages/epub/epub.module').then( m => m.EpubModule)
  },
  {
    path: 'featured',
    loadChildren: () => import('./pages/featured-facsimile/featured-facsimile.module').then( m => m.FeaturedFacsimilePageModule)
  },
  {
    path: 'publication-foreword',
    loadChildren: () => import('./pages/foreword/foreword.module').then( m => m.ForewordPageModule)
  },
  {
    path: 'galleries',
    loadChildren: () => import('./pages/galleries/galleries.module').then( m => m.GalleriesPageModule)
  },
  {
    path: 'gallery',
    loadChildren: () => import('./pages/image-gallery/image-gallery.module').then( m => m.ImageGalleryPageModule)
  },
  {
    path: 'publication-introduction',
    loadChildren: () => import('./pages/introduction/introduction.module').then( m => m.IntroductionPageModule)
  },
  {
    path: 'person-search',
    loadChildren: () => import('./pages/person-search/person-search.module').then( m => m.PersonSearchPageModule)
  },
  {
    path: 'media-collection',
    loadChildren: () => import('./pages/media-collection/media-collection.module').then( m => m.MediaCollectionPageModule)
  },
  {
    path: 'media-collections',
    loadChildren: () => import('./pages/media-collections/media-collections.module').then( m => m.MediaCollectionsPageModule)
  },
  {
    path: 'pages-list',
    loadChildren: () => import('./pages/mobile-pages-list/mobile-pages-list.module').then( m => m.MobilePagesListPageModule)
  },
  {
    path: 'music',
    loadChildren: () => import('./pages/music/music.module').then( m => m.MusicPageModule)
  },
  {
    path: 'result',
    loadChildren: () => import('./pages/occurrences-result/occurrences-result.module').then( m => m.OccurrencesResultPageModule)
  },
  {
    path: 'facsimile',
    loadChildren: () => import('./pages/pdf/pdf.module').then( m => m.PdfPageModule)
  },
  {
    path: 'places',
    loadChildren: () => import('./pages/place-search/place-search.module').then( m => m.PlaceSearchPageModule)
  },
  {
    path: 'publication-toc',
    loadChildren: () => import('./pages/single-edition/single-edition.module').then( m => m.SingleEditionPageModule)
  },
  {
    path: 'publication-part-toc',
    loadChildren: () => import('./pages/single-edition-part/single-edition-part.module').then( m => m.SingleEditionPagePartModule)
  },
  {
    path: 'song',
    loadChildren: () => import('./pages/song/song.module').then( m => m.SongPageModule)
  },
  {
    path: 'tags',
    loadChildren: () => import('./pages/tag-search/tag-search.module').then( m => m.TagearchPageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, initialNavigation: 'enabledBlocking' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
