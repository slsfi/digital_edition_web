import { Injectable } from '@angular/core';
import { CommentService } from '../comments/comment.service';
import { LanguageService } from '../languages/language.service';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, Subscription } from 'rxjs';
import { ConfigService } from '../config/core/config.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TooltipService {
  private placeTooltipUrl = '/tooltips/locations/';
  private apiEndPoint: string;
  private projectMachineName: string;
  languageSubscription: Subscription;
  uncertainPersonCorrespTranslation = '';
  fictionalPersonCorrespTranslation = '';
  BCTranslation = 'BC';

  constructor(
    private config: ConfigService,
    private commentService: CommentService,
    private langService: LanguageService,
    public translate: TranslateService,
    private http: HttpClient
  ) {
    this.apiEndPoint = this.config.getSettings('app.apiEndpoint') as string;
    this.projectMachineName = this.config.getSettings(
      'app.machineName'
    ) as string;

    this.updateTranslations();

    this.languageSubscription = this.langService
      .languageSubjectChange()
      .subscribe((lang) => {
        if (lang) {
          this.updateTranslations();
        }
      });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  updateTranslations() {
    this.translate.get('uncertainPersonCorresp').subscribe(
      (translation) => {
        this.uncertainPersonCorrespTranslation = translation;
      },
      (error) => {
        this.uncertainPersonCorrespTranslation = '';
      }
    );

    this.translate.get('fictionalPersonCorresp').subscribe(
      (translation) => {
        this.fictionalPersonCorrespTranslation = translation;
      },
      (error) => {
        this.fictionalPersonCorrespTranslation = '';
      }
    );

    this.translate.get('BC').subscribe(
      (translation) => {
        this.BCTranslation = translation;
      },
      (error) => {
        this.BCTranslation = 'BC';
      }
    );
  }

  getPersonTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.apiEndPoint}/${this.projectMachineName}/subject/${legacyPrefix}${id}`;

    return this.http.get(url);
  }

  getPlaceTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.apiEndPoint}/${this.projectMachineName}/location/${legacyPrefix}${id}`;

    return this.http.get(url);
  }

  getTagTooltip(id: string): Observable<any> {
    let url = '';
    const legacyPrefix = this.config.getSettings('app.legacyIdPrefix');

    url = `${this.apiEndPoint}/${this.projectMachineName}/tag/${legacyPrefix}${id}`;

    return this.http.get(url);
  }

  getWorkTooltip(id: string): Observable<any> {
    let url = '';
    url = `${this.apiEndPoint}/${this.projectMachineName}/work/${id}`;

    return this.http.get(url);
  }

  decodeHtmlEntity(str: string) {
    return str.replace(/&#(\d+);/g, function (match, dec) {
      return String.fromCharCode(dec);
    });
  }

  /**
   * Can be used to fetch tooltip in situations like these:
   * <img src=".." data-id="en5929">
   * <span class="tooltip"></span>
   */
  getCommentTooltip(id: string): Observable<any> {
    const parts = id.split(';');
    const htmlId = parts[0];
    const elementId = parts[parts.length - 1].replace('end', 'en');
    return this.commentService.getComment(parts[0]).pipe(
      map((data: any) => {
        const range = document.createRange();
        const doc = range.createContextualFragment(data);
        const element = doc.querySelector('.' + elementId);

        if (element) {
          const formatedCommentData = element.innerHTML
            .replace(
              /class=\"([a-z A-Z _ 0-9]{1,140})\"/g,
              'class="teiComment $1"'
            )
            .replace(/(teiComment teiComment )/g, 'teiComment ')
            .replace(/(&lt;)/g, '<')
            .replace(/(&gt;)/g, '>');
          return (
            {
              name: 'Comment',
              description: (element.innerHTML = formatedCommentData),
            } || { name: 'Error', description: element?.innerHTML }
          );
        } else {
          return { name: 'Error', description: 'error' };
        }
      })
    );
  }

  private async handleError(error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = (await error.json()) || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    throw errMsg;
  }

  constructPersonTooltipText(tooltip: any, targetElem: HTMLElement) {
    let text = '';
    let uncertainPretext = '';
    let fictionalPretext = '';
    if (targetElem.classList.contains('uncertain')) {
      if (this.uncertainPersonCorrespTranslation !== '') {
        uncertainPretext = this.uncertainPersonCorrespTranslation + ' ';
      }
    }
    if (targetElem.classList.contains('fictional')) {
      if (this.fictionalPersonCorrespTranslation !== '') {
        fictionalPretext = this.fictionalPersonCorrespTranslation + ':<br/>';
      }
    }

    text = '<b>' + tooltip.name.trim() + '</b>';

    const yearBornDeceasedString = this.constructYearBornDeceasedString(
      tooltip.date_born,
      tooltip.date_deceased
    );
    if (yearBornDeceasedString !== '') {
      text += ' ' + yearBornDeceasedString;
    }

    if (tooltip.description !== null) {
      text += ', ' + tooltip.description;
    }

    text = uncertainPretext + text;
    text = fictionalPretext + text;
    return text;
  }

  constructYearBornDeceasedString(dateBorn: string, dateDeceased: string) {
    // Get the born and deceased years without leading zeros and possible 'BC' indicators
    const yearBorn =
      dateBorn !== undefined && dateBorn !== null
        ? String(dateBorn).split('-')[0].replace(/^0+/, '').split(' ')[0]
        : null;
    const yearDeceased =
      dateDeceased !== undefined && dateDeceased !== null
        ? String(dateDeceased).split('-')[0].replace(/^0+/, '').split(' ')[0]
        : null;
    const bcIndicatorDeceased = String(dateDeceased).includes('BC')
      ? ' ' + this.BCTranslation
      : '';
    let bcIndicatorBorn = String(dateBorn).includes('BC')
      ? ' ' + this.BCTranslation
      : '';
    if (
      String(dateBorn).includes('BC') &&
      bcIndicatorDeceased === bcIndicatorBorn
    ) {
      // Born and deceased BC, don't add indicator to year born
      bcIndicatorBorn = '';
    }
    let yearBornDeceased = '';
    if (
      yearBorn !== null &&
      yearDeceased !== null &&
      yearBorn !== 'null' &&
      yearDeceased !== 'null'
    ) {
      yearBornDeceased =
        '(' +
        yearBorn +
        bcIndicatorBorn +
        '–' +
        yearDeceased +
        bcIndicatorDeceased +
        ')';
    } else if (yearBorn !== null && yearBorn !== 'null') {
      yearBornDeceased = '(* ' + yearBorn + bcIndicatorBorn + ')';
    } else if (yearDeceased !== null && yearDeceased !== 'null') {
      yearBornDeceased = '(&#8224; ' + yearDeceased + bcIndicatorDeceased + ')';
    }
    return yearBornDeceased;
  }

  /**
   * Function for getting the properties (size, scale) of the tooltip element.
   * @param targetElem The html element which has triggered the tooltip.
   * @param ttText The text that goes in the tooltip.
   * @param pageOrigin The name of the page that is calling the function. Currently
   * either 'page-read' or 'page-introduction'.
   * @returns Object with the following keys: maxWidth, scaleValue, top and left.
   */
  getTooltipProperties(
    targetElem: HTMLElement,
    ttText: string,
    pageOrigin = 'page-read'
  ) {
    let toolTipMaxWidth = '';
    let toolTipScaleValue = 1;

    // Set vertical offset and toolbar height.
    const yOffset = 5;
    const secToolbarHeight = 50;

    // Set how close to the edges of the "window" the tooltip can be placed. Currently this only applies if the
    // tooltip is set above or below the trigger.
    const edgePadding = 5;

    // Set "padding" around tooltip trigger – this is how close to the trigger element the tooltip will be placed.
    const triggerPaddingX = 8;
    const triggerPaddingY = 8;

    // Set min and max width for resized tooltips.
    const resizedToolTipMinWidth = 300;
    const resizedToolTipMaxWidth = 600;

    // Get viewport width and height.
    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    let vh = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );

    // Get how much the page has scrolled horizontally to the left.
    // Get the page content element and adjust viewport height with horizontal
    // scrollbar height if such is present.
    // Also get how much the page has scrolled horizontally to the left.
    // Set horisontal offset due to possible side pane (menu) on the left.
    let scrollLeft = 0;
    let horizontalScrollbarOffsetHeight = 0;
    let sidePaneOffsetWidth = 0; // A default value, true value calculated with getBoundingClientRect() below
    let primaryToolbarHeight = 70; // A default value, true value calculated with getBoundingClientRect() below
    const contentElem = document.querySelector(
      pageOrigin + ':not([hidden]) > ion-content > .scroll-content'
    ) as HTMLElement;
    if (contentElem !== null) {
      scrollLeft = contentElem.scrollLeft;
      sidePaneOffsetWidth = contentElem.getBoundingClientRect().left;
      primaryToolbarHeight = contentElem.getBoundingClientRect().top;

      if (contentElem.clientHeight < contentElem.offsetHeight) {
        horizontalScrollbarOffsetHeight =
          contentElem.offsetHeight - contentElem.clientHeight;
      }
    }

    // Adjust effective viewport height if horizontal scrollbar present.
    vh = vh - horizontalScrollbarOffsetHeight;

    // Set variable for determining if the tooltip should be placed above or below the trigger
    // rather than beside it.
    let positionAboveOrBelowTrigger: Boolean = false;
    let positionAbove: Boolean = false;

    // Get rectangle which contains tooltiptrigger element. For trigger elements
    // spanning multiple lines tooltips are always placed above or below the trigger.
    const elemRects = targetElem.getClientRects();
    let elemRect = null;
    if (elemRects.length === 1) {
      elemRect = elemRects[0];
    } else {
      positionAboveOrBelowTrigger = true;
      if (
        elemRects[0].top -
          triggerPaddingY -
          primaryToolbarHeight -
          secToolbarHeight -
          edgePadding >
        vh -
          elemRects[elemRects.length - 1].bottom -
          triggerPaddingY -
          edgePadding
      ) {
        elemRect = elemRects[0];
        positionAbove = true;
      } else {
        elemRect = elemRects[elemRects.length - 1];
      }
    }

    // Find the tooltip element.
    const tooltipElement: HTMLElement | null = document.querySelector(
      pageOrigin + ':not([hidden]) div.toolTip'
    );
    if (tooltipElement === null) {
      return null;
    }

    // Get tooltip element's default dimensions and computed max-width (latter set by css).
    const initialTTDimensions = this.getToolTipDimensions(
      tooltipElement,
      ttText,
      0,
      true
    );
    let ttHeight = initialTTDimensions?.height || 0;
    let ttWidth = initialTTDimensions?.width || 0;
    if (initialTTDimensions?.compMaxWidth) {
      toolTipMaxWidth = initialTTDimensions.compMaxWidth;
    } else {
      toolTipMaxWidth = '425px';
    }

    // Calculate default position, this is relative to the viewport's top-left corner.
    let x = elemRect.right + triggerPaddingX;
    let y = elemRect.top - primaryToolbarHeight - yOffset;

    // Check if tooltip would be drawn outside the viewport.
    let oversetX = x + ttWidth - vw;
    let oversetY = elemRect.top + ttHeight - vh;
    if (!positionAboveOrBelowTrigger) {
      if (oversetX > 0) {
        if (oversetY > 0) {
          // Overset both vertically and horisontally. Check if tooltip can be moved to the left
          // side of the trigger and upwards without modifying its dimensions.
          if (
            elemRect.left - sidePaneOffsetWidth > ttWidth + triggerPaddingX &&
            y - secToolbarHeight > oversetY
          ) {
            // Move tooltip to the left side of the trigger and upwards
            x = elemRect.left - ttWidth - triggerPaddingX;
            y = y - oversetY;
          } else {
            // Calc how much space there is on either side and attempt to place the tooltip
            // on the side with more space.
            const spaceRight = vw - x;
            const spaceLeft =
              elemRect.left - sidePaneOffsetWidth - triggerPaddingX;
            const maxSpace = Math.floor(Math.max(spaceRight, spaceLeft));

            const ttDimensions = this.getToolTipDimensions(
              tooltipElement,
              ttText,
              maxSpace
            );
            ttHeight = ttDimensions?.height || 0;
            ttWidth = ttDimensions?.width || 0;

            // Double-check that the narrower tooltip fits, but isn't too narrow.
            if (ttWidth <= maxSpace && ttWidth > resizedToolTipMinWidth) {
              // There is room, set new max-width.
              toolTipMaxWidth = ttWidth + 'px';
              if (spaceLeft > spaceRight) {
                // Calc new horisontal position since an attempt to place the tooltip on the left will be made.
                x = elemRect.left - triggerPaddingX - ttWidth;
              }
              // Check vertical space.
              oversetY = elemRect.top + ttHeight - vh;
              if (oversetY > 0) {
                if (oversetY < y - secToolbarHeight) {
                  // Move the y position upwards by oversetY.
                  y = y - oversetY;
                } else {
                  positionAboveOrBelowTrigger = true;
                }
              }
            } else {
              positionAboveOrBelowTrigger = true;
            }
          }
        } else {
          // Overset only horisontally. Check if there is room on the left side of the trigger.
          if (elemRect.left - sidePaneOffsetWidth - triggerPaddingX > ttWidth) {
            // There is room on the left --> move tooltip there.
            x = elemRect.left - ttWidth - triggerPaddingX;
          } else {
            // There is not enough room on the left. Try to squeeze in the tooltip on whichever side
            // has more room. Calc how much space there is on either side.
            const spaceRight = vw - x;
            const spaceLeft =
              elemRect.left - sidePaneOffsetWidth - triggerPaddingX;
            const maxSpace = Math.floor(Math.max(spaceRight, spaceLeft));

            const ttDimensions = this.getToolTipDimensions(
              tooltipElement,
              ttText,
              maxSpace
            );
            ttHeight = ttDimensions?.height || 0;
            ttWidth = ttDimensions?.width || 0;

            // Double-check that the narrower tooltip fits, but isn't too narrow.
            if (ttWidth <= maxSpace && ttWidth > resizedToolTipMinWidth) {
              // There is room, set new max-width.
              toolTipMaxWidth = ttWidth + 'px';
              if (spaceLeft > spaceRight) {
                // Calc new horisontal position since an attempt to place the tooltip on the left will be made.
                x = elemRect.left - triggerPaddingX - ttWidth;
              }
              // Check vertical space.
              oversetY = elemRect.top + ttHeight - vh;
              if (oversetY > 0) {
                if (oversetY < y - secToolbarHeight) {
                  // Move the y position upwards by oversetY.
                  y = y - oversetY;
                } else {
                  positionAboveOrBelowTrigger = true;
                }
              }
            } else {
              positionAboveOrBelowTrigger = true;
            }
          }
        }
      } else if (oversetY > 0) {
        // Overset only vertically. Check if there is room to move the tooltip upwards.
        if (oversetY < y - secToolbarHeight) {
          // Move the y position upwards by oversetY.
          y = y - oversetY;
        } else {
          // There is not room to move the tooltip just upwards. Check if there is more room on the
          // left side of the trigger so the width of the tooltip could be increased there.
          const spaceRight = vw - x;
          const spaceLeft =
            elemRect.left - sidePaneOffsetWidth - triggerPaddingX;

          if (spaceLeft > spaceRight) {
            const ttDimensions = this.getToolTipDimensions(
              tooltipElement,
              ttText,
              spaceLeft
            );
            ttHeight = ttDimensions?.height || 0;
            ttWidth = ttDimensions?.width || 0;

            if (
              ttWidth <= spaceLeft &&
              ttWidth > resizedToolTipMinWidth &&
              ttHeight < vh - yOffset - primaryToolbarHeight - secToolbarHeight
            ) {
              // There is enough space on the left side of the trigger. Calc new positions.
              toolTipMaxWidth = ttWidth + 'px';
              x = elemRect.left - triggerPaddingX - ttWidth;
              oversetY = elemRect.top + ttHeight - vh;
              y = y - oversetY;
            } else {
              positionAboveOrBelowTrigger = true;
            }
          } else {
            positionAboveOrBelowTrigger = true;
          }
        }
      }
    }

    if (positionAboveOrBelowTrigger) {
      // The tooltip could not be placed next to the trigger, so it has to be placed above or below it.
      // Check if there is more space above or below the tooltip trigger.
      let availableHeight = 0;
      if (elemRects.length > 1 && positionAbove) {
        availableHeight =
          elemRect.top -
          primaryToolbarHeight -
          secToolbarHeight -
          triggerPaddingY -
          edgePadding;
      } else if (elemRects.length > 1) {
        availableHeight = vh - elemRect.bottom - triggerPaddingY - edgePadding;
      } else if (
        elemRect.top - primaryToolbarHeight - secToolbarHeight >
        vh - elemRect.bottom
      ) {
        positionAbove = true;
        availableHeight =
          elemRect.top -
          primaryToolbarHeight -
          secToolbarHeight -
          triggerPaddingY -
          edgePadding;
      } else {
        positionAbove = false;
        availableHeight = vh - elemRect.bottom - triggerPaddingY - edgePadding;
      }

      const availableWidth = vw - sidePaneOffsetWidth - 2 * edgePadding;

      if (
        initialTTDimensions?.height ||
        (0 <= availableHeight && initialTTDimensions?.width) ||
        0 <= availableWidth
      ) {
        // The tooltip fits without resizing. Calculate position, check for possible overset and adjust.
        x = elemRect.left;
        if (positionAbove) {
          y =
            elemRect.top -
            (initialTTDimensions?.height || 0) -
            primaryToolbarHeight -
            triggerPaddingY;
        } else {
          y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
        }

        // Check if tooltip would be drawn outside the viewport horisontally.
        oversetX = x + (initialTTDimensions?.width || 0) - vw;
        if (oversetX > 0) {
          x = x - oversetX - edgePadding;
        }
      } else {
        // Try to resize the tooltip so it would fit in view.
        let newTTMaxWidth = Math.floor(availableWidth);
        if (newTTMaxWidth > resizedToolTipMaxWidth) {
          newTTMaxWidth = resizedToolTipMaxWidth;
        }
        // Calculate tooltip dimensions with new max-width
        const ttNewDimensions = this.getToolTipDimensions(
          tooltipElement,
          ttText,
          newTTMaxWidth
        );

        if (
          (ttNewDimensions?.height || 0) <= availableHeight &&
          (ttNewDimensions?.width || 0) <= availableWidth
        ) {
          // Set new max-width and calculate position. Adjust if overset.
          toolTipMaxWidth = (ttNewDimensions?.width || 0) + 'px';
          x = elemRect.left;
          if (positionAbove) {
            y =
              elemRect.top -
              (ttNewDimensions?.height || 0) -
              primaryToolbarHeight -
              triggerPaddingY;
          } else {
            y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
          }
          // Check if tooltip would be drawn outside the viewport horisontally.
          oversetX = x + (ttNewDimensions?.width || 0) - vw;
          if (oversetX > 0) {
            x = x - oversetX - edgePadding;
          }
        } else {
          // Resizing the width and height of the tooltip element won't make it fit in view.
          // Basically this means that the width is ok, but the height isn't.
          // As a last resort, scale the tooltip so it fits in view.
          const ratioX = availableWidth / (ttNewDimensions?.width || 1);
          const ratioY = availableHeight / (ttNewDimensions?.height || 1);
          const scaleRatio = Math.min(ratioX, ratioY) - 0.01;

          toolTipMaxWidth = (ttNewDimensions?.width || 0) + 'px';
          toolTipScaleValue = scaleRatio;
          x = elemRect.left;
          if (positionAbove) {
            y =
              elemRect.top -
              availableHeight -
              triggerPaddingY -
              primaryToolbarHeight;
          } else {
            y = elemRect.bottom + triggerPaddingY - primaryToolbarHeight;
          }
          oversetX = x + (ttNewDimensions?.width || 0) - vw;
          if (oversetX > 0) {
            x = x - oversetX - edgePadding;
          }
        }
      }
    }

    const toolTipProperties = {
      maxWidth: toolTipMaxWidth,
      scaleValue: toolTipScaleValue,
      top: y + 'px',
      left: x + scrollLeft - sidePaneOffsetWidth + 'px',
    };

    return toolTipProperties;
  }

  /**
   * Function for calculating the dimensions of the tooltip element for a given text.
   * @param toolTipElem The tooltip HTML element.
   * @param toolTipText The text that goes in the tooltip.
   * @param maxWidth Maximum width of the tooltip element.
   * @param returnCompMaxWidth Boolean determining whether or not the css computed max width
   * should be included in the returned object.
   * @returns Object containing width, height and computed max-width of the tooltip for the
   * given text.
   */
  private getToolTipDimensions(
    toolTipElem: HTMLElement,
    toolTipText: string,
    maxWidth = 0,
    returnCompMaxWidth: Boolean = false
  ) {
    // Create hidden div and make it into a copy of the tooltip div. Calculations are done on the hidden div.
    const hiddenDiv: HTMLElement = document.createElement('div');

    // Loop over each class in the tooltip element and add them to the hidden div.
    if (toolTipElem.className !== '') {
      const ttClasses: string[] = Array.from(toolTipElem.classList);
      ttClasses.forEach(function (currentValue, currentIndex, listObj) {
        hiddenDiv.classList.add(currentValue);
      });
    } else {
      return undefined;
    }

    // Don't display the hidden div initially. Set max-width if defined, otherwise the max-width will be determined by css.
    hiddenDiv.style.display = 'none';
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.left = '0';
    if (maxWidth > 0) {
      hiddenDiv.style.maxWidth = maxWidth + 'px';
    }
    // Append hidden div to the parent of the tooltip element.
    toolTipElem.parentNode?.appendChild(hiddenDiv);
    // Add content to the hidden div.
    hiddenDiv.innerHTML = toolTipText;
    // Make div visible again to calculate its width and height.
    hiddenDiv.style.visibility = 'hidden';
    hiddenDiv.style.display = 'block';
    const ttHeight = hiddenDiv.offsetHeight;
    const ttWidth = hiddenDiv.offsetWidth;
    let compToolTipMaxWidth = '';
    if (returnCompMaxWidth) {
      // Get default tooltip max-width from css of hidden div if possible.
      const hiddenDivCompStyles = window.getComputedStyle(hiddenDiv);
      compToolTipMaxWidth = hiddenDivCompStyles.getPropertyValue('max-width');
    }
    // Calculations are done so the hidden div can/must be removed.
    hiddenDiv.remove();

    const dimensions = {
      width: ttWidth,
      height: ttHeight,
      compMaxWidth: compToolTipMaxWidth,
    };
    return dimensions;
  }
}
