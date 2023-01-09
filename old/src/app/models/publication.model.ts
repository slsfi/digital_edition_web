
export class Publication {
  id: string;
  ditialEditionId: string;
  title: string;
  subtitle: string;
  filename: string;

  constructor(pubInfo: any) {
     /*
            {
            "p_id": "1",
            "p_title": "Alltid tala emot …",
            "p_undertitle": null,
            "p_ed_id": "1",
            "p_coll_id": null,
            "p_group_id": null,
            "p_identifier": "1_1",
            "p_sort_id": "1",
            "p_datering": null,
            "p_datering_saknas": null,
            "p_maskindatum": null,
            "p_antal_sidor": null,
            "p_sidor_fran": null,
            "p_sidor_till": null,
            "p_overskrift_list": null,
            "p_state": "0",
            "p_filename": "1_1_est.xml",
            "p_ident": null,
            "p_FM": null,
            "p_genre": "Lyrik",
            "URN": null,
            "timestamp": null
            }

     */
    this.id = pubInfo.p_id;
    this.ditialEditionId = pubInfo.p_ed_id;
    this.title = pubInfo.p_title;
    this.subtitle = pubInfo.p_undertitle;
    this.filename = pubInfo.p_filemane;
  }
}
