import { Component, Input, Renderer, ElementRef, EventEmitter, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReadPopoverService } from '../../app/services/settings/read-popover.service';
import { TextService } from '../../app/services/texts/text.service';
import { ToastController, Events, ViewController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

/**
 * Generated class for the ManuscriptsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'manuscripts',
  templateUrl: 'manuscripts.html'
})
export class ManuscriptsComponent {
  @Input() itemId: string;
  @Input() linkID?: string;
  @Input() matches?: Array<string>;
  @Output() openNewManView: EventEmitter<any> = new EventEmitter();

  text: any;
  selection: 0;
  manuscripts: any;
  selectedManuscript: any;
  normalized = true;
  errorMessage: string;
  msID: string;

  constructor(
    protected sanitizer: DomSanitizer,
    protected readPopoverService: ReadPopoverService,
    protected textService: TextService,
    protected storage: Storage,
    private renderer: Renderer,
    private elementRef: ElementRef,
    private toastCtrl: ToastController,
    private events: Events,
    public viewctrl: ViewController
  ) {
    this.text = '';
    this.manuscripts = [];
  }

  ngOnInit() {
    this.msID = this.itemId + '_ms';
    this.setText();
  }

  setText() {
    this.storage.get(this.msID).then((manuscripts) => {
      if (manuscripts) {
        this.getCacheText(this.msID);
      } else {
        this.getManuscript();
      }
    });
  }

  openNewMan(event: Event, id: any) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'manuscript';
    this.openNewManView.emit(id);
  }

  openFacsimileMan(event: Event, id: any) {
    event.preventDefault();
    event.stopPropagation();
    id.viewType = 'manuscriptFacsimile';
    this.openNewManView.emit(id);
  }

  getManuscript() {
    this.textService.getManuscripts(this.itemId).subscribe(
      res => {
        // in order to get id attributes for tooltips
        console.log('recieved manuscript ,..,', res.manuscripts);
        this.manuscripts = res.manuscripts;
        this.setManuscript();
      },
      err => console.error(err),
      () => {
        console.log('fetched manuscripts');
      }
    );
  }

  changeManuscript(manuscript?: any) {
    if (manuscript) {
      this.selectedManuscript = manuscript;
    }
    if (this.selectedManuscript && this.selectedManuscript.manuscript_normalized !== undefined) {
      if (this.normalized) {
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedManuscript.manuscript_normalized.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiManuscript $1\"')
        );
      } else {
        this.text = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedManuscript.manuscript_changes.replace(/images\//g, 'assets/images/')
            .replace(/\.png/g, '.svg').replace(/class=\"([a-z A-Z _ 0-9]{1,140})\"/g, 'class=\"teiManuscript $1\"')
        );
      }
    }
  }

  setManuscript() {
    const inputFilename = this.linkID + '.xml';

    const inputManuscript = this.manuscripts.filter(function (item) {
      return (item.original_filename === inputFilename || item.id === this.linkID || item.legacy_id === this.linkID);
    }.bind(this))[0];

    if (this.linkID && this.linkID !== undefined && inputManuscript !== undefined) {
      this.selectedManuscript = inputManuscript;
    } else {
      console.log('no link id setting 0 to first');
      this.selectedManuscript = this.manuscripts[0];
    }
    this.changeManuscript();
  }

  getCacheText(id: string) {
    this.storage.get(id).then((manuscripts) => {
      this.manuscripts = manuscripts;
      this.setManuscript();
    });
  }
}
