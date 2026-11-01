// One-off migration: reconcile the Employee.email index with the new
// partial-unique definition. The old schema declared `email: { unique: true }`
// which created a plain unique index `email_1`. The new schema uses a partial
// unique index so drafts can exist without an email. Mongoose cannot change an
// existing index in place, so we drop the old one and let the app rebuild it.
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const coll = mongoose.connection.db.collection('employees');

    const indexes = await coll.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    const emailIdx = indexes.find(i => i.name === 'email_1');
    if (emailIdx && !emailIdx.partialFilterExpression) {
      console.log('Dropping legacy non-partial email_1 index…');
      await coll.dropIndex('email_1');
      console.log('Dropped. The app will recreate it as a partial unique index on next start.');
    } else if (emailIdx && emailIdx.partialFilterExpression) {
      console.log('email_1 is already a partial index — nothing to do.');
    } else {
      console.log('No email_1 index found — nothing to do.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
