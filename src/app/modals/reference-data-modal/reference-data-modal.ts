import { Component } from '@angular/core';
import { NavController, ModalController, NavParams } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { EventsService } from 'src/app/services/events/events.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ReferenceDataService } from 'src/app/services/reference-data/reference-data.service';

/*
  Generated class for the ReferenceDataModal page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-reference-data-modal',
  templateUrl: './reference-data-modal.html'
})
export class ReferenceDataModalPage {

  public urnResolverUrl: string;
  public referenceData: any;
  public origin: string;
  public thisPageTranslation?: boolean;
  public permaLinkTranslation?: boolean;

  constructor(  public navCtrl: NavController,
                public viewCtrl: ModalController,
                params: NavParams,
                private storage: StorageService,
                private sanitizer: DomSanitizer,
                private referenceDataService: ReferenceDataService,
                private events: EventsService,
                public translate: TranslateService,

  ) {
    // Get url to use for resolving URNs
    this.urnResolverUrl = this.referenceDataService.getUrnResolverUrl();

    // Check if params contain info about which page has initiated the reference modal
    try {
      this.origin = String(params.get('origin'));
    } catch (e) {
      this.origin = '';
    }

    // Check if these label translations exist
    this.translate.get('Reference.thisPage').subscribe(
      translation => {
        if (translation && translation !== 'Reference.thisPage') {
          this.thisPageTranslation = true;
        } else {
          this.thisPageTranslation = false;
        }
      }, error => { this.thisPageTranslation = false; }
    );
    this.translate.get('Reference.permaLink').subscribe(
      translation => {
        if (translation && translation !== 'Reference.permaLink') {
          this.permaLinkTranslation = true;
        } else {
          this.permaLinkTranslation = false;
        }
      }, error => { this.permaLinkTranslation = false; }
    );

    const id = decodeURIComponent(String(params.get('id')).split('#')[1]);
    const idParts = id.split('/');
    let relevantParts = '';
    if ( idParts[0] !== undefined ) {
      relevantParts += idParts[0] + ((idParts[1] === undefined) ? '/' : '');
    }
    if ( idParts[1] !== undefined ) {
      relevantParts += '/' + idParts[1];
    }
    if ( idParts[2] !== undefined ) {
      relevantParts += '/' + idParts[2];
    }
    if ( idParts[3] !== undefined ) {
      relevantParts += '/' + idParts[3];
    }
    if ( idParts[4] !== undefined ) {
      relevantParts += '/' + idParts[4];
    }
    if ( idParts[5] !== undefined && idParts[5] !== 'nochapter' && idParts[5] !== 'not') {
      relevantParts += '/' + idParts[5];
    }
    this.getReferenceData(relevantParts);
  }

  ionViewDidLoad() {
  }

  getReferenceData(id: string) {
    this.referenceData = 'Loading referenceData ..';
    this.referenceDataService.getReferenceData(id).subscribe(
      (data: any) => {
        this.referenceData = data;
        if ( String(data).length === 0 && id.includes('/') ) {
          let newId = '';
          if (id.slice(id.lastIndexOf('/')).includes(';')) {
            newId = id.slice(0, id.lastIndexOf(';'));
          } else {
            newId = id.slice(0, id.lastIndexOf('/'));
          }
          if ( newId.length > 0 ) {
            this.getReferenceData(newId);
          }
        } else {
          this.storage.get('currentTOCItemTitle').then((currentTOCItemTitle) => {
            if ( currentTOCItemTitle !== '' && currentTOCItemTitle !== undefined && this.referenceData['reference_text'] ) {
              this.referenceData['reference_text'] =
              String(this.referenceData['reference_text']).replace('[title]', currentTOCItemTitle)
            }
            if (this.referenceData['reference_text']) {
              this.referenceData['reference_text'] = String(this.referenceData['reference_text']).trim();
              if (this.referenceData['reference_text'].substring(this.referenceData['reference_text'].length - 1) !== ',') {
                this.referenceData['reference_text'] = this.referenceData['reference_text'] + ',';
              }
              this.referenceData['reference_text'] = this.referenceData['reference_text'] + ' ';
            }
          });
        }
      },
      (error: any) =>  {
          this.referenceData = 'Unable to get referenceData';
      }
    );
  }

   dismiss() {
     this.viewCtrl.dismiss();
     this.events.publishShareDismiss();
   }
}
