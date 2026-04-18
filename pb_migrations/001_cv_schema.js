// CV Generator Database Schema
// Migration: 001_cv_schema.js

const USERS_COLLECTION_ID = "_pb_users_auth_";
const CV_PROFILES_COLLECTION_ID = "cvprofile001abc";
const ACHIEVEMENTS_COLLECTION_ID = "achievements1ab";
const HOBBIES_COLLECTION_ID = "hobbies000001ab";
const SKILLS_COLLECTION_ID = "skills00000001ab";
const PROJECTS_COLLECTION_ID = "projects000001ab";
const JOBS_COLLECTION_ID = "jobs0000000001ab";
const DEGREES_COLLECTION_ID = "degrees0000001ab";
const FILES_COLLECTION_ID = "files00000001ab";
const OWNER_CAN_LIST_CV_PROFILE_RULE = "@request.auth.id != \"\" && user = @request.auth.id";
const PUBLIC_OR_OWNER_CAN_VIEW_CV_PROFILE_RULE = "public = true || (@request.auth.id != \"\" && user = @request.auth.id)";
const AUTHENTICATED_CAN_CREATE_CV_PROFILE_RULE = "@request.auth.id != \"\"";
const OWNER_CAN_UPDATE_CV_PROFILE_RULE = "@request.auth.id != \"\" && user = @request.auth.id";

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

function importUsersAuthCollection(app) {
  app.importCollections(
    [
      {
        id: USERS_COLLECTION_ID,
        name: "users",
        type: "auth",
        system: false,
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            id: "text3208210256",
            name: "id",
            type: "text",
            system: true,
            required: true,
            primaryKey: true,
            presentable: false,
            hidden: false,
            min: 15,
            max: 15,
            pattern: "^[a-z0-9]+$",
            autogeneratePattern: "[a-z0-9]{15}",
          },
          {
            id: "password901924565",
            name: "password",
            type: "password",
            system: true,
            required: true,
            presentable: false,
            hidden: true,
            min: 8,
            max: 0,
            pattern: "",
            cost: 0,
          },
          {
            id: "text2504183744",
            name: "tokenKey",
            type: "text",
            system: true,
            required: true,
            primaryKey: false,
            presentable: false,
            hidden: true,
            min: 30,
            max: 60,
            pattern: "",
            autogeneratePattern: "[a-zA-Z0-9]{50}",
          },
          {
            id: "email3885137012",
            name: "email",
            type: "email",
            system: true,
            required: true,
            presentable: false,
            hidden: false,
            exceptDomains: null,
            onlyDomains: null,
          },
          {
            id: "bool1547992806",
            name: "emailVisibility",
            type: "bool",
            system: true,
            required: false,
            presentable: false,
            hidden: false,
          },
          {
            id: "bool256245529",
            name: "verified",
            type: "bool",
            system: true,
            required: false,
            presentable: false,
            hidden: false,
          },
          {
            id: "text1579384326",
            name: "name",
            type: "text",
            system: false,
            required: false,
            primaryKey: false,
            presentable: false,
            hidden: false,
            min: 0,
            max: 255,
            pattern: "",
            autogeneratePattern: "",
          },
          {
            id: "file376926767",
            name: "avatar",
            type: "file",
            system: false,
            required: false,
            presentable: false,
            hidden: false,
            maxSelect: 1,
            maxSize: 0,
            mimeTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
            protected: false,
            thumbs: null,
          },
          {
            id: "textfirstname01",
            name: "firstName",
            type: "text",
            system: false,
            required: true,
            primaryKey: false,
            presentable: false,
            hidden: false,
            min: 0,
            max: 0,
            pattern: "",
            autogeneratePattern: "",
          },
          {
            id: "textlastname001",
            name: "lastName",
            type: "text",
            system: false,
            required: true,
            primaryKey: false,
            presentable: false,
            hidden: false,
            min: 0,
            max: 0,
            pattern: "",
            autogeneratePattern: "",
          },
          {
            id: "urllinkedin001",
            name: "linkedin",
            type: "url",
            system: false,
            required: false,
            presentable: false,
            hidden: false,
          },
          {
            id: "urlgithub0001",
            name: "github",
            type: "url",
            system: false,
            required: false,
            presentable: false,
            hidden: false,
          },
          {
            id: "urlwebsite001",
            name: "website",
            type: "url",
            system: false,
            required: false,
            presentable: false,
            hidden: false,
          },
          {
            id: "textphone00001",
            name: "phone",
            type: "text",
            system: false,
            required: false,
            primaryKey: false,
            presentable: false,
            hidden: false,
            min: 0,
            max: 0,
            pattern: "",
            autogeneratePattern: "",
          },
          {
            id: "fileprofile001",
            name: "profilePicture",
            type: "file",
            system: false,
            required: false,
            presentable: false,
            hidden: false,
            maxSelect: 1,
            maxSize: 0,
            mimeTypes: null,
            protected: false,
            thumbs: null,
          },
          {
            id: "filecover00001",
            name: "coverPicture",
            type: "file",
            system: false,
            required: false,
            presentable: false,
            hidden: false,
            maxSelect: 1,
            maxSize: 0,
            mimeTypes: null,
            protected: false,
            thumbs: null,
          },
          {
            id: "autodate2990389176",
            name: "created",
            type: "autodate",
            system: false,
            presentable: false,
            hidden: false,
            onCreate: true,
            onUpdate: false,
          },
          {
            id: "autodate3332085495",
            name: "updated",
            type: "autodate",
            system: false,
            presentable: false,
            hidden: false,
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [],
        options: {
          allowEmailAuth: true,
          allowOAuth2Auth: false,
          allowUsernameAuth: false,
          exceptEmailDomains: null,
          manageRule: null,
          minPasswordLength: 8,
          onlyEmailDomains: null,
          onlyVerified: false,
          requireEmail: true,
        },
      },
    ],
    false,
  );
}

function createSingleRelationField(name, collectionId, required = false) {
  return {
    name,
    type: "relation",
    collectionId,
    required,
    cascadeDelete: false,
    maxSelect: 1,
  };
}

function createMultiRelationField(name, collectionId) {
  return {
    name,
    type: "relation",
    collectionId,
    required: false,
    cascadeDelete: false,
    maxSelect: 999,
  };
}

migrate(
  (app) => {
    importUsersAuthCollection(app);

    app.save(
      createPublicBaseCollection(FILES_COLLECTION_ID, "files", [
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
          name: "sortOrder",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(ACHIEVEMENTS_COLLECTION_ID, "achievements", [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "editor",
        },
        {
          name: "sortOrder",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(HOBBIES_COLLECTION_ID, "hobbies", [
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
          name: "sortOrder",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(SKILLS_COLLECTION_ID, "skills", [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "category",
          type: "select",
          values: ["Frontend", "Backend", "DevOps", "E-commerce", "Design", "Mobile", "Motion", "Project Management"],
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
          name: "sortOrder",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(PROJECTS_COLLECTION_ID, "projects", [
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
        createSingleRelationField("file", FILES_COLLECTION_ID),
        createMultiRelationField("achievements", ACHIEVEMENTS_COLLECTION_ID),
        {
          name: "sortOrder",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(JOBS_COLLECTION_ID, "jobs", [
        {
          name: "label",
          type: "text",
          required: true,
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
          name: "startDate",
          type: "date",
          required: true,
        },
        {
          name: "endDate",
          type: "date",
        },
        {
          name: "responsibilities",
          type: "editor",
        },
        {
          name: "sortOrder",
          type: "number",
        },
        {
          name: "type",
          type: "select",
          required: true,
          values: ["freelance", "sideproject", "work project"],
          maxSelect: 1,
        },
        createMultiRelationField("skills", SKILLS_COLLECTION_ID),
        createMultiRelationField("projects", PROJECTS_COLLECTION_ID),
        createMultiRelationField("achievements", ACHIEVEMENTS_COLLECTION_ID),
      ]),
    );

    app.save(
      createPublicBaseCollection(DEGREES_COLLECTION_ID, "degrees", [
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
          name: "sortOrder",
          type: "number",
        },
      ]),
    );

    app.save(
      createPublicBaseCollection(CV_PROFILES_COLLECTION_ID, "cv_profiles", [
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
        },
        {
          name: "profileName",
          type: "text",
          required: true,
        },
        {
          name: "template",
          type: "text",
        },
        {
          name: "public",
          type: "bool",
        },
        createSingleRelationField("user", USERS_COLLECTION_ID, true),
        {
          name: "professionalSummary",
          type: "editor",
        },
        createMultiRelationField("achievements", ACHIEVEMENTS_COLLECTION_ID),
        createMultiRelationField("projects", PROJECTS_COLLECTION_ID),
        createMultiRelationField("hobbies", HOBBIES_COLLECTION_ID),
        createMultiRelationField("jobs", JOBS_COLLECTION_ID),
        createMultiRelationField("degrees", DEGREES_COLLECTION_ID),
        createMultiRelationField("skills", SKILLS_COLLECTION_ID),
        {
          name: "profilePicture",
          type: "file",
          maxSelect: 1,
        },
        {
          name: "coverPicture",
          type: "file",
          maxSelect: 1,
        },
      ]),
    );

    const cvProfilesCollection = app.findCollectionByNameOrId(CV_PROFILES_COLLECTION_ID);
    cvProfilesCollection.listRule = OWNER_CAN_LIST_CV_PROFILE_RULE;
    cvProfilesCollection.viewRule = PUBLIC_OR_OWNER_CAN_VIEW_CV_PROFILE_RULE;
    cvProfilesCollection.createRule = AUTHENTICATED_CAN_CREATE_CV_PROFILE_RULE;
    cvProfilesCollection.updateRule = OWNER_CAN_UPDATE_CV_PROFILE_RULE;
    app.save(cvProfilesCollection);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("cv_profiles"));
    app.delete(app.findCollectionByNameOrId("degrees"));
    app.delete(app.findCollectionByNameOrId("jobs"));
    app.delete(app.findCollectionByNameOrId("projects"));
    app.delete(app.findCollectionByNameOrId("skills"));
    app.delete(app.findCollectionByNameOrId("hobbies"));
    app.delete(app.findCollectionByNameOrId("achievements"));
    app.delete(app.findCollectionByNameOrId("files"));
  },
);
