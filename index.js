const express = require('express') ;
const cors = require('cors') ;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config() ;
const app = express() ;
const port = process.env.PORT || 5000 ;


// middleware
app.use(cors({
  origin: [
      'http://localhost:5173',
      
  ],
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());


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

// middlewares 
const logger = (req, res, next) =>{
  console.log('log: info', req.method, req.url);
  next();
}

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  

  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
      next();
  })
}

async function run() {
  try {
    // await client.connect();

    const allJobsCollection = client.db("AllJobsDB").collection("jobsCollection");
    const appliedJobsCollection = client.db("AllJobsDB").collection("appliedJobsCollection");

      // auth related api
      app.post('/jwt', logger, async (req, res) => {
        const user = req.body;
        console.log('user for token', user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
            .send({ success: true });
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
  })


    app.get('/allJobs', async (req, res) => { 
 
      let query = {} ;

      if(req.query?.email){
        query = { email : req.query.email}
      }
      const cursor = allJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
  })

  app.get('/titleBaseJob', async(req, res) => {

    console.log(req.query.jobTitle)

    let query = {} ;

    if(req.query.jobTitle){
      query = {jobTitle : req.query.jobTitle}
    }
    const cursor = allJobsCollection.find(query)
    const result = await cursor.toArray();
      res.send(result);
  })

    app.get('/appliedJobs',logger, verifyToken, async (req, res) => {
      console.log(req.query)
      let query = {} ;

      if(req.query?.email){
        query = { email : req.query.email , jobCategory : req.query.jobCategory}
      }

      const cursor = appliedJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
  })

    app.get('/appliedJobsEmail',logger, verifyToken, async (req, res) => {
      console.log(req.query)
      let query = {} ;

      if(req.query?.email){
        query = { email : req.query.email }
      }

      const cursor = appliedJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
  })


  app.get('/allAppliedJobs',logger, verifyToken, async(req, res) => {
    const cursor = appliedJobsCollection.find() ;
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


app.delete('/allJobs/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await allJobsCollection.deleteOne(query);
  res.send(result);
})

app.put('/allJobs/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updateJob = req.body;
  console.log(updateJob)

  const job = {
      $set: {
        PictureURL : updateJob.PictureURL,
         jobTitle : updateJob.jobTitle,
         userName : updateJob.userName,
         jobCategory : updateJob.jobCategory,
         salaryRange : updateJob.salaryRange,
         description : updateJob.description,
        jobPostingDate : updateJob.jobPostingDate,
         applicationDeadline : updateJob.applicationDeadline,
         applicants : parseInt(updateJob.applicants) ,
         email : updateJob.email
      }
  }
  console.log(job)

  const result = await allJobsCollection.updateOne(filter, job,options);
  res.send(result);
})


    app.post('/addJob', async(req, res) => {
      const newJob = req.body ;
      const result = await allJobsCollection.insertOne(newJob) ;
      res.send(result)
    })

    

    app.post('/appliedJob', async(req, res) => {
      const newAppliedJob = req.body ;

      const jobID = newAppliedJob.jobID ;

      const job = await allJobsCollection.findOne({ _id : new ObjectId(jobID)}) ;

    
        const currentApplicants = parseFloat(job.applicants) || 0; // Convert to float or default to 0
        const newApplicants = currentApplicants + 1;
        await allJobsCollection.updateOne({ _id: new ObjectId(jobID) }, { $set: { applicants: newApplicants.toString() } });
      


      const result = await appliedJobsCollection.insertOne(newAppliedJob) ;
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
