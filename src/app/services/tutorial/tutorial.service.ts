import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { TranslateService } from '@ngx-translate/core';
import introJs from 'intro.js/intro.js';
import { ShowWhen, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';

interface Step {
  id: string,  // inthernal id, used for storing what has been seen etc.
  intro: string, // text taken from the translation file
  element?: string, // element to be highlighted
  show: boolean,
  alreadySeen: boolean,
  hideOn: Array<string>,
  showOn: Array<string>
}

@Injectable()
export class TutorialService {

  private currentPage: string;
  private tutorialTexts: any;
  private tutorialSteps: Array<Step>;

  constructor(
    private config: ConfigService,
    private translate: TranslateService,
    private events: Events,
    private storage: Storage
  ) {
    this.translate.get('TutorialTexts').subscribe(
      tutorialTexts => {
        this.tutorialTexts = tutorialTexts;
        this.tutorialSteps = this.config.getSettings('TutorialSteps');
        console.log(this.tutorialSteps);
        for (const i in this.tutorialSteps) {
          const str = this.tutorialSteps[i].intro;
          this.tutorialSteps[i].intro = tutorialTexts[str] || `${str} Untranslated text`;
        }
        setTimeout(() => {
          this.storage.get('tutorial-done').then((seen) => {
            if (!seen) {
              this.intro();
            }
          });
        }, 1000);

      }, error => {}
    );
    this.registerListeners();
  }


  private async intro() {

    const intro = introJs();
    const steps = this.tutorialSteps.filter((step) => {return this.canBeSeen(step, this.currentPage)});

    console.log(steps);
    intro.setOptions({
      steps: steps,
      disableInteraction: false,
      showBullets: true,
      showStepNumbers: false,
      showProgress: false,
      nextLabel: this.tutorialTexts.nextLabel,
      prevLabel: this.tutorialTexts.prevLabel,
      skipLabel: this.tutorialTexts.skipLabel,
      doneLabel: this.tutorialTexts.doneLabel,
      keyboardNavigation: true,
      scrollToElement: true,
    });
    this.canBeSeen = this.canBeSeen.bind(this);
    intro.onbeforechange((elem) => {
      console.log('step', elem.selector);
    });

    intro.onchange((elem) => {
       // elem is the highlighted dom element
      this.iHaveSeen(elem.id);
    });

    intro.oncomplete((elem) => {
      this.storage.set('tutorial-done', true);
    });
    intro.start();
  }

  iHaveSeen(selector) {
    const i = this.getStep(selector, true);
    console.log(`i have seen ${selector} : ${i}`);
    if (i) {
      this.tutorialSteps[i].alreadySeen = true;
    }
    console.log(this.tutorialSteps);
  }

  canBeSeen(step, page) {
    // i have not already seen it and it is not disabled on this page
    // It is visible by default or has been specifically enabled for this page
    return !step.alreadySeen && !step.hideOn.includes(page) &&
    (step.show || step.showOn.includes(page));
  }

  getStep(selector, returnIndex = false): any {
    if (!selector) {
      // if it does not have an element attached to it,
      // we assume we are looking at the first unseen step
      // with no element attribute.
      for (const i in this.tutorialSteps) {
        const step = this.tutorialSteps[i];
        if (!step.element && this.canBeSeen(step, this.currentPage)) {
          if (returnIndex) {
            return i;
          } else {
            return step;
          }
        }
      }
    }
    for (const i in this.tutorialSteps) {
      const step = this.tutorialSteps[i];
      console.log(i, selector, step.element);
      if (step.element && '#' + step.element === selector) {
        if (returnIndex) {
          return i;
        } else {
          return step;
        }
      }
    }
  }

  reset() {
    for (const i in this.tutorialSteps) {
      const step = this.tutorialSteps[i];
      this.tutorialSteps[i].alreadySeen = false;
      this.storage.set('tutorial-step-' + step.id, false);

    }
    this.storage.set('tutorial-done', false);
  }

  registerListeners() {
    this.events.subscribe('ionViewWillEnter', (currentPage) => {
      this.currentPage = currentPage;
    });

    this.events.subscribe('topMenu:help', () => {
      this.reset();
      this.intro();
    });
  }
}
