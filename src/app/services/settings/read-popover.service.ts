import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';

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
    'pageNumbering': false,
    'pageBreakOriginal': false,
    'pageBreakEdition': false
  };

  fontsize = Fontsize.small;


  constructor(private config: ConfigService) {

  }


}
