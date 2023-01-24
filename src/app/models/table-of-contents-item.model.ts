
export class TableOfContentsItem {
  title: string;
  id: string;
  type: string;

  constructor(tocInfo: any) {
    this.title = tocInfo.title;
    this.id = tocInfo.id;
    this.type = tocInfo.type;
  }
}
