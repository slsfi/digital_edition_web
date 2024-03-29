import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, App, Events } from 'ionic-angular';
import { GalleryService } from '../../app/services/gallery/gallery.service';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { ConfigService } from '@ngx-config/core';
import { LanguageService } from '../../app/services/languages/language.service';
import { TranslateService } from '@ngx-translate/core/src/translate.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { MetadataService } from '../../app/services/metadata/metadata.service';
import { MdContentService } from '../../app/services/md/md-content.service';
import { MdContent } from '../../app/models/md-content.model';

@IonicPage({
  name: 'media-collections',
  segment: 'media-collections'
})
@Component({
  selector: 'media-collections',
  templateUrl: 'media-collections.html',
})
export class MediaCollectionsPage {

  galleries = [];
  allTags = [];
  allLocations = [];
  allSubjects = [];
  allGalleries = [];
  galleryTags = [];
  galleryLocations = [];
  gallerySubjects = [];
  locationModel = '';
  tagModel = '';
  subjectModel = '';
  prevTag = '';
  prevLoc = '';
  prevSub = '';
  private apiEndPoint: string;
  private projectMachineName: string;
  private removeScanDetails = false;
  mdContent: MdContent;
  language = 'sv';
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private app: App,
    private events: Events,
    private galleryService: GalleryService,
    private userSettingsService: UserSettingsService,
    private config: ConfigService,
    public languageService: LanguageService,
    public translate: TranslateService,
    public cdRef: ChangeDetectorRef,
    private analyticsService: AnalyticsService,
    private metadataService: MetadataService,
    private mdContentService: MdContentService
  ) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.removeScanDetails = this.config.getSettings('galleryImages.removeScanDetails');
    } catch (e) {
      this.removeScanDetails = false;
    }

    let fileID = '11-all';
    this.mdContent = new MdContent({id: fileID, title: '...', content: null, filename: null});

    this.language = this.config.getSettings('i18n.locale');
    this.languageService.getLanguage().subscribe((lang: string) => {
      this.language = lang;
      if ( !String(fileID).includes(lang) ) {
        fileID = lang + '-' + fileID;
      }
      this.getMdContent(fileID);
      this.getMediaCollections();
      this.getCollectionTags();
      this.getCollectionLocations();
      this.getCollectionSubjects();
    });
  }

  getMediaCollections() {
    (async () => {
      this.galleries = await this.galleryService.getGalleries(this.language);
      this.allGalleries = this.galleries;
      this.allGalleries.sort(function(a, b) {
        const titleA = a.title.toLowerCase(); // ignore upper and lowercase
        const titleB = b.title.toLowerCase(); // ignore upper and lowercase
        if (titleA < titleB) {
          return -1;
        }
        if (titleA > titleB) {
          return 1;
        }
        return 0;
      });
      this.galleries = this.allGalleries;
      this.cdRef.detectChanges();
    }).bind(this)();
  }

  getCollectionTags() {
    (async () => {
      let tags = [];
      tags = await this.galleryService.getGalleryTags();
      this.allTags = tags;
      const addedTags: Array<any> = [];
      tags.forEach(element => {
        if (addedTags.indexOf(element['id']) === -1) {
          this.galleryTags.push({
            'name': String(element['name']),
            id: element['id'],
            'media_collection_id': element['media_collection_id'] });
          addedTags.push(element['id']);
        }
      });
      this.galleryTags.sort(function(a, b) {
        const nameA = a.name.toLowerCase(); // ignore upper and lowercase
        const nameB = b.name.toLowerCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      this.cdRef.detectChanges();
    }).bind(this)();
  }

  getMdContent(fileID: string) {
    // console.log(`Calling getMdContent from content.ts ${fileID}`);
    this.mdContentService.getMdContent(fileID)
        .subscribe(
            text => {
              this.mdContent.content = text.content;
            },
            error =>  {}
        );
  }


  doAnalytics(type, name) {
    this.analyticsService.doAnalyticsEvent('Filter', type, String(name));
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('Collections', 'Media-Collections');
  }

  getCollectionLocations() {
    (async () => {
      let locations = [];
      locations = await this.galleryService.getGalleryLocations();
      this.allLocations = locations;
      const addedLocations: Array<any> = [];
      locations.forEach(element => {
        if (addedLocations.indexOf(element['id']) === -1) {
          this.galleryLocations.push({
            'name': String(element['name']),
            id: element['id'],
            'media_collection_id': element['media_collection_id'] });
          addedLocations.push(element['id']);
        }
      });
      this.galleryLocations.sort(function(a, b) {
        const nameA = a.name.toLowerCase(); // ignore upper and lowercase
        const nameB = b.name.toLowerCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      this.cdRef.detectChanges();
    }).bind(this)();
  }

  getCollectionSubjects() {
    (async () => {
      let subjects = [];
      subjects = await this.galleryService.getGallerySubjects();
      this.allSubjects = subjects;
      const addedSubjects: Array<any> = [];
      subjects.forEach(element => {
        if (addedSubjects.indexOf(element['id']) === -1 && String(element['name']).trim() !== '') {
          this.gallerySubjects.push({
            'name': String(element['name']),
            id: element['id'],
            'media_collection_id': element['media_collection_id']
          });
          addedSubjects.push(element['id']);
        }
      });
      this.gallerySubjects.sort(function(a, b) {
        const nameA = a.name.toLowerCase(); // ignore upper and lowercase
        const nameB = b.name.toLowerCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    }).bind(this)();
  }

  filterCollectionsByTag(name) {
    if (name === '') {
      this.galleries = this.allGalleries;
      if ( this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
      return true;
    }
    if (name !== this.prevTag) {
      this.galleries = this.allGalleries;
      this.prevTag = name;
      if (this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
    }
    const galleryIds: Array<any> = [];
    const filteredGalleries = [];
    this.allTags.forEach(element => {
      if (String(element['name']).toLowerCase() === String(name).toLowerCase()) {
        galleryIds.push(element['media_collection_id']);
      }
    });
    this.galleries.forEach(element => {
      if (galleryIds.indexOf(element['id']) !== -1) {
        filteredGalleries.push(element);
      }
    });
    this.galleries = filteredGalleries;
    this.doAnalytics('tag', name);
  }

  filterCollectionsByLocation(name) {
    if (name === '') {
      this.galleries = this.allGalleries;
      if ( this.tagModel !== undefined && this.tagModel !== '' ) {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
      return true;
    }
    if (name !== this.prevLoc) {
      this.galleries = this.allGalleries;
      this.prevLoc = name;
      if ( this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.subjectModel !== undefined && this.subjectModel !== '') {
        this.filterCollectionsBySubject(this.subjectModel);
      }
    }
    const galleryIds: Array<any> = [];
    const filteredGalleries = [];
    this.allLocations.forEach(element => {
      if (String(element['name']).toLowerCase() === String(name).toLowerCase()) {
        galleryIds.push(element['media_collection_id']);
      }
    });
    this.galleries.forEach(element => {
      if (galleryIds.indexOf(element['id']) !== -1) {
        filteredGalleries.push(element);
      }
    });
    this.galleries = filteredGalleries;
    this.doAnalytics('location', name);
  }

  filterCollectionsBySubject(name) {
    if (name === '') {
      this.galleries = this.allGalleries;
      if ( this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
      return true;
    }
    if (name !== this.prevSub) {
      this.galleries = this.allGalleries;
      this.prevSub = name;
      if ( this.tagModel !== undefined && this.tagModel !== '') {
        this.filterCollectionsByTag(this.tagModel);
      }
      if (this.locationModel !== undefined && this.locationModel !== '') {
        this.filterCollectionsByLocation(this.locationModel);
      }
    }
    const filenames: Array<any> = [];
    const filteredGalleries = [];
    this.allSubjects.forEach(element => {
      if (String(element['name']).toLowerCase() === String(name).toLowerCase()) {
        filenames.push(element['media_collection_id']);
      }
    });
    this.galleries.forEach(element => {
      if (filenames.indexOf(element['id']) !== -1) {
        filteredGalleries.push(element);
      }
    });
    this.galleries = filteredGalleries;
    this.doAnalytics('subject', name);
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
  }
  ionViewWillEnter() {
    // Try to remove META-Tags
    this.metadataService.clearHead();
    // Add the new META-Tags
    this.metadataService.addDescription(this.constructor.name);
    this.metadataService.addKeywords();

    this.events.publish('ionViewWillEnter', this.constructor.name);
    this.events.publish('tableOfContents:unSelectSelectedTocItem', {selected: 'media-collections'});
    this.events.publish('SelectedItemInMenu', {
      menuID: 'all',
      component: 'media-collections'
    });
  }

  asThumb(url) {
    return url.replace('.jpg', '_thumb.jpg');
  }

  openMediaCollection(gallery) {
    const nav = this.app.getActiveNavs();
    const params = {
      mediaCollectionId: gallery.id, mediaTitle: gallery.title, fetch: false,
      tag: this.tagModel, subject: this.subjectModel, location: this.locationModel
    };
    nav[0].push('media-collection', params, {animate: true, direction: 'forward', animation: 'ios-transition'});
  }

}
