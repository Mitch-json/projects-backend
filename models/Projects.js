const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    documentation: {
        type: String,
        trim: true
    },

    thumbImage: {
        type: String,
        required: true,
        trim: true
    },
    liveLink: {
        type: String,
        trim: true
    },
    videoLink: {
        type: String,
        trim: true
    },
    codeLink: {
        type: String,
        trim: true
    },
    diagram: {
        type: String,
        trim: true
    },
},{timestamps: true});

module.exports = mongoose.model('Project', projectSchema);