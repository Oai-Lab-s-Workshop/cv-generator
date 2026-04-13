/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("skills00000001ab")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "file1704208859",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "icon",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("skills00000001ab")

  // remove field
  collection.fields.removeById("file1704208859")

  return app.save(collection)
})
