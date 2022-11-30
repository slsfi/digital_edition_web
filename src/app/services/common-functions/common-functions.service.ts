import { Injectable, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CommonFunctionsService {

  intervalTimerId: number;

  constructor(
    public ngZone: NgZone,
    public translate: TranslateService
  ) {
    this.intervalTimerId = 0;
  }


  /**
   * Check if a file is found behind the given url. Returns 1 if file found,
   * otherwise 0.
   */
  async urlExists(url: string) {
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (response.ok && response.status !== 404) {
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      console.log('Could not fetch ', url);
      console.error(`${error}`);
      return 0;
    }
  }


  /**
   * Check if a number is even.
   */
   numberIsEven(value: number) {
    if (value % 2 === 0) {
      return true;
    } else {
      return false;
    }
  }


  /**
   * Function for sorting an array of objects alphabetically ascendingly based on the given object key (field).
   */
  sortArrayOfObjectsAlphabetically(arrayToSort: any, fieldToSortOn: string) {
    if (Array.isArray(arrayToSort)) {
      arrayToSort.sort((a, b) => {
        const fieldA = String(a[fieldToSortOn]).toUpperCase();
        const fieldB = String(b[fieldToSortOn]).toUpperCase();
        if (fieldA < fieldB) {
          return -1;
        }
        if (fieldA > fieldB) {
          return 1;
        }
        return 0;
      });
    }
  }

  /**
   * Function for sorting an array of objects numerically descendingly based on the given object key (field).
   */
  sortArrayOfObjectsNumerically(arrayToSort: any, fieldToSortOn: string) {
    if (Array.isArray(arrayToSort)) {
      arrayToSort.sort((a, b) => {
        if (a[fieldToSortOn] > b[fieldToSortOn]) {
          return -1;
        }
        if (a[fieldToSortOn] < b[fieldToSortOn]) {
          return 1;
        }
        return 0;
      });
    }
  }


  /**
   * This function can be used to scroll a container so that the element which it
   * contains is placed either at the top edge of the container or in the center
   * of the container. This function can be called multiple times simultaneously
   * on elements in different containers, unlike the native scrollIntoView function
   * which cannot be called multiple times simultaneously in Chrome due to a bug.
   * Valid values for yPosition are 'top' and 'center'. The scroll behavior can
   * either be 'auto' or the default 'smooth'.
   */
  scrollElementIntoView(element: HTMLElement, yPosition = 'center', offset = 0, scrollBehavior = 'smooth') {
    if (element === undefined || element === null || (yPosition !== 'center' && yPosition !== 'top')) {
      return;
    }
    // Find the scrollable container of the element which is to be scrolled into view
    let container = element.parentElement;
    while (container !== null && container.parentElement !== null &&
      !container.classList.contains('scroll-content')) {
      container = container.parentElement;
    }
    if (container === null || container.parentElement === null) {
      return;
    }

    const y = Math.floor(element.getBoundingClientRect().top + container.scrollTop - container.getBoundingClientRect().top);
    let baseOffset = 10;
    if (yPosition === 'center') {
      baseOffset = Math.floor(container.offsetHeight / 2);
      if (baseOffset > 45) {
        baseOffset = baseOffset - 45;
      }
    }
    if (scrollBehavior === 'smooth') {
      container.scrollTo({top: y - baseOffset - offset, behavior: 'smooth'});
    } else {
      container.scrollTo({top: y - baseOffset - offset, behavior: 'auto'});
    }
  }


  /**
   * Scrolls element into view and prepends arrow for the duration of timeOut.
   * @param element The target html element.
   * @param position Either 'top' or 'center'.
   * @param timeOut Timeout in milliseconds.
   * @param scrollBehavior Either 'smooth' or 'auto'.
   */
  scrollToHTMLElement(element: HTMLElement, position = 'top', timeOut = 5000, scrollBehavior = 'smooth') {
    try {
      this.ngZone.runOutsideAngular(() => {
        const tmpImage: HTMLImageElement = new Image();
        tmpImage.src = 'assets/images/ms_arrow_right.svg';
        tmpImage.alt = 'right arrow';
        tmpImage.classList.add('inl_ms_arrow');
        element.parentElement.insertBefore(tmpImage, element);
        this.scrollElementIntoView(tmpImage, position, 0, scrollBehavior);
        setTimeout(function() {
          element.parentElement.removeChild(tmpImage);
        }, timeOut);
      });
    } catch ( e ) {
      console.error(e);
    }
  }


  /**
   * This function scrolls the read-view horisontally to the last (rightmost) read column.
   * It should be called after adding new views/columns.
   */
  scrollLastViewIntoView() {
    this.ngZone.runOutsideAngular(() => {
      let iterationsLeft = 10;
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = window.setInterval(function() {
        if (iterationsLeft < 1) {
          clearInterval(this.intervalTimerId);
        } else {
          iterationsLeft -= 1;
          const viewElements = document.querySelector('page-read:not([hidden])').getElementsByClassName('read-column');
          if (viewElements[0] !== undefined) {
            const lastViewElement = viewElements[viewElements.length - 1] as HTMLElement;
            const scrollingContainer = document.querySelector('page-read:not([hidden]) > ion-content > div.scroll-content');
            if (scrollingContainer !== null) {
              const x = lastViewElement.getBoundingClientRect().right + scrollingContainer.scrollLeft -
              scrollingContainer.getBoundingClientRect().left;
              scrollingContainer.scrollTo({top: 0, left: x, behavior: 'smooth'});
              clearInterval(this.intervalTimerId);
            }
          }
        }
      }.bind(this), 500);
    });
  }


  /**
   * Given an array with names of people, this function return a string where the names
   * have been concatenated. The string given in 'separator' is used as a separator between
   * all of the names except between the second to last and last, which are separated by an
   * ampersand (&).
   * @param names An array of strings with the names that are to be concatenated.
   * @returns A string with the names concatenated.
   */
  concatenateNames(names: string[], separator = ';') {
    let names_str = '';
    for (let i = 0; i < names.length; i++) {
      names_str = names_str + names[i];
      if (names.length > 2) {
        if (i < names.length - 2) {
          names_str = names_str + separator + ' ';
        } else if (i < names.length - 1) {
          names_str = names_str + ' \u0026 ';
        }
      } else if (names.length === 2 && i < 1) {
        names_str = names_str + ' \u0026 ';
      }
    }
    return names_str;
  }


  /**
   * TODO: The regex doesn't work if the match string in the text is interspersed with tags.
   * For instance, in the text the match could have a span indicating page break:
   * Tavast<span class="tei pb_zts">|87|</span>länningar. This occurrence will not be marked
   * with <match> tags in a search for "Tavastlänningar". However, these kind of matches are
   * found on the elastic-search page.
   */
  insertSearchMatchTags(text: string, matches: string[]) {
    if (matches instanceof Array && matches.length > 0) {
      matches.forEach((val) => {
        if (val) {
          const re = new RegExp('(' + val + ')', 'ig');
          text = text.replace(re, '<match>$1</match>');
        }
      });
    }
    return text;
  }

}
