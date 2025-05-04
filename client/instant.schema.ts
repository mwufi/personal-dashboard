// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  // We inferred 46 attributes!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.any(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    beavers: i.entity({
      color: i.string(),
      createdAt: i.number(),
      name: i.string(),
    }),
    blogPosts: i.entity({
      content: i.string(),
      createdAt: i.string(),
      headerImgUrl: i.string(),
      lastEdited: i.string(),
      publishedDate: i.string(),
      status: i.string(),
      tags: i.any(),
      title: i.string(),
    }),
    bookProgress: i.entity({
      createdAt: i.any(),
      data: i.any(),
    }),
    books: i.entity({
      author: i.string(),
      coverUrl: i.string(),
      createdAt: i.string(),
      finishDate: i.string(),
      notes: i.string(),
      startDate: i.string(),
      status: i.string(),
      title: i.string(),
    }),
    collections: i.entity({
      createdAt: i.string(),
      name: i.any(),
    }),
    habitCompletions: i.entity({
      completed: i.boolean(),
      createdAt: i.string(),
      date: i.string(),
      notes: i.string(),
    }),
    habits: i.entity({
      createdAt: i.string(),
      description: i.string(),
      name: i.string(),
    }),
    items: i.entity({
      author: i.string(),
      createdAt: i.string(),
      description: i.string(),
      name: i.string(),
      pages: i.number(),
      rating: i.number(),
      read: i.boolean(),
      title: i.string(),
    }),
    projectNotes: i.entity({
      attachmentUrls: i.json(),
      commentCount: i.number(),
      content: i.string(),
      createdAt: i.string(),
      isPinned: i.boolean(),
      likeCount: i.number(),
      retweetCount: i.number(),
    }),
    projects: i.entity({
      createdAt: i.string(),
      headerBackground: i.json(),
      headerImg: i.string(),
      isPublic: i.boolean(),
      name: i.string(),
    }),
    projectTasks: i.entity({
      isComplete: i.any(),
      task: i.any(),
    }),
    todos: i.entity({
      createdAt: i.number(),
      done: i.boolean(),
      text: i.string(),
    }),
    sessions: i.entity({
      name: i.string(),
      createdAt: i.string(),
      paused: i.boolean(),
      finishedAt: i.string(),
    }),
    waterIntakes: i.entity({
      amount: i.number(),
      createdAt: i.string(),
      date: i.string(),
      time: i.string(),
    }),
  },
  links: {
    bookProgressBook: {
      forward: {
        on: "bookProgress",
        has: "one",
        label: "book",
        onDelete: "cascade",
      },
      reverse: {
        on: "books",
        has: "many",
        label: "bookProgress",
      },
    },
    collectionsItems: {
      forward: {
        on: "collections",
        has: "many",
        label: "items",
      },
      reverse: {
        on: "items",
        has: "many",
        label: "collections",
      },
    },
    habitCompletionsHabit: {
      forward: {
        on: "habitCompletions",
        has: "one",
        label: "habit",
        onDelete: "cascade",
      },
      reverse: {
        on: "habits",
        has: "many",
        label: "completions",
      },
    },
    projectNotesProject: {
      forward: {
        on: "projectNotes",
        has: "one",
        label: "project",
        onDelete: "cascade",
      },
      reverse: {
        on: "projects",
        has: "many",
        label: "projectNotes",
      },
    },
    projectsTasks: {
      forward: {
        on: "projects",
        has: "many",
        label: "tasks",
      },
      reverse: {
        on: "projectTasks",
        has: "one",
        label: "project",
        onDelete: "cascade",
      },
    },
    projectsSessions: {
      forward: {
        on: "projects",
        has: "many",
        label: "sessions",
      },
      reverse: {
        on: "sessions",
        has: "one",
        label: "project",
        onDelete: "cascade",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
