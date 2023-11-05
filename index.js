const express = require('express') ;
const cors = require('cors') ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config() ;
const app = express() ;
const port = process.env.PORT || 5000 ;


// middleware
app.use(cors()) ;
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tg0ohza.mongodb.net/?retryWrites=true&w=majority ` ;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();

    const allJobsCollection = client.db("AllJobsDB").collection("jobsCollection");

    app.get('/allJobs', async (req, res) => { 
      const cursor = allJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
  })

  app.get('/jobs/Remote', async(req, res) => {
    const cursor = allJobsCollection.find({'jobCategory' : 'Remote'})
    const result = await cursor.toArray() ;
    res.send(result)
  })

  app.get('/jobs/OnSite', async(req, res) => {
    const cursor = allJobsCollection.find({'jobCategory' : 'On Site'})
    const result = await cursor.toArray() ;
    res.send(result)
  })
  app.get('/jobs/Part-Time', async(req, res) => {
    const cursor = allJobsCollection.find({'jobCategory' : 'Part-Time'})
    const result = await cursor.toArray() ;
    res.send(result)
  })
  app.get('/jobs/Hybrid', async(req, res) => {
    const cursor = allJobsCollection.find({'jobCategory' : 'Hybrid'})
    const result = await cursor.toArray() ;
    res.send(result)
  })

  app.get('/allJobs/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await allJobsCollection.findOne(query);
    res.send(result);
})

    app.post('/addJob', async(req, res) => {
      const newJob = req.body ;
      const result = await allJobsCollection.insertOne(newJob) ;
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('current server running')
})

app.listen(port, () => {
    console.log(`current server is running on port: ${port}`)
})
