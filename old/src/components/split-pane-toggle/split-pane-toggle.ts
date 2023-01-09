import { Component, Input } from '@angular/core';
import { Events } from 'ionic-angular';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * Class for the SplitPaneToggleComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'split-pane-toggle',
  templateUrl: 'split-pane-toggle.html'
})
export class SplitPaneToggleComponent {
  @Input() action: string;
  open: boolean;

  constructor(
    private events: Events
  ) {
    // this.open = this.action === 'open' ? true : false;
  }

  public disable() {
    this.events.publish('splitPaneToggle:disable');
    this.events.publish('title-logo:show', true);
  }

  public enable() {
    this.events.publish('splitPaneToggle:enable');
    this.events.publish('title-logo:show', false);
  }
}
