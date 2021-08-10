const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log('Count has been updated', count)
// })

// document.querySelector('#increment').addEventListener('click', e => {
//     socket.emit('increment')
// })

const $form = document.getElementById('form1')
const $location = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $leave = document.querySelector("#leave-room")
const $template1 = document.querySelector("#message-template").innerHTML
const $template2 = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (Math.round(containerHeight - newMessageHeight - 100) <= Math.round(scrollOffset)) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (res) => {
    console.log(res)
    const html = Mustache.render($template1, {
        username: res.username,
        messages: res.text,
        time: moment(res.time).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('messageLocation', res => {
    console.log(res)
    const html = Mustache.render($template2, {
        username: res.username,
        url: res.url,
        time: moment(res.time).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit', function(event) {
    event.preventDefault();
    const element = event.target.elements
    const formData = new FormData(this);
    const entries = Object.fromEntries(formData.entries());
    // console.log(this, event.target, event.target.elements.message.value) //here this and event.target points to the same object
    // for (const formElement of formData) {
    //     console.log('hi', formElement);
    // }
    
    element.btnSubmit.setAttribute('disabled', true)

    socket.emit('emitMessage', entries.message, error => { //here we can pass a callback function as the last argument which acts as an acknowledgment of the message sent from the client. emitMessage is the name of the event, entries.inoutText1 is the data - but we can rovide as many number of data we can 1 or n number of arguments. Only the last argument needs to a callback function. 
        element.btnSubmit.removeAttribute('disabled')
        element.message.value = ''
        element.message.focus()
        // const xH = $messages.scrollHeight; 
        // $messages.scrollTo(0, xH);

        if(error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

$location.addEventListener('click', e => {
    if(!navigator.geolocation) {
        alert('Geoloacation is not supported by your browser')
    }
    $location.setAttribute('disabled', true)

    navigator.geolocation.getCurrentPosition(position => {
        // console.log(position, navigator)
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, error => {
            $location.removeAttribute('disabled')
            // const xH = $messages.scrollHeight; 
            // $messages.scrollTo(0, xH);
            if(error) {
                return console.log(error)
            }
            console.log('Location shared')
        })
    })
})

function leave() {
    // socket.emit('disconnect')
    location.href = '/'
}

socket.emit('join', { username, room }, error => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})

// form.addEventListener('formdata', (e) => {
//     let data = e.formData;
//     console.log('formdata fired', data, data.values(), Object.fromEntries(data.values()));
//     for (var value of data.values()) {
//         console.log('value', value);
//     }
// });