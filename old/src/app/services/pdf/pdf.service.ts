import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '@ngx-config/core';

@Injectable()
export class PdfService {

  private apiEndPoint: string;
  private projectMachineName: string;
  private collectionPdfs: Array<any>;
  private childrenPdfs: Array<any>;

  constructor(private http: Http, private config: ConfigService) {
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

  getCollectionChildrenPdfs(collectionID) {
    let childrenPdfs = [];
    try {
      childrenPdfs = this.childrenPdfs[collectionID];
    } catch (e) {}
    return childrenPdfs;
  }

  private extractData(res: Response) {
    const body = res.json();
    return body || { };
  }

  private handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
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

  getPdfUrl(facsimileId) {
    const pdf = this.getPdfDetails(facsimileId);
    if (pdf) {
      if (pdf.useLocal) {
        return '/assets/sample.pdf';
      }
      return this.urlBase(pdf.collectionId) + pdf.pdfFile.replace('.pdf', '') + '/' + pdf.child;
    }
  }

  urlBase(collectionId) {
    return this.apiEndPoint + '/' + this.projectMachineName + '/files/' + collectionId + '/pdf/';
  }


}
