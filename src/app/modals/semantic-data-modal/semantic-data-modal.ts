import { Component } from '@angular/core';
import { NavController, ModalController, NavParams, Platform } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { SemanticDataService } from 'src/app/services/semantic-data/semantic-data.service';

/*
  Generated class for the SemanticDataModal page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-semantic-data-modal',
  templateUrl: './semantic-data-modal.html',
  styleUrls: ['semantic-data-modal.scss']
})
export class SemanticDataModalPage {

  public semanticData: any;
  public title: string;
  public description: string;
  public segments: string;
  public legacyPrefix: string;
  public subjectOccurrences: any;
  public locationOccurrences: any;
  public tagOccurrences: any;
  public workOccurrences: any;
  public type: string;
  public publicationTOCNames: Array<object>;

  constructor(  public navCtrl: NavController,
                public viewCtrl: ModalController,
                params: NavParams,
                private sanitizer: DomSanitizer,
                public translate: TranslateService,
                private semanticDataService: SemanticDataService,
                protected config: ConfigService,
                private platform: Platform,
                public navParams: NavParams,
                public router: Router,

  ) {
    let id = params.get('id');
    this.publicationTOCNames = [];

    this.legacyPrefix = '';
    this.description = '';
    try {
      const useLegacy = this.config.getSettings('app.useLegacyIdsForSemanticData');
      if ( useLegacy ) {
        this.legacyPrefix = this.config.getSettings('app.legacyIdPrefix') as string;
      }
    } catch (e) {
    }

    id = this.legacyPrefix + id;

    const id_parts = id.split(';');
    this.title = params.get('title');
    this.type = params.get('type');
    this.segments = 'title';
    this.subjectOccurrences = [];
    this.locationOccurrences = [];
    this.tagOccurrences = [];
    this.workOccurrences = [];

    if (this.type === 'place') {
      this.getPlace(id);
      this.getLocationOccurrencesById(id);
    }

    if (this.type === 'person') {
      this.getPerson(id);
      this.getSubjectOccurrencesById(id);
    }

    if (this.type === 'tag') {
      this.getTag(id);
      this.getTagOccurrencesById(id);
    }

    if (this.type === 'work') {
      this.getWork(params.get('id'));
      this.getWorkOccurrencesById(params.get('id'));
    }
  }

  ionViewDidLoad() {

  }

  getTag(id: string) {
    this.semanticDataService.getTag(id).subscribe(
        (data: any) => {
            // in order to get id attributes for tooltips
            this.title = data.name;
            this.description = data.description;
            this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
              String(data).replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );

          },
        (error: any) =>  {
            this.semanticData = 'Unable to get semanticData';
        }
      );
  }

  getPublicationTOCName(occ_data: any, all_data: any) {
    const itemId = occ_data['occurrences'][0]['collection_id'] + '_' + occ_data['occurrences'][0]['publication_id'];
    this.semanticDataService.getPublicationTOC(occ_data['occurrences'][0]['collection_id']).subscribe(
      (toc_data: any) => {
          this.updatePublicationNames(toc_data, all_data, itemId);
        },
      (error: any) =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  getWork(id: string) {
    this.semanticDataService.getWork(id).subscribe(
        (data: any) => {
            // in order to get id attributes for tooltips
            this.title = data.title;
            this.description = data.description;
            this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
              String(data).replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );

          },
        (error: any) =>  {
            this.semanticData = 'Unable to get semanticData';
        }
      );
  }

  getPlace(id: string) {
      this.semanticDataService.getPlace(id).subscribe(
          (data: any) => {
              // in order to get id attributes for tooltips
              this.title = data.name;
              this.description = data.description;
              this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
                String(data).replace(/images\//g, 'assets/images/')
                    .replace(/\.png/g, '.svg')
              );

            },
          (error: any) =>  {
              this.semanticData = 'Unable to get semanticData';
          }
        );
  }

  getPerson(id: string) {
      this.semanticDataService.getPerson(id).subscribe(
          (data: any) => {
              this.title = data['full_name'];
              this.description = data.description;
              // in order to get id attributes for tooltips
              if ( data['description'] !== undefined && data['description'] !== null ) {
                this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
                  // @TODO: Refactor this.
                  data['description'].replace(/images\//g, 'assets/images/')
                      .replace(/\.png/g, '.svg')
                      .replace(((data['c_webbefternamn1'] != null) ? data['c_webbefternamn1'] : '')
                      + ((data['c_webbefternamn1'] != null && data['c_webbfornamn1'] != null) ? ', ' : '')
                      + ((data['c_webbfornamn1'] != null) ? data['c_webbfornamn1'] : ''), '<b>'
                      + ((data['c_webbefternamn1'] != null) ? data['c_webbefternamn1'] : '')
                      + ((data['c_webbefternamn1'] != null && data['c_webbfornamn1'] != null) ? ', ' : '')
                      + ((data['c_webbfornamn1'] != null) ? data['c_webbfornamn1'] : '') + '</b>')
                );
              } else {
                data['description'] = '';
              }

            },
          (error: any) =>  {
              this.semanticData = 'Unable to get semanticData';
          }
        );
  }

  public getSubjectOccurrencesById(id: string) {
    this.semanticDataService.getSubjectOccurrencesById(id).subscribe(
      (data: any) => {
        this.subjectOccurrences = data;
        const addedTOCs: Array<String> = [];
        this.subjectOccurrences.forEach((element: any) => {
            if ( element['occurrences'][0]['collection_id'] !== undefined &&
             addedTOCs.includes(element['occurrences'][0]['collection_id']) === false ) {
              this.getPublicationTOCName(element, this.subjectOccurrences);
              addedTOCs.push(element['occurrences'][0]['collection_id']);
            }
        });
      },
      (error: any) =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  public updatePublicationNames(tocData: any, allData: any, itemId: any) {
    tocData.forEach( (item: any) => {
        allData.forEach((data: any) => {
          data['occurrences'].forEach((occ: any) => {
            const id =  occ['collection_id'] + '_' + occ['publication_id'];
            if ( id === item['itemId'] ) {
              occ['publication_name'] = item['text'];
            }
          });
        });
    });
  }

  public getLocationOccurrencesById(id: string) {
    this.semanticDataService.getLocationOccurrencesById(id).subscribe(
      (data: any) => {
        this.locationOccurrences = data;
        const addedTOCs: Array<String> = [];
        this.locationOccurrences.forEach((element: any) => {
          if ( element['occurrences'][0]['collection_id'] !== undefined &&
             addedTOCs.includes(element['occurrences'][0]['collection_id']) === false ) {
              this.getPublicationTOCName(element, this.locationOccurrences);
              addedTOCs.push(element['occurrences'][0]['collection_id']);
          }
        });
      },
      (error: any) =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  public getTagOccurrencesById(id: string) {
    this.semanticDataService.getTagOccurrencesById(id).subscribe(
      (data: any) => {
        this.tagOccurrences = data;
        const addedTOCs: Array<String> = [];
        this.tagOccurrences.forEach((element: any) => {
          if ( element['occurrences'][0]['collection_id'] !== undefined &&
             addedTOCs.includes(element['occurrences'][0]['collection_id']) === false ) {
              this.getPublicationTOCName(element, this.tagOccurrences);
              addedTOCs.push(element['occurrences'][0]['collection_id']);
          }
        });
      },
      (error: any) =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  public getWorkOccurrencesById(id: string) {
    this.semanticDataService.getWorkOccurrencesById(id).subscribe(
      (data: any) => {
        this.workOccurrences = data;
        const addedTOCs: Array<String> = [];
        this.workOccurrences.forEach((element: any) => {
          if ( element['occurrences'][0]['collection_id'] !== undefined &&
             addedTOCs.includes(element['occurrences'][0]['collection_id']) === false ) {
              this.getPublicationTOCName(element, this.workOccurrences);
              addedTOCs.push(element['occurrences'][0]['collection_id']);
          }
        });
      },
      (error: any) =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  getSemanticData(id: string) {
      this.semanticData = 'Loading semanticData ..';
      this.semanticDataService.getSemanticData(id).subscribe(
          (data: any) => {
              this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
                String(data).replace(/images\//g, 'assets/images/')
                    .replace(/\.png/g, '.svg')
              );
            },
          (error: any) =>  {
              this.semanticData = 'Unable to get semanticData';
          }
        );
  }

  openText(text: any) {
    const params = {} as any;
    const col_id = (text.collection_id !== undefined ) ? text.collection_id : text.publication_collection_id;
    const pub_id = (text.publication_id !== undefined) ? text.publication_id : text.id;
    let text_type: string;

    if (text.publication_facsimile_id !== undefined && text.publication_facsimile_id !== null) {
      text_type = 'facsimiles';
    } else if (text.publication_comment_id !== undefined && text.publication_comment_id !== null) {
      text_type = 'comments';
    } else if (text.publication_version_id !== undefined && text.publication_version_id !== null) {
      text_type = 'variations'
    } else if (text.publication_manuscript_id !== undefined && text.publication_manuscript_id !== null) {
      text_type = 'manuscripts'
    } else {
      text_type = 'established';
    }

    if (this.type === 'work') {
      text_type = 'established';
    }

    params['tocLinkId'] = col_id;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;

    params['views'] = [
      {
        type: text_type,
        id: text.linkID
      }
    ];

    params['occurrenceResult'] = text;

    if (this.navParams.get('showOccurrencesModalOnRead')) {
      params['showOccurrencesModalOnRead'] = true;
    }

      this.viewCtrl.dismiss();
      // TODO Sami
      this.router.navigate(['/read'], params);
  }

   dismiss() {
     this.viewCtrl.dismiss();
   }
}
