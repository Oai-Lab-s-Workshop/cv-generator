// CV Generator Database Schema
// Migration: 001_cv_schema.js

migrate((db) => {
  // cv_profiles table
  db.createCollection({
    name: "cv_profiles",
    schema: new schema({
      slug: {
        type: "text",
        unique: true,
        required: true
      },
      name: {
        type: "text",
        required: true
      },
      template: {
        type: "select",
        values: ["classic", "modern", "minimal"],
        default: "classic",
        required: true
      },
      is_default: {
        type: "bool",
        default: false
      },
      created: {
        type: "datetime",
        default: "now()"
      },
      updated: {
        type: "datetime"
      }
    })
  });

  // persons table
  db.createCollection({
    name: "persons",
    schema: new schema({
      cv_profile: {
        type: "relation",
        collection: "cv_profiles",
        cascadeDelete: true,
        required: true
      },
      name: {
        type: "text",
        required: true
      },
      email: {
        type: "email"
      },
      phone: {
        type: "text"
      },
      linkedin: {
        type: "url"
      },
      github: {
        type: "url"
      },
      website: {
        type: "url"
      },
      summary: {
        type: "text"
      },
      profile_title: {
        type: "text"
      },
      profile_picture: {
        type: "file"
      }
    })
  });

  // emplois table
  db.createCollection({
    name: "emplois",
    schema: new schema({
      cv_profile: {
        type: "relation",
        collection: "cv_profiles",
        cascadeDelete: true,
        required: true
      },
      company: {
        type: "text",
        required: true
      },
      position: {
        type: "text",
        required: true
      },
      location: {
        type: "text"
      },
      date_start: {
        type: "text"
      },
      date_end: {
        type: "text"
      },
      responsibilities: {
        type: "text"
      },
      sort_order: {
        type: "number",
        default: 0
      }
    })
  });

  // projets table
  db.createCollection({
    name: "projets",
    schema: new schema({
      cv_profile: {
        type: "relation",
        collection: "cv_profiles",
        cascadeDelete: true,
        required: true
      },
      name: {
        type: "text",
        required: true
      },
      description: {
        type: "text"
      },
      url: {
        type: "url"
      },
      date: {
        type: "text"
      },
      sort_order: {
        type: "number",
        default: 0
      }
    })
  });

  // competences table
  db.createCollection({
    name: "competences",
    schema: new schema({
      cv_profile: {
        type: "relation",
        collection: "cv_profiles",
        cascadeDelete: true,
        required: true
      },
      name: {
        type: "text",
        required: true
      },
      category: {
        type: "select",
        values: ["Frontend", "Backend", "DevOps", "E-commerce", "Design", "Mobile", "Motion"]
      },
      type: {
        type: "select",
        values: ["Technical", "Professional", "Language"]
      },
      level: {
        type: "number"
      },
      sort_order: {
        type: "number",
        default: 0
      }
    })
  });

  // diplomes table
  db.createCollection({
    name: "diplomes",
    schema: new schema({
      cv_profile: {
        type: "relation",
        collection: "cv_profiles",
        cascadeDelete: true,
        required: true
      },
      title: {
        type: "text",
        required: true
      },
      school: {
        type: "text"
      },
      year: {
        type: "text"
      },
      level: {
        type: "text"
      },
      sort_order: {
        type: "number",
        default: 0
      }
    })
  });
}, (db) => {
  // Rollback
  db.dropCollection("diplomes");
  db.dropCollection("competences");
  db.dropCollection("projets");
  db.dropCollection("emplois");
  db.dropCollection("persons");
  db.dropCollection("cv_profiles");
});
