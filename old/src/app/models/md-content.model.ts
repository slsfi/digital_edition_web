export class MdContent {
    public id: string;
    public filename: string;
    public title: string;
    public content: string;

    constructor(mdInfo: any) {
      this.id = mdInfo.id;
      this.filename = mdInfo.filename;
      this.title = mdInfo.title;
      this.content = mdInfo.content;
    }
  }
