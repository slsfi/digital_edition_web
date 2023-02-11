import { Injectable } from '@angular/core';

import { ConfigService } from '../config/core/config.service';

@Injectable()
export class PdfService {

  private apiEndPoint: string;
  private projectMachineName: string;
  private collectionPdfs: Array<any>;
  private childrenPdfs: Array<any>;

  constructor(private config: ConfigService) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint');
    this.projectMachineName = this.config.getSettings('app.machineName');
    try {
      this.collectionPdfs = this.config.getSettings('collectionPdfs');
    } catch (e) {
      this.collectionPdfs = [];
    };
    try {
      this.childrenPdfs = this.config.getSettings('collectionChildrenPdfs');
    } catch (e) {
      this.childrenPdfs = [];
    };
  }

  getCollectionChildrenPdfs(collectionID: any) {
    let childrenPdfs = [];
    try {
      childrenPdfs = this.childrenPdfs[collectionID];
    } catch (e) {}
    return childrenPdfs;
  }

  getPdfDetails(facsimileId: string) {
    try {
      for (const collectionId in this.childrenPdfs) {
        for (const pdf of this.childrenPdfs[collectionId]) {
          if (String(pdf.facsimileId) === String(facsimileId)) {
            pdf.pdfUrl = this.urlBase(collectionId) + pdf.pdfFile + '/true';
            return pdf;
          }
        }
      }
      for (const pdf of this.collectionPdfs) {
        if (String(pdf.facsimileId) === String(facsimileId)) {
          pdf.pdfUrl = this.urlBase(pdf.collectionId) + pdf.pdfFile + '/true';
          return pdf;
        }
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  getPdfUrl(facsimileId: any) {
    const pdf = this.getPdfDetails(facsimileId);
    if (pdf) {
      if (pdf.useLocal) {
        return '/assets/sample.pdf';
      }
      return this.urlBase(pdf.collectionId) + pdf.pdfFile.replace('.pdf', '') + '/' + pdf.child;
    }
    return;
  }

  urlBase(collectionId: any) {
    return this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collectionId + '/pdf/';
  }


}
