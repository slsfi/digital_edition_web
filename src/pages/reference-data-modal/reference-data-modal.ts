import { Component } from '@angular/core';
import { NavController, ViewController, NavParams, Events } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { ReferenceDataService } from '../../app/services/reference-data/reference-data.service';
import { Storage } from '@ionic/storage';

/*
  Generated class for the ReferenceDataModal page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-reference-data-modal',
  templateUrl: 'reference-data-modal.html'
})
export class ReferenceDataModalPage {

  public referenceData: any;
  public title: string;

  constructor(  public navCtrl: NavController,
                public viewCtrl: ViewController,
                params: NavParams,
                private storage: Storage,
                private sanitizer: DomSanitizer,
                private referenceDataService: ReferenceDataService,
                private events: Events

  ) {
    const id = String(params.get('id')).split('#')[1];
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
          data => {
              this.referenceData = data;
              if ( String(data).length === 0 && id.includes('/') ) {
                const newId = id.slice(0, id.lastIndexOf('/'));
                if ( newId.length > 0 ) {
                  this.getReferenceData(newId);
                }
              }
              this.storage.get('currentTOCItemTitle').then((currentTOCItemTitle) => {
                if ( currentTOCItemTitle !== '' && currentTOCItemTitle !== undefined && this.referenceData['reference_text'] ) {
                  this.referenceData['reference_text'] =
                  String(this.referenceData['reference_text']).replace('[title]', currentTOCItemTitle)
                }
              });
          },
          error =>  {
              this.referenceData = 'Unable to get referenceData';
          }
        );
  }

   dismiss() {
     this.viewCtrl.dismiss();
     this.events.publish('share:dismiss');
   }
}
