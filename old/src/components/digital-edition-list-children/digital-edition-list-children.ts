import { Component, Input } from '@angular/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { ConfigService } from '@ngx-config/core';
import { App } from 'ionic-angular';

/**
 * Generated class for the DigitalEditionListChildrenComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'digital-edition-list-children',
  templateUrl: 'digital-edition-list-children.html'
})
export class DigitalEditionListChildrenComponent {
  @Input() layoutType: string;
  @Input() childrenPdfs: any;
  @Input() collectionID?: any;

  show = false;
  apiEndPoint: string;
  projectMachineName: string;
  collectionDownloads: Array<String>;

  constructor(
    private app: App,
    private userSettingsService: UserSettingsService,
    private config: ConfigService,
    private analyticsService: AnalyticsService
  ) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.collectionDownloads = this.config.getSettings('collectionDownloads');
    } catch (e) {
      this.collectionDownloads = [];
    }
  }

  ngOnInit() {
    if (this.childrenPdfs !== undefined && this.childrenPdfs.length) {
      this.setThumbnails(this.childrenPdfs);
      this.setPDF();
    }
  }

  setPDF() {
    for (let i = 0; i < this.childrenPdfs.length; i++) {
      if ( this.collectionDownloads['pdf'] !== undefined &&
      this.collectionDownloads['pdf'][String(this.childrenPdfs[i].collectionId)] !== undefined ) {
        if ( this.childrenPdfs[i] !== undefined ) {
          this.childrenPdfs[i]['pdf'] = {
            'url': this.collectionDownloads['pdf'][String(this.childrenPdfs[i].collectionId)].title,
            'isDownload': (String(this.childrenPdfs[i].url).length > 0) ? true : false
          };
        }
        this.childrenPdfs[i].isDownload = (String(this.childrenPdfs[i].url).length > 0) ? true : false;
        this.childrenPdfs[i].pdfFile = this.collectionDownloads['pdf'][String(this.childrenPdfs[i].collectionId)].title;
      }

      if ( this.collectionDownloads['epub'] !== undefined && this.childrenPdfs[i].collectionId in this.collectionDownloads['epub'] ) {
        if ( this.childrenPdfs[i] !== undefined ) {
          this.childrenPdfs[i]['epub'] = {
            'url': this.collectionDownloads['epub'][String(this.childrenPdfs[i].collectionId)].title,
            'isDownload': (String(this.childrenPdfs[i].url).length > 0) ? true : false
          };
        }
        this.childrenPdfs[i].isDownload = (String(this.childrenPdfs[i].url).length > 0) ? true : false;
      }
    }
  }

  downloadBook(event: Event, collection, type) {
    event.stopPropagation();
    if (collection.isDownload) {
      if (collection.collectionId in this.collectionDownloads['pdf'] && type === 'pdf') {
        const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.collectionId + '/pdf/' +
          this.collectionDownloads['pdf'][collection.collectionId].title + '/' +
          this.collectionDownloads['pdf'][collection.collectionId].title;
        const ref = window.open(dURL);
        this.analyticsService.doAnalyticsEvent('Download', 'PDF', this.collectionDownloads['pdf'][collection.id]);
      } else if (collection.collectionId in this.collectionDownloads['epub'] && type === 'epub') {
        const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collection.collectionId + '/epub/' +
          this.collectionDownloads['epub'][collection.collectionId].title + '/' +
          this.collectionDownloads['epub'][collection.collectionId].title;
        const ref = window.open(dURL);
        this.analyticsService.doAnalyticsEvent('Download', 'EPUB', this.collectionDownloads['epub'][collection.collectionId]);
      }
    }
  }

  setThumbnails(childrenPdfs) {
    for (const edition of childrenPdfs) {
      let imageType = 'jpg';

      if (edition['cover'] === undefined && edition['thumbnail'] !== undefined) {
        edition['cover'] = edition.thumbnail;
      }

      if (edition.cover.includes('.png')) {
        imageType = 'png';
      }

      const coverImage = edition.cover.split(`.${imageType}`)[0];
      edition['thumbnail'] = `assets/images/cover_pages/${coverImage}.${imageType}`;
    }

    this.show = true;
  }

  downloadPDF(event, edition) {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    this.analyticsService.doAnalyticsEvent('Download', 'PDF', edition.pdfFile);
    const isChildPdf = true;
    const dURL = this.apiEndPoint + '/' + this.projectMachineName + '/files/' + this.collectionID + '/pdf/' +
    edition.pdfFile + '/' + isChildPdf;
    const ref = window.open(dURL, '_self', 'location=no');
  }

  showPDF(edition) {
    const isChildPdf = true;
    const nav = this.app.getActiveNavs();
    const params = {facsimileId: edition.facsimileId, page: 1};
    nav[0].push('pdf', params);
  }
}
