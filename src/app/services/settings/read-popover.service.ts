import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';

export enum Fontsize {
    xsmall = 0,
    small,
    medium,
    large,
    xlarge
}

@Injectable()
export class ReadPopoverService {

  show = {
    'comments': true,
    'personInfo': false,
    'abbreviations': false,
    'placeInfo': false,
    'workInfo': false,
    'changes': false,
    'normalisations': false,
    'pageNumbering': false,
    'pageBreakOriginal': false,
    'pageBreakEdition': false
  };

  fontsize = Fontsize.small;

  private fontsizeSubject: BehaviorSubject<Fontsize> = new BehaviorSubject<Fontsize>(this.fontsize);
  fontsize$: Observable<Fontsize> = this.fontsizeSubject.asObservable();

  constructor(private config: ConfigService) {
  }

  sendFontsizeToSubscribers(fontsize: Fontsize) {
    this.fontsizeSubject.next(fontsize);
  }

}
