const express = require("express")
const app = express()
app.use(express.urlencoded())

const PORT = process.env['PORT'] || 8080

const vision = require("@google-cloud/vision")
const client = new vision.ImageAnnotatorClient()


app.get("/api/register", function(){
    // TODO
})

app.get("/api/punish", function(){
    //TODO
})

app.post("/api/checkphoto", async function(request, response){ 
    var image = request.body.image
    var label = request.body.label.toLowerCase()

    var base64Image = Buffer.from(image, 'base64')
    const [result] = await client.labelDetection(base64Image)
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

app.listen(PORT, ()=>{console.log(`Server started on port ${PORT}`)})