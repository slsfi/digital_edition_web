export class Occurrence {
    public collection_id?: string;
    public description: string;
    public id: string;
    public publication_comment_id: string;
    public publication_facsimile_id: string;
    public publication_manuscript_id: string;
    public publication_version_id: string;
    public publication_id: string;
    public original_filename: string;
    public type: string;
    public publication_manuscript: any;
    public publication_version: any;
    public publication_comment: any;
    public publication_facsimile?: any;
    public publication_facsimile_page?: any;
    public publication: any;
    public collection_name: string;
    public publication_name: string;
    public name: string;
    public song_name?: string;
    public song_id?: string;
    public song_number?: string;
    public song_original_collection_location?: string;
    public song_original_collection_signature?: string;
    public song_original_publication_date?: string;
    public song_page_number?: string;
    public song_performer_born_name?: string;
    public song_performer_firstname?: string;
    public song_performer_lastname?: string;
    public song_place?: string;
    public song_recorder_born_name?: string;
    public song_recorder_firstname?: string;
    public song_recorder_lastname?: string;
    public song_subtype?: string;
    public song_type?: string;
    public song_variant?: string;
    public song_volume?: string;
    public song_landscape?: string;
}

export class OccurrenceType {
    public id: string;
    public name: string;
    public original_filename: string;
}

export class OccurrenceResult {
    id: string;
    project_id: string;
    name: string;
    first_name: string;
    last_name: string;
    full_name: string;
    sortBy: string;
    object_type?: string;
    occurrences: any[];
    date_born?: any;
    date_deceased?: any;
    longitude?: any;
    latitude?: any;
    occupation?: any;
    description?: any;
    place_of_birth?: any;
    city?: any;
    country?: any;
    region?: any;
    source?: any;
    type?: any;
    author_data?: any;
    publisher?: any;
    published_year?: any;
    journal?: any;
    isbn?: any;
}
