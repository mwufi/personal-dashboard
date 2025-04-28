# fetching data

const query = { goals: {}, todos: {} };
const { isLoading, error, data } = db.useQuery(query);
We will now see data for both namespaces.


Fetch a specific entity
If you want to filter entities, you can use the where keyword. Here we fetch a specific goal

const query = {
  goals: {
    $: {
      where: {
        id: healthId,
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);

Fetch associations
We can fetch goals and their related todos.

const query = {
  goals: {
    todos: {},
  },
};
const { isLoading, error, data } = db.useQuery(query);
goals would now include nested todos

console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!",
      "todos": [...],
    },
    {
      "id": workId,
      "title": "Get promoted!",
      "todos": [...],
    }
  ]
}

# writing data
Instant uses a Firebase-inspired interface for mutations. We call our mutation language InstaML

Update data
We use the update action to create entities.

import { init, id } from '@instantdb/react';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
});

// transact! 🔥
db.transact(db.tx.goals[id()].update({ title: 'eat' }));
This creates a new goal with the following properties:

It's identified by a randomly generated id via the id() function.
It has an attribute title with value eat.
Similar to NoSQL, you don't need to use the same schema for each entity in a namespace. After creating the previous goal you can run the following:

db.transact(
  db.tx.goals[id()].update({
    priority: 'none',
    isSecret: true,
    value: 10,
    aList: [1, 2, 3],
    anObject: { foo: 'bar' },
  }),
);

You can store strings, numbers, booleans, arrays, and objects as values. You can also generate values via functions. Below is an example for picking a random goal title.

db.transact(
  db.tx.goals[id()].update({
    title: ['eat', 'sleep', 'hack', 'repeat'][Math.floor(Math.random() * 4)],
  }),
);
The update action is also used for updating entities. Suppose we had created the following goal

const eatId = id();
db.transact(
  db.tx.goals[eatId].update({ priority: 'top', lastTimeEaten: 'Yesterday' }),
);
We eat some food and decide to update the goal. We can do that like so:

db.transact(db.tx.goals[eatId].update({ lastTimeEaten: 'Today' }));
This will only update the value of the lastTimeEaten attribute for entity eat.

Merge data
When you update an attribute, you overwrite it. This is fine for updating values of strings, numbers, and booleans. But if you use update to overwrite json objects you may encounter two problems:

You lose any data you didn't specify.
You risk clobbering over changes made by other clients.
For example, imagine we had a game entity, that stored a state of favorite colors:

// User 1 saves {'0-0': 'red'}
db.transact(db.tx.games[gameId].update({ state: { '0-0': 'red' } }));

// User 2 saves {'0-1': 'blue'}
db.transact(db.tx.games[gameId].update({ state: { '0-1': 'blue' } }));

// 🤔 Uh oh! User 2 overwrite User 1:
// Final State: {'0-1': 'blue' }
To make working with deeply-nested, document-style JSON values a breeze, we created merge. Similar to lodash's merge function, merge allows you to specify the slice of data you want to update:

// User 1 saves {'0-0': 'red'}
db.transact(db.tx.games[gameId].merge({ state: { '0-0': 'red' } }));

// User 2 saves {'0-1': 'blue'}
db.transact(db.tx.games[gameId].merge({ state: { '0-1': 'blue' } }));

// ✅ Wohoo! Both states are merged!
// Final State: {'0-0': 'red', '0-1': 'blue' }
merge only merges objects. Calling merge on arrays, numbers, or booleans will overwrite the values.

The delete action is used for deleting entities.

db.transact(db.tx.goals[eatId].delete());
You can generate an array of delete txs to delete all entities in a namespace

const { isLoading, error, data } = db.useQuery({ goals: {} });
const { goals } = data;
// ...

db.transact(goals.map((g) => db.tx.goals[g.id].delete()));

Link data
link is used to create associations.

Suppose we create a goal and a todo.

db.transact([
  db.tx.todos[workoutId].update({ title: 'Go on a run' }),
  db.tx.goals[healthId].update({ title: 'Get fit!' }),
]);
We can associate healthId with workoutId like so:

db.transact(db.tx.goals[healthId].link({ todos: workoutId }));
We could have done all this in one transact too via chaining transaction chunks.

db.transact([
  db.tx.todos[workoutId].update({ title: 'Go on a run' }),
  db.tx.goals[healthId]
    .update({ title: 'Get fit!' })
    .link({ todos: workoutId }),
]);
You can specify multiple ids in one link as well:

db.transact([
  db.tx.todos[workoutId].update({ title: 'Go on a run' }),
  db.tx.todos[proteinId].update({ title: 'Drink protein' }),
  db.tx.todos[sleepId].update({ title: 'Go to bed early' }),
  db.tx.goals[healthId]
    .update({ title: 'Get fit!' })
    .link({ todos: [workoutId, proteinId, sleepId] }),
]);
Links are bi-directional. Say we link healthId to workoutId

db.transact(db.tx.goals[healthId].link({ todos: workoutId }));
We can query associations in both directions

const { isLoading, error, data } = db.useQuery({
  goals: { todos: {} },
  todos: { goals: {} },
});

const { goals, todos } = data;
console.log('goals with nested todos', goals);
console.log('todos with nested goals', todos);

Lookup by unique attribute
If your entity has a unique attribute, you can use lookup in place of the id to perform updates.

import { lookup } from '@instantdb/react';

db.transact(
  db.tx.profiles[lookup('email', 'eva_lu_ator@instantdb.com')].update({
    name: 'Eva Lu Ator',
  }),
);
The lookup function takes the attribute as its first argument and the unique attribute value as its second argument.

## Using files (attachments, etc)

Upload files
Use db.storage.uploadFile(path, file, opts?) to upload a file.

path determines where the file will be stored, and can be used with permissions to restrict access to certain files.
file should be a File type, which will likely come from a file-type input.
opts is optional and can be used to set the contentType and contentDisposition headers for the file.
// use the file's current name as the path
await db.storage.uploadFile(file.name, file);

// or, give the file a custom name
const path = `${user.id}/avatar.png`;
await db.storage.uploadFile(path, file);

// or, set the content type and content disposition
const path = `${user.id}/orders/${orderId}.pdf`;
await db.storage.uploadFile(path, file, {
  contentType: 'application/pdf',
  contentDisporition: `attachment; filename="${orderId}-confirmation.pdf"`,
});

Overwrite files
If the path already exists in your storage directory, it will be overwritten!

// Uploads a file to 'demo.png'
await db.storage.uploadFile('demo.png', file);

// Overwrites the file at 'demo.png'
await db.storage.uploadFile('demo.png', file);
If you don't want to overwrite files, you'll need to ensure that each file has a unique path.

View files
You can retrieve files by querying the $files namespace.

// Fetch all files from earliest to latest upload
const query = {
  $files: {
    $: {
      order: { serverCreatedAt: 'asc' },
    },
  },
});
const { isLoading, error, data } = db.useQuery(query);
console.log(data)
{
  "$files": [
    {
      "id": fileId,
      "path": "demo.png"
      // You can use this URL to serve the file
      "url": "https://instant-storage.s3.amazonaws.com/...",
      "content-type": "image/png",
      "content-disposition": "attachment; filename=\"demo.png\"",
    },
    // ...
  ]
}
You can use query filters and associations as you would with any other namespace to filter and sort your files.

const { user } = db.useAuth();
const query = {
  profiles: {
    $: {
      where: {"$user.id": user.id}
    },
    $files: {},
  },
});
// Defer until we've fetched the user and then query associated files
const { isLoading, error, data } = db.useQuery(user ? query : null);

Link files
Use links to associate files with other entities in your schema.

async function uploadImage(file: File) {
  try {
    // Create an explicit upload path
    const path = `${user.id}/avatar`;
    // Upload the file
    const { data } = await db.storage.uploadFile(path, file);
    // Link it to a profile
    await db.transact(db.tx.profiles[profileId].link({ avatar: data.id }));
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}