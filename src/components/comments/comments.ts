import { Component, Input, Renderer2, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReadTextComponent } from '../read-text/read-text';
import { TextService } from '../../app/services/texts/text.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { CommentService } from '../../app/services/comments/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import { AnalyticsService } from '../../app/services/analytics/analytics.service';
/**
 * Class for the CommentsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'comments',
  templateUrl: 'comments.html'
})
export class CommentsComponent {

  @Input() link: string;
  @Input() matches?: Array<string>;
  @Input() external?: string;
  @Output() openNewIntroView: EventEmitter<any> = new EventEmitter();
  public text: any;
  protected errorMessage: string;
  manuscript: any;
  sender: any;
  receiver: any;
  letter: any;
  textLoading: Boolean = true;
  private unlistenClickEvents: () => void;

  constructor(
    protected readPopoverService: ReadPopoverService,
    protected commentService: CommentService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    private renderer2: Renderer2,
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private events: Events,
    private analyticsService: AnalyticsService,
    public translate: TranslateService
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
    this.unlistenClickEvents();
  }

  setText() {
    this.commentService.getComment(this.link).subscribe(
      text => {
        this.textLoading = false;
        if (text === '' || text === null || text === undefined || text.length < 1) {
          this.translate.get('Read.Comments.NoComments').subscribe(
            translation => {
              this.text = translation;
            }, err => { }
          );
        } else {
          // in order to get id attributes for tooltips
          this.text = this.sanitizer.bypassSecurityTrustHtml (
            String(text).replace(/images\//g, 'assets/images/')
              .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiComment $1\"')
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

  openNewView( event, id: any, type: string ) {
    let openId = id;
    let chapter = null;
    if (String(id).includes('ch')) {
      openId = String(String(id).split('ch')[0]).trim();
      chapter = 'ch' + String(String(id).split('ch')[1]).trim();
    }
    this.events.publish('show:view', type, openId, chapter);
  }

  openNewIntro( event, id: any ) {
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
          let targetElem: HTMLElement = event.target as HTMLElement;

          if ( targetElem.classList.contains('xreference')
          || (targetElem.parentElement !== null && targetElem.parentElement.classList.contains('xreference'))
          || (targetElem.parentElement.parentElement !== null &&
            targetElem.parentElement.parentElement.classList.contains('xreference')) ) {
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
              // Find the lemma in the reading text. Replace all non-digits at the start of the comment's id with nothing.
              const numId = targetElem.classList[targetElem.classList.length - 1].replace( /^\D+/g, '');
              const targetId = 'start' + numId;
              let lemmaStart = document.querySelector('read-text').querySelector('[data-id="' + targetId + '"]') as HTMLElement;
              if ( (lemmaStart.parentElement !== null
              && lemmaStart.parentElement.classList.contains('ttFixed'))
              || (lemmaStart.parentElement.parentElement !== null
              && lemmaStart.parentElement.parentElement.classList.contains('ttFixed')) ) {
                // The lemma is in a footnote, so we should get the second element with targetId
                lemmaStart = document.querySelector('read-text').querySelectorAll('[data-id="' + targetId + '"]')[1] as HTMLElement;
              }
              if (lemmaStart !== null && lemmaStart !== undefined) {
                // Scroll to start of lemma in reading text and temporarily prepend arrow.
                this.scrollToCommentLemma(lemmaStart);
                // Scroll to comment in the comments-column.
                this.scrollToComment(numId, targetElem);
              }
            }
          }
        } catch (e) {}
      });

    });
  }

  /* Use this function to scroll the lemma of a comment into view in the reading text view. */
  private scrollToCommentLemma(lemmaStartElem: HTMLElement, timeOut = 5000) {
    if (lemmaStartElem !== null && lemmaStartElem !== undefined && lemmaStartElem.classList.contains('anchor_lemma')) {

      if (this.commentService.activeLemmaHighlight.lemmaTimeOutId !== null) {
        // Clear previous lemma highlight if still active
        this.commentService.activeLemmaHighlight.lemmaElement.style.display = null;
        window.clearTimeout(this.commentService.activeLemmaHighlight.lemmaTimeOutId);
      }

      lemmaStartElem.style.display = 'inline';
      this.scrollElementIntoView(lemmaStartElem);
      const settimeoutId = setTimeout(() => {
        lemmaStartElem.style.display = null;
        this.commentService.activeLemmaHighlight = {
          lemmaTimeOutId: null,
          lemmaElement: null
        }
      }, timeOut);

      this.commentService.activeLemmaHighlight = {
        lemmaTimeOutId: settimeoutId,
        lemmaElement: lemmaStartElem
      }
    }
  }

  /** Use this function to scroll to the comment with the specified numeric id
   *  (excluding prefixes like 'end') in the first comments view on the page.
   *  Alternatively, the comment element can be passed as an optional parameter. */
  private scrollToComment(numericId: string, commentElement?: HTMLElement) {
    let elem = commentElement;
    if (elem === undefined || elem === null || !elem.classList.contains('en' + numericId)) {
      // Find the comment in the comments view.
      const commentsWrapper = document.querySelector('comments') as HTMLElement;
      elem = commentsWrapper.getElementsByClassName('en' + numericId)[0] as HTMLElement;
    }
    if (elem !== null && elem !== undefined) {

      if (this.commentService.activeCommentHighlight.commentTimeOutId !== null) {
        // Clear previous comment highlight if still active
        this.commentService.activeCommentHighlight.commentLemmaElement.classList.remove('highlight');
        window.clearTimeout(this.commentService.activeCommentHighlight.commentTimeOutId);
      }

      // Scroll the comment into view.
      this.scrollElementIntoView(elem, 'center', -5);
      const noteLemmaElem = elem.getElementsByClassName('noteLemma')[0] as HTMLElement;
      noteLemmaElem.classList.add('highlight');
      const settimeoutId = setTimeout(() => {
        noteLemmaElem.classList.remove('highlight');
        this.commentService.activeCommentHighlight = {
          commentTimeOutId: null,
          commentLemmaElement: null
        }
      }, 5000);

      this.commentService.activeCommentHighlight = {
        commentTimeOutId: settimeoutId,
        commentLemmaElement: noteLemmaElem
      }
    }
  }

  private scrollToHTMLElement(element: HTMLElement, addTag: boolean, position = 'top', timeOut = 5000) {
    try {
      const tmp = element.previousElementSibling as HTMLElement;
      let addedArrow = false;

      if ( tmp !== null && tmp !== undefined && tmp.classList.contains('anchor_lemma') ) {
        tmp.style.display = 'inline';
        this.scrollElementIntoView(tmp, position);
        setTimeout(function() {
          tmp.style.display = 'none';
        }, timeOut);
        addedArrow = true;
      } else {
        const tmpImage: HTMLImageElement = new Image();
        tmpImage.src = 'assets/images/ms_arrow_right.svg';
        tmpImage.alt = 'arrow right image';
        tmpImage.classList.add('inl_ms_arrow');
        element.parentElement.insertBefore(tmpImage, element);
        this.scrollElementIntoView(tmpImage, position);
        setTimeout(function() {
          element.parentElement.removeChild(tmpImage);
        }, timeOut);
        addedArrow = true;
      }

      if ( addTag && !addedArrow ) {
        element.innerHTML = '<img class="inl_ms_arrow" src="assets/images/ms_arrow_right.svg"/>';
        this.scrollElementIntoView(element, position);
        setTimeout(function() {
          element.innerHTML = '';
        }, timeOut);
      }
    } catch ( e ) {
      console.error(e);
    }
  }

  /** This function can be used to scroll a container so that the element which it
   *  contains is placed either at the top edge of the container or in the center
   *  of the container. This function can be called multiple times simultaneously
   *  on elements in different containers, unlike the native scrollIntoView function
   *  which cannot be called multiple times simultaneously in Chrome due to a bug.
   *  Valid values for yPosition are 'top' and 'center'. */
  private scrollElementIntoView(element: HTMLElement, yPosition = 'center', offset = 0) {
    if (element === undefined || element === null || (yPosition !== 'center' && yPosition !== 'top')) {
      return;
    }
    // Find the scrollable container of the element which is to be scrolled into view
    let container = element.parentElement;
    while (container !== null && container.parentElement !== null &&
     !container.classList.contains('scroll-content')) {
      container = container.parentElement;
    }
    if (container === null || container.parentElement === null) {
      return;
    }

    const y = Math.floor(element.getBoundingClientRect().top + container.scrollTop - container.getBoundingClientRect().top);
    let baseOffset = 10;
    if (yPosition === 'center') {
      baseOffset = Math.floor(container.offsetHeight / 2);
      if (baseOffset > 45) {
        baseOffset = baseOffset - 45;
      }
    }
    container.scrollTo({top: y - baseOffset - offset, behavior: 'smooth'});
  }

  getCorrespondanceMetadata() {
    this.commentService.getCorrespondanceMetadata(String(this.link).split('_')[1]).subscribe(
      text => {
        if (text.length > 0) {
          text['subjects'].forEach(subject => {
            if ( subject['avsändare'] ) {
              this.sender = subject['avsändare'];
            }
            if ( subject['mottagare'] ) {
              this.receiver = subject['mottagare'];
            }
          });
        }
          this.letter = text['letter'];
          this.doAnalytics();
        },
      error =>  {
        this.errorMessage = <any>error
      }
    );
  }
}
