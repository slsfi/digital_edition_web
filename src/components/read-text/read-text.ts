import { Component, Input, ElementRef, Renderer } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { Storage } from '@ionic/storage';
import { ToastController, Events, ModalController } from 'ionic-angular';
import { IllustrationPage } from '../../pages/illustration/illustration';
import { ConfigService } from '@ngx-config/core';
import { TextCacheService } from '../../app/services/texts/text-cache.service';

/**
 * Generated class for the ReadTextComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'read-text',
  templateUrl: 'read-text.html'
})
export class ReadTextComponent {

  @Input() link: string;
  @Input() matches?: Array<string>;
  @Input() external?: string;
  public text: any;
  protected errorMessage: string;
  defaultView: string;

  constructor(
    public events: Events,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    protected storage: Storage,
    private toastCtrl: ToastController,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private config: ConfigService,
    protected modalController: ModalController
  ) {
    this.defaultView = this.config.getSettings('defaults.ReadModeView');
  }

  ngOnInit() {
    if ( this.external !== undefined && this.external !== null ) {
      const extParts = String(this.external).split(' ');
      this.textService.getCollectionAndPublicationByLegacyId(extParts[0] + '_' + extParts[1]).subscribe(data => {
        if ( data[0] !== undefined ) {
          this.link = data[0]['coll_id'] + '_' + data[0]['pub_id'];
        }
        this.setText();
      });
    } else {
      this.setText();
    }
  }

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      if (event.target.parentNode.classList.contains('ref_illustration')) {
        const hashNumber = event.target.parentNode.hash;
        const imageNumber = hashNumber.split('#')[1];
        this.openIllustration(imageNumber);
      }
    });
  }

  openIllustration(imageNumber) {
    const modal = this.modalController.create(IllustrationPage,
      { 'imageNumber': imageNumber },
      { cssClass: 'foo' }
    );
    modal.present();
    modal.onDidDismiss(data => {

    });
  }

  onClickFFiT(event) {
  }

  getCacheText(id: string) {
    this.storage.get(id).then((content) => {
      this.text = content;
      this.text = this.sanitizer.bypassSecurityTrustHtml(
        content.replace(/images\//g, 'assets/images/')
          .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"')
      );
      this.matches.forEach(function (val) {
        const re = new RegExp('(' + val + ')', 'g');
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          content.replace(re, '<match>$1</match>')
        );
      }.bind(this));
    });
  }

  setText() {
    this.storage.get(this.link + '_est').then((content) => {
      if (content) {
        this.getCacheText(this.link + '_est');
      } else {
        this.getEstText();
      }
      this.doAnalytics();
    });
  }

  getEstText() {
    this.textService.getEstablishedText(this.link).subscribe(
      text => {
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          text.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"tei $1\"')
        );
        if (this.matches instanceof Array) {
          this.matches.forEach(function (val) {
            const re = new RegExp('(' + val + ')', 'g');
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              text.replace(re, '<match>$1</match>')
            );
          }.bind(this));
        }
      },
      error => { this.errorMessage = <any>error }
    );
  }

  doAnalytics() {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Established',
        eventLabel: 'Established',
        eventAction: this.link,
        eventValue: 10
      });
    } catch ( e ) {
    }
  }
}
