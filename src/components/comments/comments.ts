import { Component, Input, Renderer, ElementRef, EventEmitter, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReadTextComponent } from '../read-text/read-text';
import { TextService } from '../../app/services/texts/text.service';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { CommentService } from '../../app/services/comments/comment.service';
import { Events } from 'ionic-angular';
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
  listenFunc: Function;
  manuscript: any;
  sender: any;
  receiver: any;
  letter: any;

  constructor(
    protected readPopoverService: ReadPopoverService,
    protected commentService: CommentService,
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private events: Events
  ) {
    this.setUpTextListeners();
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
  }

  setText() {
    this.commentService.getComment(this.link).subscribe(
      text => {
          // in order to get id attributes for tooltips
          this.text = this.sanitizer.bypassSecurityTrustHtml (
            String(text).replace(/images\//g, 'assets/images/')
              .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiComment $1\"')
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          );
          this.doAnalytics();
        },
      error =>  {
        console.error('Error loading comments...', this.link);
        this.errorMessage = <any>error
      }
    );
  }

  doAnalytics() {
    try {
      (<any>window).ga('send', 'event', {
        eventCategory: 'Comments',
        eventLabel: 'Comments',
        eventAction: this.link,
        eventValue: 10
      });
    } catch ( e ) {
    }
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

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {

      event.stopPropagation();
      event.preventDefault();
      // This is tagging in href to another page e.g. introduction
      try {
        const elem: HTMLAnchorElement = event.target as HTMLAnchorElement;
        let targetId = '';
        let colPub = '';
        if ( String(elem.getAttribute('href')).includes('#') === false ) {
          targetId = String(elem.getAttribute('href'));
          colPub = String(elem.getAttribute('href'));
        } else {
          targetId = String(elem.getAttribute('href')).split('#')[1];
          colPub = String(elem.getAttribute('href')).split('#')[0];
        }
        let target = document.getElementsByName(targetId)[0] as HTMLAnchorElement;
        if ( targetId !== null && targetId !== undefined && (elem.classList.contains('xref') !== false ||
         elem.classList.contains('xreference') !== false) ) {
          // Check if intro or same publication id
          // Check class ref_introduction, readingtext
          // Also check if already open and if same publication?
          if ( elem.classList !== undefined ) {
            const list = elem.classList;
            if ( list.contains('introduction') || list.contains('ref_introduction') ) {
              this.openNewIntro(event, {id: colPub});
            } else if ( list.contains('readingtext') || list.contains('ref_readingtext') ) {
              this.openNewView(event, colPub, 'established');
            } else if ( list.contains('comment') || list.contains('ref_comment') ) {
              if ( target !== null && target !== undefined ) {
                // this.scrollToHTMLElement(target, true);
              } else {
                this.openNewView(event, colPub, 'comments');
              }
            }
          }
          // Some other text, open in new window
          setTimeout(function() {
            target = document.getElementsByName(targetId)[0] as HTMLAnchorElement;
            // Add arrow at correct place, not first occurrence of anchor
            if ( !elem.classList.contains('comment') && !elem.classList.contains('ref_comment') &&
                (target === undefined || target.classList.contains('teiComment')) ) {
                  target = document.getElementsByName(targetId)[document.getElementsByName(targetId).length - 1] as HTMLAnchorElement;
            }
            if ( target !== null && target !== undefined ) {
              this.scrollToHTMLElement(target, false);
            }
          }.bind(this), 500);

        } else if ( target !== null && target !== undefined && elem.classList.contains('ext') === false  ) {
          this.scrollToHTMLElement(target, true);
        } else if ( elem.classList !== undefined && elem.classList.contains('ext') ) {
          const anchor = <HTMLAnchorElement>elem;
          const ref = window.open(anchor.href, '_blank', 'location=no');
        }
      } catch ( e ) {}

      // This is linking to a comment lemma ("asterisk") in the reading text
      try {
        let elem: HTMLElement = event.target as HTMLElement;
        if ( elem.classList.contains('commentScrollTarget') ) {
        } else if ( elem.parentElement.classList.contains('commentScrollTarget') ) {
          // elem is the comment-element in the comments-column
          elem = elem.parentElement;
        }

        if ( elem.classList.contains('commentScrollTarget') ) {
          const targetId = elem.classList[elem.classList.length - 1];
          // target is the lemma in the reading text
          const target = document.getElementsByClassName('ttComment ' + targetId)[0] as HTMLElement;
          if ( target !== null && target !== undefined && this.readPopoverService.show.comments) {
            // Scroll to lemma in reading text and temporarily prepend arrow
            this.scrollToHTMLElement(target, false);
            // Scroll the comment in the comments-column
            elem.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
          }
        }
      } catch ( e ) {}

      if (( event.target.parentElement.classList.contains('commentScrollTarget') ||
            event.target.parentElement.parentElement.classList.contains('commentScrollTarget') ) && this.readPopoverService.show.comments) {
        if (event.target !== undefined) {
          if ( event.target.previousSibling !== null ) {
            event.target.style.fontWeight = 'bold';
            if (event.target.previousSibling.previousSibling !== null) {
              try {
                event.target.previousSibling.style.fontWeight = 'bold';
              } catch ( e ) {

              }
            }
          }
          if ( event.target.nextSibling !== null && event.target.nextSibling.style !== undefined ) {
            event.target.nextSibling.style.fontWeight = 'bold';
          }
          if ( event.target.nextSibling !== null && event.target.nextSibling.nextSibling !== null ) {
            event.target.nextSibling.nextSibling.style.fontWeight = 'bold';
          }
          this.scrollToComment(event);
        }
        setTimeout(function() {
          if (event.target !== undefined && event.target.previousSibling) {
            event.target.style.fontWeight = null;
            if (event.target.previousSibling.previousSibling !== null) {
              try {
                event.target.previousSibling.style.fontWeight = null;
              } catch ( e ) {

              }
            }
          }
          if ( event.target.nextSibling !== null && event.target.nextSibling.style !== undefined ) {
            event.target.nextSibling.style.fontWeight = null;
          }
          if ( event.target.nextSibling !== null && event.target.nextSibling.nextSibling !== null ) {
            event.target.nextSibling.nextSibling.style.fontWeight = null;
          }
        }, 5000);
      } else if (event.target.classList.contains('commentScrollTarget') && this.readPopoverService.show.comments) {
        if (event.target !== undefined) {
          if ( event.target.children[1] ) {
            event.target.children[1].style.fontWeight = 'bold';
          }
          if ( event.target.children[2] ) {
            event.target.children[2].style.fontWeight = 'bold';
          }
          this.scrollToComment(event);
        }
        setTimeout(function() {
          if ( event.target.children[1] ) {
            event.target.children[1].style.fontWeight = null;
          }
          if ( event.target.children[2] ) {
            event.target.children[2].style.fontWeight = null;
          }
        }, 5000);
      }
    });
  }

  private setUpTextListeners() {
    // We must do it like this since we want to trigger an event on a dynamically loaded innerhtml.
    this.listenFunc = this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      if (event.target.classList.contains('xreference')) {
        // get the parts for the targetted text
        const hrefTargetItems: Array<string> = decodeURI(String(event.target.href).split('/').pop()).split(' ');
        // check if we are already on the same page
        const baseURI: string = String(event.target.baseURI).split('#').pop();
        if ( (baseURI === '/publication/' + hrefTargetItems[0] + '/text/' + hrefTargetItems[1]) ||
              ( hrefTargetItems[1] === event.target.hash ) ) {
          if ( event.target.classList.contains('ref_readingtext') ) {
            this.events.publish('scrollToContent', event.target.hash);
          }
        }
        event.preventDefault();
      }
    });
  }

  private scrollToComment(event: any) {
    let scrollTarget: Array<any> = [];
    if ( String(event.target.parentElement.className).match(/en[0-9]{1,9}/g) ) {
      scrollTarget = String(event.target.parentElement.className).match(/en[0-9]{1,9}/g);
    } else if ( String(event.target.className).match(/en[0-9]{1,9}/g) ) {
      scrollTarget = String(event.target.className).match(/en[0-9]{1,9}/g);
    } else if ( String(event.target.parentElement.parentElement.className).match(/en[0-9]{1,9}/g) ) {
      scrollTarget = String(event.target.parentElement.parentElement.className).match(/en[0-9]{1,9}/g);
    }
    if ( scrollTarget != null && scrollTarget.length > 0 ) {
      this.events.publish('scrollToContent', scrollTarget[0]);
    }
  }

  private scrollToHTMLElement(element: HTMLElement, addTag: boolean, timeOut = 5000) {
    try {
      element.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
      const tmp = element.previousElementSibling as HTMLElement;
      let addedArrow = false;

      if ( tmp !== null && tmp !== undefined && tmp.classList.contains('anchor_lemma') ) {
        tmp.style.display = 'inline';
        setTimeout(function() {
          tmp.style.display = 'none';
        }, 5000);
        addedArrow = true;
      } else {
        const tmpImage: HTMLImageElement = new Image();
        tmpImage.src = 'assets/images/ms_arrow_right.svg';
        tmpImage.classList.add('inl_ms_arrow');
        element.parentElement.insertBefore(tmpImage, element);
        setTimeout(function() {
          element.parentElement.removeChild(tmpImage);
        }, timeOut);
        addedArrow = true;
      }

      if ( addTag && !addedArrow ) {
        element.innerHTML = '<img class="inl_ms_arrow" src="assets/images/ms_arrow_right.svg"/>';
        setTimeout(function() {
          element.innerHTML = '';
        }, timeOut);
      }
    } catch ( e ) {
      console.error(e);
    }
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
