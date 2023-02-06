import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from 'src/app/services/config/core/config.service';
import { TextService } from 'src/app/services/texts/text.service';

/**
 * Class for the CoverComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'cover',
  templateUrl: 'cover.html',
  styleUrls: ['cover.scss']
})
export class CoverComponent {

  @Input() id?: string;
  @Input() language?: string;
  public text: any;
  protected errorMessage?: string;

  constructor(
    protected textService: TextService,
    protected sanitizer: DomSanitizer,
    protected config: ConfigService
  ) {

  }

  ngOnInit() {
    if (this.config.getSettings('LoadTitleFromDB')) {
      this.textService.getTitlePage(this.id || '', this.language || '').subscribe(
        res => {
            // in order to get id attributes for tooltips
            this.text = this.sanitizer.bypassSecurityTrustHtml(
              res.content.replace(/images\//g, 'assets/images/')
                  .replace(/\.png/g, '.svg')
            );
          },
        error =>  {
          this.errorMessage = <any>error;
          console.error(this.errorMessage);
        }
      );
    }
  }
}
