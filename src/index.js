const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words');
const {GenerateMessages, GenerateLocation} = require('./utils/messages');
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users');

const app = express()
const port = process.env.PORT || 3002
const server = http.createServer(app) // this will create a web server explicity. Even if we dont do tis express will create a web server for us behind the scenes. But here we create it so that we can pass it to socket.io
const io = socketio(server)

const publicDirectory = path.join(__dirname, '../public')

app.use(express.static(publicDirectory))

// let count = 0
io.on('connection', (socket) => {
    console.log('Web Socket Connection')

    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count) //this one emits only to the specific connection which the user at the moment is interacting with
    //     io.emit('countUpdated', count) //this one emits to all the connection connected with the socket.io at any given time
    // })

    // socket.emit('message', GenerateMessages('Welcome!')) //every connection recieves this message first time they open
    // socket.broadcast.emit('message', GenerateMessages('A new user has joined')) //this emit is used when a new connection is opneed somewhere else. So the actual new connection where it is opened does not get this message but all other users gets the message that a new user has joined.

    socket.on('join', ({ username, room }, cb) => {
        const {error, user} = addUser({id: socket.id, username, room})
        if(error) {
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('message', GenerateMessages('Welcome!'))
        socket.broadcast.to(user.room).emit('message', GenerateMessages(`${user.username} has joined`)) //to method will only emit messages to that specific named connection

        //Emitting all the users in a room back to the client and updating everytime a new user joins
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on('emitMessage', (msg, cb) => { //here we provide callback cb as the acknowledgment opf the client message recieved
        const user = getUser(socket.id)
        if(!user) {
            return cb('Message not sent - some error occured')
        }

        const filter = new Filter()
        if(filter.isProfane(msg)) {
            return cb('Message not sent - your message violates our community guidelines.')
        }
        io.to(user.room).emit('message', GenerateMessages(user.username, msg))
        cb()
    })

    socket.on('sendLocation', (location, cb) => {
        const user = getUser(socket.id)
        if(!user) {
            return cb('Location not sent - some error occured')
        }

        io.to(user.room).emit('messageLocation', GenerateLocation(user.username, `https://www.google.com/maps?q=${location.latitude},${location.longitude}`))
        cb()
    })

    /* idsconnect is a built in method of socket.io, so whenever any connection gets closed then this method is triggered */
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            console.log(user)
            io.to(user.room).emit('message', GenerateMessages(`${user.username} has left the chat`)) //we emit this messageLocation to all existing active connection of any connection closes
            //Updating everytime a user leaves
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})