import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { CommentService } from '../../app/services/comments/comment.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';

/*
  Generated class for the CommentModal page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-comment-modal',
  templateUrl: 'comment-modal.html'
})
export class CommentModalPage {

  public comment: any;
  public title: string;

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ModalController,
    public readPopoverService: ReadPopoverService,
    private sanitizer: DomSanitizer,
    private commentService: CommentService,
    params: NavParams,
  ) {
    const id = params.get('id');
    const id_parts = id.split(';');
  if ( id_parts.length > 2 ) {
    const tmpId = id_parts[0] + ';' + id_parts[id_parts.length - 1];
    this.getComment(tmpId);
  } else {
    this.getComment(id);
  }
    this.title = params.get('title');
  }

  ionViewDidLoad() {

  }

  getComment(id: string) {
    this.comment = 'Loading comment ..';
    this.commentService.getComment(id).subscribe(
        (data: any) => {
            this.comment = this.sanitizer.bypassSecurityTrustHtml(
              data.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
                  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            );

          },
        (error: any) =>  {
            this.comment = 'Unable to get comment';
        }
      );
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
