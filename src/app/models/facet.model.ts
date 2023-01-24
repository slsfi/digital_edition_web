export class Facet {
    public identifier?: string;
    public name?: string;
    public type?: string;
    public collection?: string;
    public count?: number;
    public children?: Array<Facet>;
    public checked?: boolean;
    public opened?: boolean;
}
