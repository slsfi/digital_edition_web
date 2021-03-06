import { Component, Input } from '@angular/core';
import { IonicPage, NavController, LoadingController, NavParams, Events } from 'ionic-angular';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
import { PdfService } from '../../app/services/pdf/pdf.service';

/**
 * Generated class for the PdfPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'pdf',
  segment: 'facsimile/pdf/:facsimileId'
})
@Component({
  selector: 'page-pdf',
  templateUrl: 'pdf.html',
})
export class PdfPage {

  private loading;
  public pdf: string;
  public facsimileId: string;
  public collectionId: string;
  public pdfFile: string;
  public page = 1;
  public title: string;
  public pagesLoaded: 0;


  constructor(
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private params: NavParams,
    public pdfService: PdfService,
    private events: Events,
    private analyticsService: AnalyticsService
  ) {
    this.collectionId = this.params.get('collectionId');
    this.facsimileId = this.params.get('facsimileId');
    const details = this.pdfService.getPdfDetails(this.facsimileId);
    this.pdfFile = details.pdfFile;
    this.pdf = details.pdfUrl;
    this.title = details.title;
    this.events.subscribe('open:pdf', ( p: any ) => {
      const facsimileId = p['facsimileId'];
      this.title = this.pdfService.getPdfDetails(facsimileId).title;
      this.analyticsService.doPageView('PDF - ' + this.title);
    });
    this.events.publish('pdfview:open', {'isOpen': true});
  }

  ngOnDestroy() {
    this.events.unsubscribe('open:pdf');
  }

  ionViewWillLeave() {
    this.events.publish('ionViewWillLeave', this.constructor.name);
    this.loading.dismiss();
    this.events.publish('pdfview:open', {'isOpen': false});
  }
  ionViewWillEnter() {
    this.events.publish('ionViewWillEnter', this.constructor.name);
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('PDF');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PdfPage');
    this.loading = this.loadingCtrl.create({
      content: 'Laddar ' + this.title
    });
    this.analyticsService.doPageView('PDF - ' + this.title);
    this.loading.present();
  }

  doneLoading() {
    this.loading.dismiss();
    this.page = parseInt(this.params.get('page'), 10);
  }
}
