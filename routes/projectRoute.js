const express = require('express');
const router = express();
const Project = require('../models/Projects')

router.get('/projects', (req, res)=>{
    Project.find((err, projects)=>{
        res.status(200).send({projects: projects})
    })
})

router.get('/projects/:id', (req, res)=>{
    Project.findById(req.params.id, (err, project)=>{
        if(err){
            throw err;
        }
        else{
            res.status(200).send({project: project})
        }
    })
})
router.get('/projects/delete-project/:id', async function(req, res){
    const id = req.params.id
    const db = await Project.findById(id)

    Project.deleteOne({_id: db._id}, (err)=>{
        if (err) {
            res.status(200).send({err: err.message})
        }else{
            res.status(200).send({msg: "Project Successfully Deleted"})
        }
    });
})


router.post('/projects/add-project', (req, res)=>{
    const title = req.body.title
    const description = req.body.description
    const documentation = req.body.documentation
    const liveLink = req.body.liveLink
    const videoLink = req.body.videoLink
    const codeLink = req.body.codeLink
    const diagram = req.body.diagram
    const thumbImage = req.body.thumbImage

    var project = new Project({
        title: title,
        description: description, 
        documentation: documentation, 
        liveLink: liveLink, 
        videoLink: videoLink, 
        codeLink: codeLink, 
        diagram: diagram, 
        thumbImage: thumbImage 
    });

    project.save((err)=>{
        if(err){
            res.status(200).send({"err": err.message})
        }else{
            res.status(200).send({"msg": "Project Added"})
        }
    })
})

router.post('/projects/edit-project/:id', async function(req, res){
    const id = req.params.id
    const title = req.body.title
    const description = req.body.description
    const documentation = req.body.documentation
    const liveLink = req.body.liveLink
    const videoLink = req.body.videoLink
    const codeLink = req.body.codeLink
    const diagram = req.body.diagram
    const thumbImage = req.body.thumbImage

    Project.findOneAndUpdate({"_id": id}, {
        title: title,
        description: description, 
        documentation: documentation, 
        liveLink: liveLink, 
        videoLink: videoLink, 
        codeLink: codeLink, 
        diagram: diagram, 
        thumbImage: thumbImage 
    }, {upsert: true}, function(err, doc) {
        if (err){

            res.send(500, {error: err});
        }else{
            res.status(200).send({"msg": "Project Updated"})
        }
    });

   

    
})

module.exports = router