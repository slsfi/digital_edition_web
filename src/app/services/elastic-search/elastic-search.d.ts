
interface Query {
  type?: string
  query: string
  highlight: object
  from: number
  size: number
  facetGroups?: FacetGroups
}

interface FacetGroups {
  [facetGroupKey: string]: Facets
}

interface Facets {
  [facetKey: string]: Facet
}

interface Facet {
  doc_count: number
  key: string
  selected?: boolean
}

interface Aggregations {
  [key: string]: Aggregation
}

interface Aggregation {
  size: number
  field: string
}
