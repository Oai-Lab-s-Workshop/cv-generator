/// <reference path="../pb_data/types.d.ts" />

const JOBS_COLLECTION_ID = "jobs0000000001ab"
const OLD_START_DATE_FIELD_ID = "text1269603864"
const OLD_END_DATE_FIELD_ID = "text826688707"
const NEW_START_DATE_FIELD_ID = "date3261409811"
const NEW_END_DATE_FIELD_ID = "date2795210844"

function normalizeJobDate(value) {
  const trimmed = (value || "").trim()

  if (!trimmed) {
    return ""
  }

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01 00:00:00.000Z`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} 00:00:00.000Z`
  }

  return trimmed
}

function denormalizeJobDate(value) {
  const trimmed = (value || "").trim()

  if (!trimmed) {
    return ""
  }

  const monthMatch = trimmed.match(/^(\d{4}-\d{2})-01 00:00:00(?:\.000)?Z$/)
  if (monthMatch) {
    return monthMatch[1]
  }

  const dayMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}) 00:00:00(?:\.000)?Z$/)
  if (dayMatch) {
    return dayMatch[1]
  }

  return trimmed
}

function snapshotJobRecordDates(app, transform) {
  const records = app.findAllRecords(JOBS_COLLECTION_ID)
  const jobDates = []

  for (const record of records) {
    jobDates.push({
      id: record.id,
      startDate: transform(record.getString("startDate")),
      endDate: transform(record.getString("endDate")),
    })
  }

  return jobDates
}

function restoreJobRecordDates(app, jobDates) {
  const records = app.findAllRecords(JOBS_COLLECTION_ID)

  for (const record of records) {
    const dates = jobDates.find((item) => item.id === record.id)

    if (!dates) {
      continue
    }

    record.set("startDate", dates.startDate)
    record.set("endDate", dates.endDate)
    app.save(record)
  }
}

migrate((app) => {
  const normalizedJobDates = snapshotJobRecordDates(app, normalizeJobDate)

  const collection = app.findCollectionByNameOrId(JOBS_COLLECTION_ID)

  collection.fields.removeById(OLD_START_DATE_FIELD_ID)
  collection.fields.removeById(OLD_END_DATE_FIELD_ID)

  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": NEW_START_DATE_FIELD_ID,
    "name": "startDate",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": NEW_END_DATE_FIELD_ID,
    "name": "endDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  app.save(collection)
  restoreJobRecordDates(app, normalizedJobDates)
}, (app) => {
  const denormalizedJobDates = snapshotJobRecordDates(app, denormalizeJobDate)
  const collection = app.findCollectionByNameOrId(JOBS_COLLECTION_ID)

  collection.fields.removeById(NEW_START_DATE_FIELD_ID)
  collection.fields.removeById(NEW_END_DATE_FIELD_ID)

  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": OLD_START_DATE_FIELD_ID,
    "max": 0,
    "min": 0,
    "name": "startDate",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": OLD_END_DATE_FIELD_ID,
    "max": 0,
    "min": 0,
    "name": "endDate",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  app.save(collection)
  restoreJobRecordDates(app, denormalizedJobDates)
})
