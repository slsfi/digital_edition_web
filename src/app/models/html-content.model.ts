export class HtmlContent {
  public filename: string;
  public title: string;
  public content: string;
  public language?: string;

  constructor(htmlInfo: any) {
    this.title = htmlInfo.title;
    this.filename = htmlInfo.filename;
    this.content = htmlInfo.content;
    this.title = htmlInfo.title;
  }
}
