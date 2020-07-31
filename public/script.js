const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const myVideo = document.createElement('video')
myVideo.muted = true
//a variable to store what we have connected of users
const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    addVideoStream(myVideo, stream)

    //listen someone tries to call us
    myPeer.on('call', call => {
        // answer call, send them our stream
        call.answer(stream)

        // listen the video stream comes in
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    //allow myself connected to other users
    socket.on('user-connected', userId => {
        //send my stream to the user
        connectToNewUser(userId, stream)
    })
})

socket.on('user-disconnected', userId => {
    console.log('User {} is left.', userId)
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

socket.on('user-connected', userId => {
    console.log('User connected :' + userId)
    if (peers[userId]) {
        peers[userId].close()
    }
})


//functions
function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream )
    const video = document.createElement('video')
    //listen event from calling
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })

    call.on('close', () => {
        video.remove()
    })

    //add to global obj
    peers[userId] = call
}
