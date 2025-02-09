//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid:"f2891190d713482dbed4c3fd804ec233",
    //token:null,
    uid:null,
    channel:"channel1",
}

const response = await fetch('/generate_agora_token/');
const data = await response.json();
token = data.token;
//#3 - Setting tracks for when user joins
let localTracks = {
    audioTrack:null,
    videoTrack:null
}

//#4 - Want to hold state for users audio and video so user can mute and hide
let localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}

//#5 - Set remote tracks to store other users
let remoteTracks = {}


// Microphone 
let microphonebut = document.getElementById("microphonebut");
let microphoneicon = document.getElementById("microphoneicon");

document.getElementById('join-btn').addEventListener('click', async () => {
    config.uid = document.getElementById('username').value
    await joinStreams()
    document.getElementById('join-wrapper').style.display = 'none'
    document.getElementById('footer').style.display = 'flex'
    document.getElementById('bottom-bar').style.display = 'flex'
})

document.getElementById('mic-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.audioTrackMuted){
        //Mute your audio
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true
        document.getElementById('mic-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
        document.getElementById('fa-microphone').classList.remove("fa-microphone");
        document.getElementById('fa-microphone').classList.add("fa-microphone-slash");
    }else{
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted = false
        document.getElementById('mic-btn').style.backgroundColor ='#1f1f1f8e'
        
        document.getElementById('fa-microphone').classList.remove("fa-microphone-slash");
        document.getElementById('fa-microphone').classList.add("fa-microphone");

    }

})



document.getElementById('camera-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.videoTrackMuted){
        //Mute your audio
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').style.backgroundColor ='#1f1f1f8e'

    }

})



document.getElementById('leave-btn').addEventListener('click', async () => {
    //Loop threw local tracks and stop them so unpublish event gets triggered, then set to undefined
    //Hide footer
    for (trackName in localTracks){
        let track = localTracks[trackName]
        if(track){
            track.stop()
            track.close()
            localTracks[trackName] = null
        }
    }

    //Leave the channel
    await client.leave()
    document.getElementById('footer').style.display = 'none'
    document.getElementById('bottom-bar').style.display = 'none'
    document.getElementById('user-streams').innerHTML = ''
    document.getElementById('join-wrapper').style.display = 'block'

})




//Method will take all my info and set user stream in frame
let joinStreams = async () => {
    //Is this place hear strategicly or can I add to end of method?
    
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);


    client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = './assets/volume-on.svg'
            }else{
                document.getElementById(`volume-${speaker}`).src = './assets/volume-off.svg'
            }
            
        
            
        }
    });

    //#6 - Set and get back tracks for local user
    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, config.channel, token ||null, config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()

    ])
    
    //#7 - Create player and add it to player list
    let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                  </div>`

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    localTracks.videoTrack.play(`stream-${config.uid}`)
    

    //#9 Add user to user list of names/ids

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await client.publish([localTracks.audioTrack, localTracks.videoTrack])

}


let handleUserJoined = async (user, mediaType) => {
    console.log('Handle user joined')

    //#11 - Add user to list of remote users
    remoteTracks[user.uid] = user

    //#12 Subscribe ro remote users
    await client.subscribe(user, mediaType)
   
    
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        console.log('player:', player)
        if (player != null){
            player.remove()
        }
 
        player = `<div class="video-containers " id="video-wrapper-${user.uid}">
                        <p class="user-uid "><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`
        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
         user.videoTrack.play(`stream-${user.uid}`)

        

          
    }
    

    if (mediaType === 'audio') {
        user.audioTrack.play();
      }
}


let handleUserLeft = (user) => {
    console.log('Handle user left!')
    //Remove from remote users and remove users video wrapper
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`).remove()
}




// Gestion du partage d'écran
document.addEventListener("DOMContentLoaded", () => {
    const screenShareButton = document.getElementById('screenShareButton');
    let localScreenTrack = null;
    let screenClient = null;
    let screenContainer = null;
    let mainClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    async function startScreenShare() {
        try {
            // Réafficher tous les enfants
      

            screenClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            const tokenResponse = await fetch('/generate_agora_token/');
            const tokenData = await tokenResponse.json();
            await screenClient.join(config.appid, config.channel, tokenData.token, null);

            localScreenTrack = await AgoraRTC.createScreenVideoTrack( {encoderConfig: "1080p_1"});

            

             // Ajoute le partage d'écran à l'interface utilisateur
             const player = `<div class="video-containers" style="z-index: 100;" id="screen-share-wrapper">
             <p class="user-uid">Partage d'écran</p>
             <div class="video-player" id="screen-share-player"></div>
           </div>`;
            Array.from(document.getElementById('user-streams').children).forEach(child => {
                child.style.display = 'none';
            });
            document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);

            localScreenTrack.play("screen-share-player");

           
             
            // move the main user from the full-screen div
              
            await screenClient.publish(localScreenTrack);
             // Sauvegarde la piste dans localTracks pour gestion future
             localTracks.screenTrack = localScreenTrack;

             // Change l'icône ou l'état du bouton si nécessaire
             document.getElementById('screenShareButton').style.backgroundColor = 'rgb(163, 45, 45)';

            localScreenTrack.on('track-ended', stopScreenShare);
            
        } catch (error) {
            console.error("Erreur de partage d'écran: ", error);
        }
    }

    async function stopScreenShare() {
        if (localScreenTrack) {
           
            localScreenTrack.stop();
            localScreenTrack.close();
            await screenClient.unpublish(localScreenTrack);
    
            // Supprime l'élément d'interface utilisateur associé
            document.getElementById('screen-share-wrapper').remove();
    
            // Réinitialise la piste
            localTracks.screenTrack = null;
            localScreenTrack= null;
            // Change l'icône ou l'état du bouton si nécessaire
            document.getElementById('screenShareButton').style.backgroundColor = '';
            Array.from(document.getElementById('user-streams').children).forEach(child => {
                child.style.display = 'block';
            });
            
        }
    }
    
    screenShareButton.addEventListener('click', () => {
        if (localScreenTrack) {
            console.log("valuer: ",localScreenTrack)
            stopScreenShare();
        } else {
            startScreenShare();
        }
    });


   // Gestion du bouton vidéo
document.addEventListener("DOMContentLoaded", () => {
    let videobutton = document.getElementById("videobutton");
    let videoicon = document.getElementById("videoicon");

    videobutton.addEventListener("click", () => {
        localVideoTrack.setEnabled(!localVideoTrack.enabled);
        if (videoicon.classList.contains("fa-video")) {
            videoicon.classList.replace("fa-video", "fa-video-slash");
        } else {
            videoicon.classList.replace("fa-video-slash", "fa-video");
        }
    });
});

    mainClient.on('message', (msg) => {
        const message = JSON.parse(msg.text);
        if (message.type === 'screen-share') {
            // Interface management
        }
    });
});





document.getElementById('screen-share-player').addEventListener('dblclick', () => {
    const elem = document.getElementById('screen-share-player');
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
});


function closeForm() {
    document.getElementById("myForm").style.display = "none";
  }

  function openForm() {
    document.getElementById("myForm").style.display = "block";
  }