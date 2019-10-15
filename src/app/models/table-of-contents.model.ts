export interface TableOfContentsItem {
    title: string;
    id: string;
    link: string;
    link_type: string;
}

export interface TableOfContentsSubcategory {
    title: string;
    id: string;
    items: TableOfContentsItem[];
}

export class TableOfContentsCategory {
    id: string;
    title: string;
    titleLevel: string;
    items: TableOfContentsSubcategory[];
}

export class GeneralTocItem {
    'toc_id': string;
    'title': string;
    'subTitle': string;
    'altTitle': string;
    'toc_ed_id': string;
    'toc_coll_id': string;
    'toc_group_id': string;
    'toc_linkID': string;
    'sortOrder': string;
    'titleLevel': string;
    'toc_groupid': string;
    'toc_linkType': string;
    'toc_date': string;
    'sortOrderGroup': string;
    'toc_upperGroupId': string;
    'selected': boolean;
}
