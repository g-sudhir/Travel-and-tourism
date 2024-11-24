const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');

const Tour = require('./../../models/tourModel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`,'utf8'));

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(()=>{
     console.log('SUCCESS FULLY CONNECTED!');
     const importData = async () => {
        try{
           await Tour.create(tours);
           console.log('Data successfully loaded!');
           process.exit();
        }
        catch(err){
            console.log(err);
        }
     }

     const deleteData = async () => {
        try{
            await Tour.deleteMany();
            console.log("Data successfully deleted!");
            process.exit();
        }
        catch(err){
            console.log(err);
        }
     }
     if(process.argv[2] === '--import'){
        importData();
     }
     else if(process.argv[2] === '--delete'){
        deleteData();
     }
  });

