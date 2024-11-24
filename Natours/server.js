const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const mongoose = require('mongoose');


const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

async function connectDB() {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected DB');
  } catch (err) {
    console.log(err);
  }
}

const port = process.env.PORT || 3000;
app.listen(port,async () => {
  await connectDB();
  console.log(`App running on port ${port}...`);
});
