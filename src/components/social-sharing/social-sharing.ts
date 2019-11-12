import { Component, Input } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing';
import { UserSettingsService } from '../../app/services/settings/user-settings.service';
import { Events } from 'ionic-angular';

/**
 * Generated class for the SocialSharingComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'social-sharing',
  templateUrl: 'social-sharing.html'
})
export class SocialSharingComponent {

  @Input() facebook?: any;
  @Input() twitter?: any;
  @Input() instagram?: any;
  @Input() email?: any;

  show = {};
  displaySocialSharing = false;

  constructor(
    public userSettingsService: UserSettingsService,
    private socialSharing: SocialSharing,
    private events: Events
  ) {
    //
  }

  ngOnInit() {
    this.show = {
      facebook: this.facebook,
      twitter: this.twitter,
      instagram: this.instagram,
      email: this.email
    };
    this.displaySocialSharing = this.valueInObject(this.show, true);
  }

  shareFacebook() {
    //
  }

  shareTwitter() {
    //
  }

  shareInstagram() {
    //
  }

  shareEmail() {
    //
  }

  nativeEmail() {
    // Check if sharing via email is supported
    this.socialSharing.canShareViaEmail().then(() => {
      console.log('Sharing via email is possible');

      // Share via email
      this.socialSharing.shareViaEmail('Body', 'Subject', ['recipient@example.org']).then(() => {
        // Success!
      }).catch(() => {
        // Error!
        console.log('Email error')
      });
    }).catch(() => {
      console.log('Sharing via email is not possible');
    });
  }

  valueInObject(obj, val) {
    const values = (<any>Object).values(obj);
    return values.includes(val);
  }

}
