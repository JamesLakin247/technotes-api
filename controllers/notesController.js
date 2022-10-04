const Note = require('../models/Note')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

// @desc    Get all notes
// @route   Get /notes
// @access  Private
const getNotes = asyncHandler( async (req, res) => {
    const notes = await Note.find().lean()

    //If no notes
    if (!notes?.length) {
        return res.status(400).json({message: 'no notes found'})
    }

    // Add usernam eto each note before sending the respose
    // See Promise.all with map() here: https://yout.be/4lqJBBEpjRE 
    // You could also do this with a for.. of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return  {...note, username: user.username}
    }))

    res.json(notesWithUser)
})

// @desc    Create new note
// @route   POST /notes
// @access  Private
const createNote = asyncHandler( async (req, res) => {
    const { user, title, text} = req.body

    if (!user || !title || !text) {
        return res.status(400).json({message: 'all fields are required'})
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({title}).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({message: "Duplicate note title, try another title"})
    }

    // Create and store the new note
    const note = await Note.create({user, title, text})

    if (note) {
        return res.status(200).json({message: 'New note created'})
    } else {
        return res.status(200).json({message: "Invalid note data recieved"})
    }

})

// @desc    Update note
// @route   PATCH /notes
// @access  Private
const updateNote = asyncHandler( async (req, res) => {
    const { id, user, title, text, completed } = req.body

    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({message: "All fields are required"})
    }

    const note = await Note.findOne({ id }).exec()

    if (!note) {
        return res.status(400).json({message: 'Note not found'})
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message: "Duplicate note title, try another title"})
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    return res.json(`${note.title} updated`)
})

// @desc    Delete note
// @route   DELETE /notes
// @access  Private
const deleteNote = asyncHandler( async (req, res) => {
    const note = await Note.findById({id}).exec()

    if (!note) {
        return res.status(400).json({message: 'Note not found'})
    }

    const result = await note.deleteOne()

    const reply = `Note ${result.id} with ID ${result.id} deleted`

    res.json(reply)
})

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote
}