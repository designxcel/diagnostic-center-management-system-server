require('dotenv').config();
const express = require('express')
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.STRIPE_secret_key)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


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
    const cartCollection = client.db("techMed").collection("carts")
    const bookingCollection = client.db("techMed").collection("drbooking")
    const contactCollection = client.db("techMed").collection("contact")
    const paymentCollection = client.db("techMed").collection("payments")

    //middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
        if(error){
          return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next()
      })
    }

    //verify admin
    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message:'forbidden access'})
      }
      next();
    }

    //for jwt related api
    app.post('/jwt', async(req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1hr'})
      res.send({token})
    })

    //payment intent
    app.post('/create-payment-intent', async(req, res) => {
      const {price} = req.body
      const amount = parseInt(price * 100)
      console.log(amount, 'total amount')
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'] 
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    app.post('/payments', async(req, res) =>{
      const payment = req.body
      const paymentResult = await paymentCollection.insertOne(payment)
      console.log('payment info', payment)
      const query = {_id: {
        $in:payment.cartIds.map(id => new ObjectId(id))
      }}
      const deleteResult = await cartCollection.deleteMany(query)
      res.send({paymentResult, deleteResult})
    })

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

    //getting booking data
    app.get('/drbooking', async(req, res) => {
      const email = req.query.email
      const query = {email:email}
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })

    //post booking doctor appointment data endpoint
    app.post('/drbooking', async(req, res) => {
      const bookingItem = req.body;
      const result = await bookingCollection.insertOne(bookingItem)
      res.send(result)
    })
    
    //delete appointment data
    app.delete('/drbooking/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })

    //for getting doctor details data enpoint
    app.get('/drlists/:id', async(req,res) =>{
      const id = req.params.id;
      // console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await doctorsCollection.findOne(query)
      res.send(result)
    })

    // //for doctor booking post data api endpoint
    // app.post('/drlists', async(req, res) => {
    //   const bookingItem = req.body;
    //   const result = await doctorsCollection.insertOne(bookingItem)
    //   res.send(result)
    // })

    

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
    app.get('/users', verifyToken, verifyAdmin, async(req, res) => {
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

    //for admin check api
    app.get('/users/admin/:email', verifyToken, async(req, res) => {
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message:'forbidden access'})
      }
      const query = {email:email};
      const user = await userCollection.findOne(query)
      let admin = false;
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})
    })

    //for updating user role data endpoint
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
    app.delete('/users/:id', verifyToken, async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    //for getting cart item
    app.get('/carts', async(req, res) => {
      const email = req.query.email
      const query = {email:email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    //for adding item to cart 
    app.post('/carts', async(req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem)
      res.send(result)
    })

    //for deleting cart item
    app.delete('/carts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    //for getting newsletter info data
    app.get('/contact', async(req, res) => {
      const result = await contactCollection.find().toArray()
      res.send(result)
    })

    //for contact us page info data
    app.post('/contact', async(req, res) =>{
      const subscriber = req.body;
      const result =await contactCollection.insertOne(subscriber);
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