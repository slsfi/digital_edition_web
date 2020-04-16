import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

/**
 * Generated class for the IllustrationsZoomModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-illustrations-zoom-modal',
  templateUrl: 'illustrations-zoom-modal.html',
})
export class IllustrationsZoomModalPage {
  image: any;
  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
  }

  ionViewDidLoad() {
    this.image = this.navParams.get('image');
  }

  cancel() {
    this.viewCtrl.dismiss(this.viewCtrl);
  }

}
