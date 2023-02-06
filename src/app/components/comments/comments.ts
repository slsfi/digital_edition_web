import { Component, Input, Renderer2, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { IllustrationPage } from '../../pages/illustration/illustration';
import { ModalController } from '@ionic/angular';
import { CommonFunctionsService } from 'src/app/services/common-functions/common-functions.service';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { EventsService } from 'src/app/services/events/events.service';
import { TextService } from 'src/app/services/texts/text.service';
import { CommentService } from 'src/app/services/comments/comment.service';
import { ReadPopoverService } from 'src/app/services/settings/read-popover.service';
/**
 * Class for the CommentsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'comments',
  templateUrl: 'comments.html',
  styleUrls: ['comments.scss']
})
export class CommentsComponent {

  @Input() link?: string;
  @Input() matches?: Array<string>;
  @Input() external?: string;
  @Output() openNewIntroView: EventEmitter<any> = new EventEmitter();
  public text: any;
  protected errorMessage?: string;
  manuscript: any;
  sender: any;
  receiver: any;
  letter: any;
  textLoading: Boolean = true;
  private unlistenClickEvents?: () => void;

  constructor(
    protected readPopoverService: ReadPopoverService,
    protected commentService: CommentService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    private renderer2: Renderer2,
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private events: EventsService,
    private analyticsService: AnalyticsService,
    public translate: TranslateService,
    protected modalController: ModalController,
    public commonFunctions: CommonFunctionsService
  ) {
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
    this.getCorrespondanceMetadata();
    this.setUpTextListeners();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.unlistenClickEvents?.();
  }

  setText() {
    this.commentService.getComment(this.link || '').subscribe(
      text => {
        this.textLoading = false;
        if (text === '' || text === null || text === undefined || text.length < 1) {
          this.translate.get('Read.Comments.NoComments').subscribe(
            translation => {
              this.text = translation;
            }, err => { }
          );
        } else {
          this.text = this.commonFunctions.insertSearchMatchTags(String(text), this.matches ?? []);
          this.text = this.sanitizer.bypassSecurityTrustHtml(
            this.text.replace(/images\//g, 'assets/images/')
              .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiComment $1\"')
              .replace(/(teiComment teiComment )/g, 'teiComment ')
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          );
        }
        this.doAnalytics();
      },
      error =>  {
        console.error('Error loading comments...', this.link);
        this.errorMessage = <any>error;
        this.textLoading = false;
      }
    );
  }

  doAnalytics() {
    this.analyticsService.doAnalyticsEvent('Comments', 'Comments', String(this.link));
  }

  openNewView( event: any, id: any, type: string ) {
    let openId = id;
    let chapter = null;
    if (String(id).includes('ch')) {
      openId = String(String(id).split('ch')[0]).trim();
      chapter = 'ch' + String(String(id).split('ch')[1]).trim();
    }
    this.events.publishShowView({
      type, openId, chapter
    })
  }

  openNewIntro( event: any, id: any ) {
    id.viewType = 'introduction';
    this.openNewIntroView.emit(id);
  }

  private setUpTextListeners() {
    // We must do it like this since we want to trigger an event on a dynamically loaded innerhtml.
    const nElement: HTMLElement = this.elementRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {

      /* CLICK EVENTS */
      this.unlistenClickEvents = this.renderer2.listen(nElement, 'click', (event) => {
        try {
          // This check for xreference is necessary since we don't want the comment to
          // scroll if the clicked target is a link in a comment. Clicks on links are
          // handled by read.ts.
          let targetIsLink = false;
          let targetElem: HTMLElement | null = event.target as HTMLElement;

          if ( targetElem.classList.contains('xreference')
          || (targetElem.parentElement !== null && targetElem.parentElement.classList.contains('xreference'))
          || (targetElem.parentElement?.parentElement !== null &&
            targetElem.parentElement?.parentElement.classList.contains('xreference')) ) {
            targetIsLink = true;
          }

          if (!targetIsLink && this.readPopoverService.show.comments) {
            // This is linking to a comment lemma ("asterisk") in the reading text,
            // i.e. the user has clicked a comment in the comments-column.
            event.preventDefault();

            // Find the comment element that has been clicked in the comment-column.
            if (!targetElem.classList.contains('commentScrollTarget')) {
              targetElem = targetElem.parentElement;
              while (targetElem !== null
              && !targetElem.classList.contains('commentScrollTarget')
              && targetElem.tagName !== 'COMMENT') {
                targetElem = targetElem.parentElement;
              }
            }
            if (targetElem !== null && targetElem !== undefined) {
              // Find the lemma in the reading text. Remove all non-digits at the start of the comment's id.
              const numId = targetElem.classList[targetElem.classList.length - 1].replace( /^\D+/g, '');
              const targetId = 'start' + numId;
              let lemmaStart = document.querySelector('page-read:not([hidden]) read-text') as HTMLElement;
              lemmaStart = lemmaStart.querySelector('[data-id="' + targetId + '"]') as HTMLElement;
              if ( (lemmaStart.parentElement !== null
              && lemmaStart.parentElement.classList.contains('ttFixed'))
              || (lemmaStart.parentElement?.parentElement !== null
              && lemmaStart.parentElement?.parentElement.classList.contains('ttFixed')) ) {
                // The lemma is in a footnote, so we should get the second element with targetId
                lemmaStart = document.querySelector('page-read:not([hidden]) read-text') as HTMLElement;
                lemmaStart = lemmaStart.querySelectorAll('[data-id="' + targetId + '"]')[1] as HTMLElement;
              }
              if (lemmaStart !== null && lemmaStart !== undefined) {
                // Scroll to start of lemma in reading text and temporarily prepend arrow.
                this.commentService.scrollToCommentLemma(lemmaStart);
                // Scroll to comment in the comments-column.
                this.commentService.scrollToComment(numId, targetElem);
              }
            }
          }

          // Check if click on a link to an illustration that should be opened in a modal
          if (targetIsLink && targetElem?.classList.contains('ref_illustration')) {
            const illRefElem = targetElem as HTMLAnchorElement;
            const hashNumber = illRefElem.hash;
            const imageNumber = hashNumber.split('#')[1];
            this.ngZone.run(() => {
              this.openIllustration(imageNumber);
            });
          }
        } catch (e) {}
      });

    });
  }

  getCorrespondanceMetadata() {
    this.commentService.getCorrespondanceMetadata(String(this.link).split('_')[1]).subscribe(
      text => {
        if (text['subjects'] !== undefined && text['subjects'] !== null) {
          if (text['subjects'].length > 0) {
            const senders = [] as any;
            const receivers = [] as any;
            text['subjects'].forEach((subject: any) => {
              if ( subject['avs\u00e4ndare'] ) {
                senders.push(subject['avs\u00e4ndare']);
              }
              if ( subject['mottagare'] ) {
                receivers.push(subject['mottagare']);
              }
            });
            this.sender = this.commonFunctions.concatenateNames(senders);
            this.receiver = this.commonFunctions.concatenateNames(receivers);
          }
        }

        if (text['letter'] !== undefined && text['letter'] !== null) {
          this.letter = text['letter'];
          this.doAnalytics();
        }
      },
      error => {
        this.errorMessage = <any>error;
      }
    );
  }

  async openIllustration(imageNumber: any) {
    const modal = await this.modalController.create({
      component: IllustrationPage,
      cssClass: 'foo',
      componentProps: {
        'imageNumber': imageNumber,
      }
    });
    modal.present();
  }
}
