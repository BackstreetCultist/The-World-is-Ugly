const express = require("express")
const app = express()
const bodyParser = require('body-parser')
app.use(express.urlencoded())
app.use(bodyParser.json())

const PORT = process.env['PORT'] || 8080

const vision = require("@google-cloud/vision")
const client = new vision.ImageAnnotatorClient()
const {Datastore} = require('@google-cloud/datastore');
const {Storage} = require('@google-cloud/storage')
const { response } = require("express")

// Creates a client
const datastore = new Datastore();
const storage = new Storage()

app.post("/api/register", async function(request, response){
    var contactArray = request.body.Contacts
    var count = contactArray.length
    console.log(request.headers['content-type'])
    console.log(contactArray)
    console.log(count)

    contactArray.forEach(async function(contact){
        const nameKey = datastore.key("Contact");
        const task = {
            key: nameKey,
            data: {
                Name: contact.Name,
                Number: contact.Number,
              },
          };
        await datastore.save(task);
        console.log(`Saved ${task.key.name}: ${task.data.Number}`);
    })

    //Post the number of added contacts to datastore
        //so that a random one can be fetched later
    const countKey = datastore.key(["Count", "Count"]);
    const countTask = {
        key: countKey,
        data: {
            Count: count,
            },
        };
    await datastore.save(countTask);
    console.log(`Saved ${countTask.key.name}: ${countTask.data.Number}`);

    response.send(request.body)
})

app.get("/api/punish", async function(request, response){
    const contact = await getRandomContact()
    const photo = await getRandomPhoto()

    console.log(contact)
    console.log(photo)
    sendSMS(contact.Name, contact.Number, photo)
    response.sendStatus(200)
})

app.get("/api/checkphoto", async function(request, response){ 
    var imageLink = request.query.imageLink
    var label = request.query.label.toLowerCase()

    const [result] = await client.labelDetection(imageLink)
    const labels = result.labelAnnotations
    var found = false
    labels.forEach(element => {
        if (element.description.toLowerCase() === label)
        {
            response.send(true)
            found = true
            return
        }
    })

    if (!found)
    {
        response.send(false)
    }
})

async function getRandomContact(){
    const key = datastore.key(["Count", "Count"]);

    const count = await new Promise((resolve, reject) => { 
        datastore.get(key, (err, entity) => {
        if (err){
            reject(err)
        }
        resolve(entity.Count)
        })
    })

    const index = Math.floor(Math.random() * count)

    const query = datastore.createQuery('Contact');
    
    return new Promise((resolve, reject) => {
        datastore
            .runQuery(query)
            .then(results => {
            const contacts = results[0];
            var i = 0
            contacts.forEach(contact => {
                if(i === index){
                    resolve(contact)
                }
                i++
            });
            })
            .catch(err => {
            console.error('ERROR:', err)
            reject(err)
        });
    })
}

async function getRandomPhoto(){
    //TODO
    return new Promise(async (resolve, reject) => {
        const BUCKET_NAME = "hostage-photos"
        const [files] = await storage.bucket(BUCKET_NAME).getFiles()

        const index = Math.floor(Math.random() * files.length)
        const filename = files[index].name
        console.log("Chosen file: ")
        console.log(filename)

        await storage.bucket(BUCKET_NAME).file(filename).makePublic()
        const address = "http://" + BUCKET_NAME + ".storage.googleapis.com/" + filename
        resolve(address)
    })
}

function sendSMS(name, number, photo){
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    const messageString = "Hello, " + name + ", we think it's very important that you see this... " + photo

    client.messages
    .create({
        body: messageString,
        from: '+447449791403',
        to: number
    })
    .then(message => console.log(message.sid));
}

app.listen(PORT, ()=>{console.log(`Server started on port ${PORT}`)})