export class Facsimile {
  public id: number;
  public zoom: number;
  public page: number;
  public pages: number;
  public pre_page_count: number;
  public page_nr: number;
  public itemId: string;
  public manuscript_id: number;
  public publication_facsimile_collection_id: number;
  public number_of_pages: number;

  public title: any;
  public content = '';
  public images = [];
  public zoomedImages = [];

  public type: number;

  constructor(facsimileInfo: any) {
    this.id = facsimileInfo.id;
    this.zoom = 1;
    this.page = facsimileInfo.start_page_number + facsimileInfo.page_nr;
    this.page_nr = facsimileInfo.page_nr;
    this.pages = facsimileInfo.pages;
    this.pre_page_count = facsimileInfo.start_page_number;
    this.type = facsimileInfo.type;
    this.title = facsimileInfo.title;
    this.itemId = facsimileInfo.itemId;
    this.manuscript_id = facsimileInfo.manuscript_id;
    this.publication_facsimile_collection_id = facsimileInfo.publication_facsimile_collection_id;
    this.number_of_pages = facsimileInfo.number_of_pages;
  }
}

/*


description
f_p_id
facs_id
ms_id
page_nr
pages
pages_modifier_after
pages_modifier_before
pdf
pre_page_count
priority
publications_id
section_id
start_url: "digitaledition/topelius/faksimil/1/1"
title: "Hertiginnan af Finland"
type :1

      {
        title: 'Facsimile IV',
        content: '<h3 class="title1">Facsimile With a Vengence</h3>' +
                  '<p class="l">There comes a time in onces life</p>' +
                  '<p class="l">When good is not enough...</p>',
        images: ['https://upload.wikimedia.org/wikipedia/commons/1/15/Temple_Scroll.png']
      }
*/
