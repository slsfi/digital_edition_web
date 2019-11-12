import { Component } from '@angular/core';
import { NavController, ViewController, NavParams, Events } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { ReferenceDataService } from '../../app/services/reference-data/reference-data.service';

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
                private sanitizer: DomSanitizer,
                private referenceDataService: ReferenceDataService,
                private events: Events

  ) {
    const id = String(params.get('id')).split('#')[1];
    const type = params.get('type');
    this.getReferenceData(id);
  }



  ionViewDidLoad() {

  }

  getReferenceData(id: string) {
      this.referenceData = 'Loading referenceData ..';
      this.referenceDataService.getReferenceData(id).subscribe(
          data => {
              this.referenceData = data;
            },
          error =>  {
              this.referenceData = 'Unable to get referenceData';
          }
        );
  }

   dismiss() {
     this.viewCtrl.dismiss();
   }
}
