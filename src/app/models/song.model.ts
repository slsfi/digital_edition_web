
export class Song {
  id: string;
  landscape: string;
  lyrics: string;
  name: string;
  note: string;
  number: string;
  original_collection_location: string;
  original_collection_signature: string;
  original_id: string;
  original_publication_date: string;
  page_number: string;
  performer_born_name: string;
  performer_firstname: string;
  performer_lastname: string;
  place: string;
  recorder_born_name: string;
  recorder_firstname: string;
  recorder_lastname: string;
  subtype: string;
  type: string;
  variant: string;
  volume: string;
  comment: string;
  constructor(songInfo: any) {
    this.id = songInfo.song_id;
    this.landscape = songInfo.song_landscape;
    this.lyrics = songInfo.song_lyrics;
    this.name = songInfo.song_name;
    this.note = songInfo.song_note;
    this.number = songInfo.song_number;
    this.original_collection_location = songInfo.song_original_collection_location;
    this.original_collection_signature = songInfo.song_original_collection_signature;
    this.original_id = songInfo.song_original_id;
    this.original_publication_date = songInfo.song_original_publication_date;
    this.page_number = songInfo.song_page_number;
    this.performer_born_name = songInfo.song_performer_born_name;
    this.performer_firstname = songInfo.song_performer_firstname;
    this.performer_lastname = songInfo.song_performer_lastname;
    this.place = songInfo.song_place;
    this.recorder_born_name = songInfo.song_recorder_born_name;
    this.recorder_firstname = songInfo.song_recorder_firstname;
    this.recorder_lastname = songInfo.song_recorder_lastname;
    this.subtype = songInfo.song_subtype;
    this.type = songInfo.song_type;
    this.variant = songInfo.song_variant;
    this.volume = songInfo.song_volume;
    this.comment = songInfo.song_comment;
  }
}
