import { Component, Input, Renderer, ElementRef, EventEmitter, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReadTextComponent } from '../read-text/read-text';
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
  @Output() openNewIntroView: EventEmitter<any> = new EventEmitter();
  public text: any;
  protected errorMessage: string;
  listenFunc: Function;

  constructor(
    protected readPopoverService: ReadPopoverService,
    protected commentService: CommentService,
    protected sanitizer: DomSanitizer,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private events: Events
  ) {
    this.setUpTextListeners();
  }
  ngOnInit() {
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
        console.log('Error loading comments...', this.link);
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

  openNewIntro( event, id: any ) {
    id.viewType = 'introduction';
    this.openNewIntroView.emit(id);
  }

  ngAfterViewInit() {
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {

      event.stopPropagation();
      // This is tagging in href to another page e.g. introduction
      try {
        const elem: HTMLElement = event.target as HTMLElement;
        const targetId = String(elem.getAttribute('href')).split('#')[1];
        let target = document.getElementsByName(targetId)[0] as HTMLElement;
        if ( target !== null && target !== undefined ) {
          this.scrollToHTMLElement(target, true);
        } else if ( targetId !== null && targetId !== undefined ) {
          this.openNewIntro(event, {id: String(elem.getAttribute('href')).split('#')[0].trim()});
          setTimeout(function() {
            target = document.getElementsByName(targetId)[0] as HTMLElement;
            if ( target !== null && target !== undefined ) {
              this.scrollToHTMLElement(target, false);
            }
          }.bind(this), 500);
        }
      } catch ( e ) {}

      // This is linking to a comment
      try {
        let elem: HTMLElement = event.target as HTMLElement;
        if ( elem.classList.contains('commentScrollTarget') ) {
        } else if ( elem.parentElement.classList.contains('commentScrollTarget') ) {
          elem = elem.parentElement;
        }

        if ( elem.classList.contains('commentScrollTarget') ) {
          const targetId = elem.classList[elem.classList.length - 1];
          const target = document.getElementsByClassName('ttComment ' + targetId)[0] as HTMLElement;
          if ( target !== null && target !== undefined ) {
            this.scrollToHTMLElement(target, false);
          }
        }
      } catch ( e ) {}

      if (( event.target.parentElement.classList.contains('commentScrollTarget') ||
            event.target.parentElement.parentElement.classList.contains('commentScrollTarget') ) && this.readPopoverService.show.comments) {
        if (event.target !== undefined) {
          if ( event.target.previousSibling !== null ) {
            event.target.style.fontWeight = 'bold';
            if (event.target.previousSibling.previousSibling !== null) {
              event.target.previousSibling.style.fontWeight = 'bold';
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
            event.target.style.fontWeight = 'normal';
            if (event.target.previousSibling.previousSibling !== null) {
              event.target.previousSibling.style.fontWeight = 'normal';
            }
          }
          if ( event.target.nextSibling !== null && event.target.nextSibling.style !== undefined ) {
            event.target.nextSibling.style.fontWeight = 'normal';
          }
          if ( event.target.nextSibling !== null && event.target.nextSibling.nextSibling !== null ) {
            event.target.nextSibling.nextSibling.style.fontWeight = 'normal';
          }
        }, 1000);
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
            event.target.children[1].style.fontWeight = 'normal';
          }
          if ( event.target.children[2] ) {
            event.target.children[2].style.fontWeight = 'normal';
          }
        }, 1000);
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

  private scrollToHTMLElement(element: HTMLElement, addTag: boolean, timeOut = 8000) {
    try {
      element.scrollIntoView({'behavior': 'smooth', 'block': 'center'});
      const tmp = element.previousElementSibling as HTMLElement;
      let addedArrow = false;

      if ( tmp !== null && tmp !== undefined && tmp.classList.contains('anchor_lemma') ) {
        tmp.style.display = 'inline';
        setTimeout(function() {
          tmp.style.display = 'none';
        }, 2000);
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
      console.log(e);
    }
  }
}
