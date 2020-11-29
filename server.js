const express = require("express")
const app = express()
const bodyParser = require('body-parser')
app.use(express.urlencoded())
app.use(bodyParser.json())

const PORT = process.env['PORT'] || 8080

const vision = require("@google-cloud/vision")
const client = new vision.ImageAnnotatorClient()
const {Datastore} = require('@google-cloud/datastore');
const { response } = require("express")

// Creates a client
const datastore = new Datastore();

app.post("/api/register", function(request, response){
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

app.get("/api/punish", function(){
    const contact = await getRandomContact()
    const photo = getRandomPhoto()

    console.log(contact)
    
    response.send(request.body)
})

app.post("/api/checkphoto", async function(request, response){ 
    var image = request.body.image
    var label = request.body.label.toLowerCase()

    var base64Image = Buffer.from(image, 'base64')
    const [result] = await client.labelDetection(base64Image)
    const labels = result.labelAnnotations
    console.log(labels)
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

app.listen(PORT, ()=>{console.log(`Server started on port ${PORT}`)})