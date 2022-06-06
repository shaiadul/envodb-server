const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();


app = express();
port = process.env.PORT || 5000

//middleware 
app.use(cors());
app.use(express.json());


// verifyJWT
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        //console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

//for connect database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jnjyz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



//home of server
app.get('/', (req, res) => {
    res.send('alhamdulilla your invo||DB server is ready for service')
})

//async function run 
async function run() {
    try {
        await client.connect();
        const productCollection = client.db("inventories").collection("products");
        const sectionCollection = client.db("inventories").collection("data");
        const itemsCollection = client.db("inventories").collection("items")
        console.log('db connected');

        // use get and load all data by DB
        app.get("/products", async (req, res) => {
            const products = await productCollection.find({}).toArray();
            res.send(products);
        })
        app.get("/data", async (req, res) => {
            const data = await sectionCollection.find({}).toArray();
            res.send(data);
        })
        //  let get api for single id
        app.get('/products/:id', async (req, res) => {
            const id = req.params;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        })
        // delete a product
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })
        // Post api 
        app.post('/products', async (req, res) => {
            const newProducts = req.body;
            const result = await productCollection.insertOne(newProducts);
            res.send(result)
        });
        //Update user or decrees by 1 when click delevery 
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const updateQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updateQuantity.quantity
                }
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //items collection post api
        app.post('/items', async (req, res) => {
            const items = req.body;
            const result = await itemsCollection.insertOne(items);
            res.send(result);
        })
        //  items collection get api
        app.get('/items', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const authHeader = req.headers.authorization;
            // check email 
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = itemsCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
        })
        // -------------------------------------------
        // AUTH - GET JWT
        app.post('/token', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken })
        })
        // -------------------------------------------

    }
    finally {

    }
}
//call run function (important)
run().catch(console.dir);

//listen data (important)
app.listen(port, () => {
    console.log('in sha allah it is work', port);
})