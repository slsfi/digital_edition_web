interface SearchQuery {
  queries: string[]
  highlight: object
  from: number
  size: number
  facetGroups?: FacetGroups
  range?: TimeRange
  sort?: object[]
}

interface AggregationQuery {
  queries: string[]
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
  [key: string]: Aggregation
}

interface Aggregation {
  terms?: Terms
  date_histogram?: DateHistogram
}

interface Terms {
  size: number
  field: string
}

interface DateHistogram {
  field: string
  calendar_interval: string,
  format: string
}

interface SuggestionsQuery {
  query: string
}

interface SuggestionsConfig {
  [aggregationKey: string]: {
    field: string
    size: number
  }
}

interface AggregationsData {
  [aggregationKey: string]: AggregationData
}

interface AggregationData {
  buckets?: Facet[]
  filtered?: {
    buckets: Facet[]
  }
}

