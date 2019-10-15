import { Component, Input } from '@angular/core';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
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

  constructor(
    private app: App,
    private userSettingsService: UserSettingsService,
    private config: ConfigService
  ) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
  }

  ngOnInit() {
    if (this.childrenPdfs && this.childrenPdfs.length) {
      this.setThumbnails(this.childrenPdfs);
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
