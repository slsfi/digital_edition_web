import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { ConfigService } from '@ngx-config/core';
import { HttpClient } from '@angular/common/http';
import { TextService } from '../../app/services/texts/text.service';
/**
 * Generated class for the IllustrationsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'illustrations',
  templateUrl: 'illustrations.html'
})
export class IllustrationsComponent {
  text: string;
  illustrationsPath = 'assets/images/illustrations/2/';
  imgPath: any;
  image: any[] = [
    { src: 'https://picsum.photos/id/237/200/300', id: ''}
  ];
  constructor(
    public navParams: NavParams,
    private config: ConfigService,
    private textService: TextService,
    private _http: HttpClient
  ) {
    this.text = 'Hello World';
  }
  ngOnInit() {
    console.log(this.navParams);
    console.log(this.config.getSettings('app.apiEndpoint') + '/');

    console.log(this.textService);

    const api = this.config.getSettings().app.apiEndpoint;
    const url = `${api}/topelius/media/image/metadata//173`;

    this._http.get(url).subscribe((data) => {
      console.log(data);
    })
  }
  // ionViewWillLoad() {
  //   if (this.navParams.get('galleryPage') !== undefined) {
  //     console.log(this.navParams.get('galleryPage'), 'blääää');
  //     const page = this.config.getSettings('galleryImages.' + this.navParams.get('galleryPage'));
  //     this.imgPath = this.illustrationsPath + page.prefix + this.navParams.get('imageNumber') + '.jpg';
  //   } else {
  //     this.imgPath = this.illustrationsPath + 'FFiT_' + this.navParams.get('imageNumber') + '.jpg';
  //   }
  // }
}
