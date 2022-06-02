// MenuOptionModel interface
export interface TocAccordionMenuOptionModel {
    collapsed?: boolean;
    id?: any;
    // If the option has sub items and the iconName is null,
    // the default icon will be 'ios-arrow-down'.
    iconName?: string;

    // The name to display in the menu
    displayName?: string;

    // Target component (or null if it's a "special option" like login/logout)
    component?: any;

    // Here you can pass whatever you need, and will be returned if this
    // option is selected. That way you can handle login/logout options,
    // changing the language, and son on...
    custom?: any;

    badge?: any;

    // Set if this option is selected by default
    selected?: boolean;

    // List of sub items if any
    subItems?: Array<TocAccordionMenuOptionModel>;

    text?: string;

    title?: string;

    type?: string;

    description?: string;

    text_two?: string;

    publication_id?: any;

    facsimile_id?: any;

    page_nr?: any;

    facs_nr?: any;

    url?: any;

    itemId?: any;

    markdownID?: any;

    datafile?: any;

    children?: Array<TocAccordionMenuOptionModel>;

    song_id?: any;

    amountOfParents?: any;

    openByDefault?: boolean;

    collectionId?: any;

    loading?: boolean;

    children_id?: any;

    search_children_id?: any;

    important?: boolean;

    is_gallery?: boolean;
}
