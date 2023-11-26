const express = require('express')
const app = express();
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l9kydno.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const blogsCollection = client.db("techMed").collection("blogs")
    const reviewsCollection = client.db("techMed").collection("reviews")
    const doctorsCollection = client.db("techMed").collection("drlists")
    const centerCollection = client.db("techMed").collection("center")
    const userCollection = client.db("techMed").collection("users")
    const testCollection = client.db("techMed").collection("test")

    //for getting all blogs data endpoint
    app.get('/blogs', async(req,res) => {
        const result = await blogsCollection.find().toArray()
        res.send(result)
    })

    //for getting all reviews data endpoint
    app.get('/reviews', async(req,res) => {
        const result = await reviewsCollection.find().toArray()
        res.send(result)
    })

    //for getting doctor list data endpoint
    app.get('/drlists', async(req, res) => {
      const result = await doctorsCollection.find().toArray()
      res.send(result)
    })

    //for posting doctor info data endpoint
    app.post('/drlists', async(req, res) => {
      const item = req.body
      const result = await doctorsCollection.insertOne(item);
      res.send(result)
    })

    //for getting center list data endpoint
    app.get('/center', async(req, res) => {
      const result = await centerCollection.find().toArray()
      res.send(result)
    })

    //for getting all tests list data endpoint
    app.get('/test', async(req, res) => {
      const result = await testCollection.find().toArray()
      res.send(result)
    })

    //for getting test details data endpoint
    app.get('/test/:id', async(req,res) =>{
      const id = req.params.id;
      // console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await testCollection.findOne(query)
      res.send(result)
    })

    //for getting all users data endpoint
    app.get('/users', async(req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    //for post users data endpoint
    app.post('/users', async(req, res) => {
      const user = req.body;
      const query = {email:user?.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({message:'User already exist', insertedId:null})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    //for updating user data endpoint
    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
          $set: {
            role: 'admin'
          }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    //for user deleting data endpoint
    app.delete('/users/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Diagnostic center management is here')
})

app.listen(port, () => {
    console.log(`Diagnostic center is running on port ${port}`);
})