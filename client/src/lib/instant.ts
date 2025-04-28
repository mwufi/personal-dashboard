import { init } from '@instantdb/react';

// Initialize InstantDB
// In a real app, you'd want to get this from an environment variable
const db = init({
    appId: '19a9cbb9-2c1b-4591-a5f5-498e93c5803d',
});

export default db;
