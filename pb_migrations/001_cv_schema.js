// CV Generator Database Schema
// Migration: 001_cv_schema.js

const CV_PROFILES_COLLECTION_ID = "cvprofile001abc";
const PERSONS_COLLECTION_ID = "persons000001abc";
const EMPLOIS_COLLECTION_ID = "emplois00001abc";
const PROJETS_COLLECTION_ID = "projets00001abc";
const COMPETENCES_COLLECTION_ID = "competence01abc";
const DIPLOMES_COLLECTION_ID = "diplomes0001abc";
const FILES_COLLECTION_ID = "files00000001ab";

function createPublicBaseCollection(id, name, fields) {
  return new Collection({
    id,
    name,
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields,
  });
}

migrate(
  (app) => {
    app.save(
      createPublicBaseCollection(CV_PROFILES_COLLECTION_ID, "cv_profiles", [
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "template",
          type: "select",
          required: true,
          values: ["classic", "modern", "minimal"],
          maxSelect: 1,
        },
        {
          name: "is_default",
          type: "bool",
        },
        {
          name: "profile_picture",
          type: "file",
          maxSelect: 1,
        },
        {
          name: "cover_picture",
          type: "file",
          maxSelect: 1,
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(PERSONS_COLLECTION_ID, "persons", [
        {
          name: "cv_profile",
          type: "relation",
          collectionId: CV_PROFILES_COLLECTION_ID,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "email",
        },
        {
          name: "phone",
          type: "text",
        },
        {
          name: "linkedin",
          type: "url",
        },
        {
          name: "github",
          type: "url",
        },
        {
          name: "website",
          type: "url",
        },
        {
          name: "summary",
          type: "editor",
        },
        {
          name: "profile_title",
          type: "text",
        },
        {
          name: "profile_picture",
          type: "file",
          maxSelect: 1,
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(EMPLOIS_COLLECTION_ID, "emplois", [
        {
          name: "cv_profile",
          type: "relation",
          collectionId: CV_PROFILES_COLLECTION_ID,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "company",
          type: "text",
          required: true,
        },
        {
          name: "position",
          type: "text",
          required: true,
        },
        {
          name: "location",
          type: "text",
        },
        {
          name: "date_start",
          type: "text",
        },
        {
          name: "date_end",
          type: "text",
        },
        {
          name: "responsibilities",
          type: "editor",
        },
        {
          name: "sort_order",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(COMPETENCES_COLLECTION_ID, "competences", [
        {
          name: "cv_profile",
          type: "relation",
          collectionId: CV_PROFILES_COLLECTION_ID,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "category",
          type: "select",
          values: ["Frontend", "Backend", "DevOps", "E-commerce", "Design", "Mobile", "Motion"],
          maxSelect: 1,
        },
        {
          name: "type",
          type: "select",
          values: ["Technical", "Professional", "Language"],
          maxSelect: 1,
        },
        {
          name: "level",
          type: "number",
        },
        {
          name: "sort_order",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(DIPLOMES_COLLECTION_ID, "diplomes", [
        {
          name: "cv_profile",
          type: "relation",
          collectionId: CV_PROFILES_COLLECTION_ID,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "school",
          type: "text",
        },
        {
          name: "year",
          type: "text",
        },
        {
          name: "level",
          type: "text",
        },
        {
          name: "sort_order",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(FILES_COLLECTION_ID, "files", [
        {
          name: "cv_profile",
          type: "relation",
          collectionId: CV_PROFILES_COLLECTION_ID,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "name",
          type: "text",
        },
        {
          name: "file",
          type: "file",
          maxSelect: 1,
          required: true,
        },
        {
          name: "alt",
          type: "text",
        },
        {
          name: "kind",
          type: "select",
          values: ["image", "video", "document", "other"],
          maxSelect: 1,
        },
        {
          name: "sort_order",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(PROJETS_COLLECTION_ID, "projets", [
        {
          name: "cv_profile",
          type: "relation",
          collectionId: CV_PROFILES_COLLECTION_ID,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "editor",
        },
        {
          name: "url",
          type: "url",
        },
        {
          name: "date",
          type: "text",
        },
        {
          name: "file",
          type: "relation",
          collectionId: FILES_COLLECTION_ID,
          maxSelect: 1,
        },
        {
          name: "sort_order",
          type: "number",
        },
      ]),
    );
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("files"));
    app.delete(app.findCollectionByNameOrId("diplomes"));
    app.delete(app.findCollectionByNameOrId("competences"));
    app.delete(app.findCollectionByNameOrId("projets"));
    app.delete(app.findCollectionByNameOrId("emplois"));
    app.delete(app.findCollectionByNameOrId("persons"));
    app.delete(app.findCollectionByNameOrId("cv_profiles"));
  },
);
