import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, NavParams } from '@ionic/angular';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { EventsService } from 'src/app/services/events/events.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';

/**
 * Generated class for the PdfPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage({
//   name: 'pdf',
//   segment: 'facsimile/pdf/:facsimileId'
// })
@Component({
  selector: 'page-pdf',
  templateUrl: 'pdf.html',
  styleUrls: ['pdf.scss']
})
export class PdfPage {

  private loading: any;
  public pdf?: string;
  public facsimileId?: string;
  public collectionId?: string;
  public paramPage: any;
  public pdfFile?: string;
  public page = 1;
  public title?: string;
  public pagesLoaded?: 0;


  constructor(
    private loadingCtrl: LoadingController,
    public pdfService: PdfService,
    private events: EventsService,
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute
  ) {
    // this.collectionId = this.params.get('collectionId');
    // this.facsimileId = this.params.get('facsimileId');
    this.events.getOpenPdf().subscribe((p: any) => {
      const facsimileId = p['facsimileId'];
      this.title = this.pdfService.getPdfDetails(facsimileId).title;
      this.analyticsService.doPageView('PDF - ' + this.title);
    });
    this.events.publishPdfviewOpen({'isOpen': true});
  }

  ngOnDestroy() {
    this.events.getOpenPdf().complete();
  }

  ionViewWillLeave() {
    this.events.publishIonViewWillLeave(this.constructor.name);
    this.loading.dismiss();
    this.events.publishPdfviewOpen({'isOpen': false});
  }
  ionViewWillEnter() {
    this.events.publishIonViewWillEnter(this.constructor.name);
  }

  ionViewDidEnter() {
    this.analyticsService.doPageView('PDF');
  }

  async ngOnInit() {
    console.log('ionViewDidLoad PdfPage');
    this.loading = await this.loadingCtrl.create({
      message: 'Laddar ' + this.title
    });
    this.analyticsService.doPageView('PDF - ' + this.title);
    this.loading.present();

    this.route.params.subscribe(params => {
      this.facsimileId = params['facsimileId'];

      if (this.facsimileId) {
        const details = this.pdfService.getPdfDetails(this.facsimileId);
        this.pdfFile = details.pdfFile;
        this.pdf = details.pdfUrl;
        this.title = details.title;
      }
    });

    this.route.queryParams.subscribe(params => {
      this.collectionId = params['collectionId'];
      this.paramPage = params['page'];
    });
  }

  doneLoading() {
    this.loading.dismiss();
    this.page = parseInt(this.paramPage, 10);
  }
}
