
interface Query {
  type?: string
  query: string
  highlight: object
  from: number
  size: number
  facetGroups?: FacetGroups
  range?: TimeRange
}

interface TimeRange {
  from?: string | number
  to?: string | number
}

interface FacetGroups {
  [facetGroupKey: string]: Facets
}

interface Facets {
  [facetKey: string]: Facet
}

interface Facet {
  doc_count: number
  key: string | number
  key_as_string?: string
  selected?: boolean
}

interface Aggregations {
  [key: string]: {
    terms: Terms
  }
}

interface Terms {
  size: number
  field: string
}
