export class SemanticData {
  public title: string;
  public content: any;

  constructor(semanticDataInfo: any) {
    this.title = semanticDataInfo.title;
    this.content = semanticDataInfo.content;
  }
}
