
export class DigitalEdition {
  title: string;
  id: string;
  image: string;
  divchapters: boolean;
  url: string;
  isDownload: boolean;
  expanded: boolean;

  constructor(pubInfo: any) {
    this.title = pubInfo.title;
    this.id = pubInfo.id;
    this.divchapters = (pubInfo.divchapters === '1');
    this.url = pubInfo.url;
    this.isDownload = pubInfo.isDownload;
    this.expanded = pubInfo.expanded;
  }
}
