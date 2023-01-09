export class Text {
  public id: string;
  public title: string;
  public content: any;
  public link: string;

  constructor(textInfo: any) {
    this.title = textInfo.title;
    this.id = textInfo.id;
    this.content = textInfo.content;
    this.link = textInfo.link;
  }
}
