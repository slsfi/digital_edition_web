import { ConfigService } from '@ngx-config/core';
import { Component } from '@angular/core';
import { NavController, ViewController, NavParams, App, Platform } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { SemanticDataService } from '../../app/services/semantic-data/semantic-data.service';
import { TranslateService } from '@ngx-translate/core';

/*
  Generated class for the SemanticDataModal page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-semantic-data-modal',
  templateUrl: 'semantic-data-modal.html'
})
export class SemanticDataModalPage {

  public semanticData: any;
  public title: string;
  public description: string;
  public segments: string;
  public legacyPrefix: string;
  public subjectOccurrences: Array<object>;
  public locationOccurrences: Array<object>;
  public tagOccurrences: Array<object>;
  public workOccurrences: Array<object>;
  public type: string;

  constructor(  public navCtrl: NavController,
                public viewCtrl: ViewController,
                params: NavParams,
                private sanitizer: DomSanitizer,
                public translate: TranslateService,
                private semanticDataService: SemanticDataService,
                protected config: ConfigService,
                private app: App,
                private platform: Platform,
                public navParams: NavParams

  ) {
    let id = params.get('id');

    this.legacyPrefix = '';
    try {
      const useLegacy = this.config.getSettings('app.useLegacyIdsForSemanticData');
      if ( useLegacy ) {
        this.legacyPrefix = this.config.getSettings('app.legacyIdPrefix');
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
      this.getPerson(id);
      this.getTagOccurrencesById(id);
    }

    if (this.type === 'work') {
      this.getPerson(id);
      this.getWorkOccurrencesById(id);
    }
  }

  ionViewDidLoad() {

  }

  getPlace(id: string) {
      this.semanticDataService.getPlace(id).subscribe(
          data => {
              // in order to get id attributes for tooltips
              this.title = data.name;
              this.description = data.description;
              this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
                data.replace(/images\//g, 'assets/images/')
                    .replace(/\.png/g, '.svg')
              );

            },
          error =>  {
              this.semanticData = 'Unable to get semanticData';
          }
        );
  }

  getPerson(id: string) {
      this.semanticDataService.getPerson(id).subscribe(
          data => {
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
          error =>  {
              this.semanticData = 'Unable to get semanticData';
          }
        );
  }

  public getSubjectOccurrencesById(id: string) {
    this.semanticDataService.getSubjectOccurrencesById(id).subscribe(
      data => {
        this.subjectOccurrences = data;
      },
      error =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  public getLocationOccurrencesById(id: string) {
    this.semanticDataService.getLocationOccurrencesById(id).subscribe(
      data => {
        this.locationOccurrences = data;
      },
      error =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  public getTagOccurrencesById(id: string) {
    this.semanticDataService.getTagOccurrencesById(id).subscribe(
      data => {
        this.tagOccurrences = data;
      },
      error =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  public getWorkOccurrencesById(id: string) {
    this.semanticDataService.getWorkOccurrencesById(id).subscribe(
      data => {
        this.workOccurrences = data;
      },
      error =>  {
          this.semanticData = 'Unable to get semanticData';
      }
    );
  }

  getSemanticData(id: string) {
      this.semanticData = 'Loading semanticData ..';
      this.semanticDataService.getSemanticData(id).subscribe(
          data => {
              this.semanticData = this.sanitizer.bypassSecurityTrustHtml(
                data.replace(/images\//g, 'assets/images/')
                    .replace(/\.png/g, '.svg')
              );
            },
          error =>  {
              this.semanticData = 'Unable to get semanticData';
          }
        );
  }

  openText(text: any) {
    const params = {};
    const nav = this.app.getActiveNavs();
    const col_id = text.collection_id;
    const pub_id = text.publication_id;
    let text_type: string;

    if (text.publication_facsimile_id !== null) {
      text_type = 'facsimile';
    } else if (text.publication_comment_id !== null) {
      text_type = 'commentary';
    } else if (text.publication_version_id !== null) {
      text_type = 'variation'
    } else if (text.publication_manuscript_id !== null) {
      text_type = 'manuscript'
    } else {
      text_type = 'established';
    }

    params['tocLinkId'] = text.collection_id;
    params['collectionID'] = col_id;
    params['publicationID'] = pub_id;
    /*if ( text.facsimilePage ) {
      params['facsimilePage'] = text.facsimile_page;
    } else {
      params['facsimilePage'] = null;
    }*/

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

    if (this.platform.is('mobile')) {
      this.viewCtrl.dismiss();
      this.app.getRootNav().push('read', params);
    } else {
      this.viewCtrl.dismiss();
      this.app.getRootNav().push('read', params);
    }
  }

   dismiss() {
     this.viewCtrl.dismiss();
   }
}
