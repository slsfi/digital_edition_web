import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';

export const enum Fontsize {
    small = 0,
    medium,
    large
}

@Injectable()
export class ReadPopoverService {

  show = {
    'comments': true,
    'personInfo': false,
    'abbreviations': false,
    'placeInfo': false,
    'changes': false,
    'pageNumbering': false,
    'pageBreakOriginal': false,
    'pageBreakEdition': false
  };

  fontsize = Fontsize.small;


  constructor(private config: ConfigService) {

  }


}
