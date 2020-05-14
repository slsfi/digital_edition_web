import { Component, Input } from '@angular/core'
import { Events } from 'ionic-angular'

/**
 * Visualize and select time ranges using from elastic search date histogram data.
 *
 * TODO: Add drag to select range.
 * TODO: Add more granular months selection.
 */
@Component({
  selector: 'date-histogram',
  templateUrl: 'date-histogram.html'
})
export class DateHistogram {

  @Input() years: [Facet]
  @Input() change: Function

  from: string
  to: string
  max = 0

  ngOnInit() {
    console.log('init', this.years)
    this.updateMax()
  }

  ngOnChanges() {
    this.updateMax()
  }

  private updateMax() {
    this.max = this.years.reduce(function (current, year) {
      return Math.max(current, year.doc_count)
    }, 0)
  }

  reset() {
    this.from = null
    this.to = null
    this.change(null, null)
  }

  // Send the change event to the parent component
  onChange() {
    const fromTime = new Date(this.from).getTime()
    // Add one year to get the full year.
    const toTime = new Date(`${parseInt(this.to) + 1}`).getTime()

    console.log(fromTime, toTime)

    if (fromTime <= toTime) {
      this.change(fromTime, toTime)
    }
    // this.change(
    //   this.years.find(year => year.key_as_string === this.from),
    //   this.years.find(year => year.key_as_string === this.to)
    // )
  }

  getYearRelativeToMax(year: Facet) {
    return `${Math.floor(year.doc_count / this.max * 100)}%`
  }

  isDecade(year: Facet) {
    return parseInt(year.key_as_string) % 10 === 0
  }

  selectYear(selected: Facet) {
    if (!this.from) {
      this.from = selected.key_as_string
    } else if (!this.to && parseInt(selected.key_as_string) >= parseInt(this.from)) {
      this.to = selected.key_as_string
    } else {
      this.from = selected.key_as_string
      this.to = null
    }

    this.onChange()
  }

  isYearInRange(year: Facet) {
    const yearNumber = parseInt(year.key_as_string)
    if (year.key_as_string === this.from || year.key_as_string === this.to) {
      return true

    } else if (this.from && this.to) {
      return yearNumber >= parseInt(this.from) && yearNumber <= parseInt(this.to)

    } else {
      return false
    }
  }
}
