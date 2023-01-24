import { MenuOptionModel } from './menu-option.model';
import { TocAccordionMenuOptionModel } from './toc-accordion-menu-option.model';

/*-------------------------------------*/

// All children will be stored here in order to reduce lag
// They will be used everytime a parent is toggled in toggleItemOptions
// const childrenToc = {};
// const searchChildrenToc = {};
// let childrenTocIdCounter = 1;

export class InnerMenuOptionModel {
  public static counter = 1;

  id?: number;
  iconName?: string;
  text?: string;
  title?: string;
  targetOption?: TocAccordionMenuOptionModel;
  parent?: InnerMenuOptionModel | null;
  selected?: boolean;
  expanded?: boolean;
  childrenCount?: number;
  subOptions?: Array<InnerMenuOptionModel>;
  type?: string;
  publication_id?: any;
  facsimile_id?: any;
  page_nr?: any;
  facs_nr?: any;
  children?: Array<InnerMenuOptionModel>;
  is_child?: boolean;
  is_gallery?: boolean;
  itemId?: any;
  markdownID?: any;
  datafile?: any;
  url?: any;
  song_id?: any;
  amountOfParents?: any;
  openByDefault?: boolean;
  loading?: boolean;
  children_id?: any;
  search_children_id?: any;
  important?: boolean;
  description: any;
  collapsed?: boolean;

  public static fromMenuOptionModel(
                  option: TocAccordionMenuOptionModel,
                  parent?: InnerMenuOptionModel,
                  isChild?: boolean,
                  searchingTocItem?: Boolean
                ): InnerMenuOptionModel {

    const innerMenuOptionModel = new InnerMenuOptionModel();

    innerMenuOptionModel.id = this.counter++;
    innerMenuOptionModel.targetOption = option;
    innerMenuOptionModel.parent = parent || null;
    innerMenuOptionModel.type = option.type;
    innerMenuOptionModel.selected = option.selected || false;

    innerMenuOptionModel.important = option.important ? option.important : false;

    if (['file', 'folder'].indexOf(option.type || '') !== -1) {
      innerMenuOptionModel.markdownID = option.id;
    }

    if (option.text) {
      innerMenuOptionModel.text = option.text;
      innerMenuOptionModel.description = option.description;
    } else if (option.title) {
      innerMenuOptionModel.text = option.title;
    }

    innerMenuOptionModel.publication_id = option.publication_id || null;
    innerMenuOptionModel.page_nr = option.page_nr || null;
    innerMenuOptionModel.facs_nr = option.facs_nr || null;

    innerMenuOptionModel.is_gallery = option.is_gallery || false;

    if (option.itemId) {
      innerMenuOptionModel.itemId = option.itemId;

      const legacyID = option.itemId;
      const legacyData = legacyID.split('_');

      if (legacyData.length === 2 && innerMenuOptionModel.publication_id === null) {
        innerMenuOptionModel.publication_id = legacyData[1];
      }
    }

    if (option.facsimile_id) {
      innerMenuOptionModel.facsimile_id = option.facsimile_id;
    }

    if (option.song_id) {
      innerMenuOptionModel.song_id = option.song_id;
    }

    if (option.openByDefault) {
      innerMenuOptionModel.openByDefault = true;
    }

    if (isChild) {
      innerMenuOptionModel.is_child = true;
    } else {
      innerMenuOptionModel.is_child = false;
    }

    if (option.collapsed === false) {
      innerMenuOptionModel.collapsed = false;
      innerMenuOptionModel.expanded = true;
      innerMenuOptionModel.important = true; // SK 18.5.2022 added
    } else {
      innerMenuOptionModel.collapsed = true;
      innerMenuOptionModel.expanded = false;
    }

    if (option.children) {
      // innerMenuOptionModel.expanded = false;
      let storeChildren = false;

      if (option.openByDefault) {
      // innerMenuOptionModel.expanded = true;
      }

      innerMenuOptionModel.childrenCount = option.children.length;
      innerMenuOptionModel.subOptions = [];

      if (
        option.children && option.children.length &&
        !option.children_id && !option.search_children_id &&
        !innerMenuOptionModel.markdownID &&
        !searchingTocItem
      ) {
        // innerMenuOptionModel.children_id = childrenTocIdCounter;
        // childrenToc[innerMenuOptionModel.children_id] = [];
        // childrenTocIdCounter++;
        // storeChildren = true;
        storeChildren = false;
      }

      option.children.forEach(subItem => {
        const innerSubItem = InnerMenuOptionModel.fromMenuOptionModel(subItem, innerMenuOptionModel, true, searchingTocItem);
        // innerSubItem.collapsed = subItem.collapsed;
        if (innerSubItem.text) {
          if (storeChildren) {
            /*
            if ( childrenToc[innerMenuOptionModel.children_id].indexOf(innerSubItem) === -1 ) {
              childrenToc[innerMenuOptionModel.children_id].push(innerSubItem);
            }
            */
          } else {
            if ( innerMenuOptionModel.subOptions?.indexOf(innerSubItem) === -1 ) {
              innerMenuOptionModel.subOptions.push(innerSubItem);
            }
          }
        }

        // Expand the parent if any
        // child option is selected
        if (subItem.selected && innerSubItem.parent) {
          // innerSubItem.parent.selected = true;
          innerSubItem.parent.expanded = true;
          innerSubItem.parent.collapsed = false;
        }
      });
    }
    return innerMenuOptionModel;
  }
}
