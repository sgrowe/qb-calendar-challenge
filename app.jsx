import Immutable from 'immutable'
import React from 'react'
import ReactDOM from 'react-dom'


// if one event ends at the same time the next starts then we
// won't count that as an overlap
function startsDuring (time, event) {
  return time >= event.get('start') &&
    time < event.get('end')
}

function endsDuring (time, event) {
  return time > event.get('start') &&
    time <= event.get('end')
}

function eventsOverlap (eventA, eventB) {
  return startsDuring(eventA.get('start'), eventB) ||
    endsDuring(eventA.get('end'), eventB) ||
    startsDuring(eventB.get('start'), eventA) ||
    endsDuring(eventB.get('end'), eventA)
}

function compareEvents (a, b) {
  // for sorting, earlier events first, based on start time
  // first and then end time if the start times are the same

  const compareStart = compareTimes(a.get('start'), b.get('start'))

  return compareStart === 0
    ? compareTimes(a.get('end'), b.get('end'))
    : compareStart
}

function compareTimes (a, b) {
  if (a < b) {
    return -1
  }

  if (a > b) {
    return 1
  }

  return 0
}

function findClashingEvent (event, otherEvents) {
  for (let i = 0; i < otherEvents.size; i++) {
    const otherEvent = otherEvents.get(i)

    if (eventsOverlap(event, otherEvent)) {
      return otherEvent
    }
  }
  return null
}

const emptyList = Immutable.List([])

function groupClashingEvents (events) {
  let groups = emptyList

  events.forEach(event => {
    for (let i = 0; i < groups.size; i++) {
      const group = groups.get(i)

      if (group.some(ev => eventsOverlap(event, ev))) {
        groups = groups.set(i, group.push(event))
        return
      }
    }

    groups = groups.push(Immutable.List([event]))
  })

  return groups
}

function layoutGroup (group) {
  const columns = layoutInColumns(group)

  const clashes = columns.size - 1

  return columns
    .flatMap((column, colNo) =>
      column.map(event => event.set('clashes', clashes).set('column', colNo))
    )
}

function layoutInColumns (events) {
  let columns = emptyList

  events.forEach(event => {
    for (let colNo = 0; ; colNo++) {
      const column = columns.get(colNo) || emptyList

      if (!findClashingEvent(event, column)) {
        columns = columns.set(colNo, column.push(event))
        break
      }
    }
  })

  return columns
}

class Event extends React.Component {
  position () {
    const { event } = this.props

    const containerWidth = 600
    const containerHeight = 720

    const top = event.get('start')
    const bottom = containerHeight - event.get('end')

    const column = event.get('column')
    const eventWidth = containerWidth / (event.get('clashes') + 1)

    const left = column * eventWidth
    const right = containerWidth - ((column + 1) * eventWidth)

    return { top, bottom, left, right }
  }

  styling () {
    const { top, bottom, left, right } = this.position()

    return {
      top: `${top}px`,
      bottom: `${bottom}px`,
      left: `${left}px`,
      right: `${right}px`
    }
  }

  render () {
    const { event } = this.props

    return (
      <div className='event' style={this.styling()}>
        <div className='event-body'>
          <p className='event-name'>{ event.get('name') }</p>
          <p className='event-location'>{ event.get('location') }</p>
        </div>
      </div>
    )
  }
}

function showTwoDigits (x) {
  x = String(x)

  return x.length === 1 ? '0' + x : x
}

function twelveHourTime (hour, minutes) {
  hour = hour > 12 ? hour % 12 : hour

  return `${hour}:${showTwoDigits(minutes)}`
}

function TimeMark ({ hour, minutes }) {
  const isMajor = minutes === 0

  const className = 'timeMark' + (isMajor ? '' : ' timeMark-minor')

  const amOrPm = hour < 13 ? 'AM' : 'PM'

  return (
    <div className={className}>
      {twelveHourTime(hour, minutes)}
      { isMajor ? <span>{amOrPm}</span> : '' }
    </div>
  )
}

function CalendarTimings ({ startHour, endHour }) {
  return (
    <div className='timings'>
      {
        Immutable
          .Range(startHour, endHour + 1)
          .flatMap(hour => [ { hour, minutes: 0 }, { hour, minutes: 30 } ])
          .skipLast(1)
          .map(({ hour, minutes }, index) => <TimeMark key={index} hour={hour} minutes={minutes} />)
          .toJS()
      }
    </div>
  )
}

function CalendarBackground ({ startHour, endHour }) {
  return (
    <div className='background'>
      {
        Immutable
          .Range(startHour, endHour)
          .map(x => <div key={x} className='hourBox' />)
          .toJS()
      }
    </div>
  )
}

function CalendarDay ({ events }) {
  const startHour = 9
  const endHour = 21

  return (
    <div className='calendar'>
      <CalendarTimings startHour={startHour} endHour={endHour} />
      <div className='calendar-body'>
        <CalendarBackground startHour={startHour} endHour={endHour} />
        {
          events
            .map((event, index) => <Event event={event} key={index} />)
            .toJS()
        }
      </div>
    </div>
  )
}

function layOutDay (events) {
  events = Immutable.fromJS(events)
  // create an immutable copy of the data passed in to make sure we don't
  // inadvertently modfiy it either here, or in our UI components.

  const groups = groupClashingEvents(events.sort(compareEvents))

  events = groups
    .flatMap(layoutGroup)
    .map(event => event.set('name', 'Sample name').set('location', 'Sample location'))

  ReactDOM.render(
    <CalendarDay events={events} />,
    document.getElementById('calendar')
  )
}

window.layOutDay = layOutDay

layOutDay([
  { start: 30, end: 150 },
  { start: 540, end: 600 },
  { start: 560, end: 620 },
  { start: 610, end: 670 }
])
