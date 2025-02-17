console.log("Welcome");


// Reconnaissance vocale:
let subscriptionKey = "GAhhrZCYQlVVFPpcyRRR2B2GypAFI9w1oxaYPlqTXOJIRaDt1chCJQQJ99AKACYeBjFXJ3w3AAAYACOGSatX";
let serviceRegion = "eastus";

let audioConfig;
let recognizer;
let input_voice= 'fr-FR';
let targetLanguage = 'en-US';
let lastRecognizedText = '';
let  aiAudioPlaying = false;
let chatLanguage = "en-US";

//===== Gestion des sélecteurs de langue
document.getElementById('languageSelect').addEventListener('change', (event) => {
    input_voice = event.target.value;
    stopRecognition();
    startRecognition();
    console.log("Langue d'entrée:", input_voice);
});

document.getElementById('scroll-button').addEventListener('change', (event) => {
    targetLanguage = event.target.value;
    console.log("target_language: ", targetLanguage);
    if (event.target.value === 'original' && !aiAudioPlaying) {
      aiAudioPlaying = false;
      document.getElementById("remote_transcript").innerText =""

    } else if (event.target.value !== 'original' && !aiAudioPlaying) {
        aiAudioPlaying = true;
    }
});

document.getElementById('chat_lang').addEventListener('change', (event) => {
    chatLanguage = event.target.value;
    console.log("chat_language: ", targetLanguage);
   
});
//===== End Gestion des sélecteurs de langue


// ======= Fonction de reconnaissance vocale ========

// WebSocket pour la reconnaissance vocale
const voiceSocket = new WebSocket("wss://" + window.location.host + "/ws/voice/");
console.log("Voice WebSocket: ", voiceSocket);

const startRecognition = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechRecognitionLanguage = input_voice;

    audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizing = (s, e) => {
        //document.getElementById('output').innerText = `Recognizing: ${e.result.text}`;
        console.log("Text: ",e.result.text)
    };

    recognizer.recognized = async (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const recognizedText = e.result.text;
            if (recognizedText !== lastRecognizedText) {
                // Appeler la fonction de traduction
                //const translatedText = await translateText(recognizedText);
                
                voiceSocket.send(JSON.stringify({
                    transcript: recognizedText,
                    username: currentUsername,
                }));

                //document.getElementById('output').innerText = `Me: ${recognizedText}`;
                lastRecognizedText = recognizedText;
            }
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
            //document.getElementById('output').innerText = "No speech could be recognized.";
            console.log("No speech could be recognized.")
        }
    };

    recognizer.startContinuousRecognitionAsync(
        () => console.log("Recognition started."),
        err => console.error(err)
    );
};

const stopRecognition = () => {
    if (recognizer) {
        recognizer.stopContinuousRecognitionAsync(
            () => console.log("Recognition stopped."),
            err => console.error(err)
        );
    }
};

// Fonction de traduction de texte
async function translateText(text) {
    try {
        const subscriptionKey = '6wb4SY1xPaK6f9hTQeXH7j1fQuInvtmszas159jZ06Bv07V2hegVJQQJ99AKACYeBjFXJ3w3AAAAACOGnUa0';
        const endpoint = 'https://api.cognitive.microsofttranslator.com/';
        const region = 'eastus';
        const path = '/translate?api-version=3.0';
        const url = `${endpoint}${path}&to=${targetLanguage.split('-')[0]}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Ocp-Apim-Subscription-Region': region,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ 'Text': text }])
        });

        if (response.ok) {
            const data = await response.json();
            return data[0].translations[0].text;
        } else {
            console.error('Erreur de traduction:', response.statusText);
            return "";
        }
    } catch (error) {
        console.error('Erreur réseau ou autre:', error);
        return "";
    }
}
// ======= Fin Fonction de reconnaissance vocale =======

// =====Voice message send:


voiceSocket.onmessage = async function (e) {
    const data = JSON.parse(e.data);
    console.log("Received transcript1: ", data.transcript);
    if (data.username !== currentUsername && data.transcript) {
        
       if (aiAudioPlaying) {
            console.log("Received transcript: ", data.transcript);
            const translatedText = await translateText(data.transcript);
            document.getElementById("remote_transcript").innerText = `${data.username}: ${translatedText}`;
            console.log("Received transcript1: ", data.transcript);
            synthesizeSpeech(translatedText);
        }
    }
}; 

//======End voice message

//==== Speech synthesis
async   function synthesizeSpeech(text) {
    let language = targetLanguage;
    if (language === 'original') {
        language = 'en-US';
    }

        const speechConfig1 = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
        const audioConfig1 = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        //speechConfig1.speechSynthesisVoiceName = "en-US-DavisNeural";
        speechConfig1.speechSynthesisLanguage = language;
         
        
        const speechSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig1, audioConfig1);
        //text =  translateText(text);
        console.log(text)
        speechSynthesizer.speakTextAsync(
            text,
            result => {
                if (result) {
                    speechSynthesizer.close();
                    return result.audioData;
                }
            },
            error => {
                console.log(error);
                speechSynthesizer.close();
            }
        );
        }
        
//===== End Speech synthésis

//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

//#2
let config = {
    appid:"f2891190d713482dbed4c3fd804ec233",
    //token:null,
    uid:null,
    channel:`${channel_name}` ,
}


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
    await joinStreams(channel_name)
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
let joinStreams = async (channel_add) => {
    //Is this place hear strategicly or can I add to end of method?
    console.log("Channel: ", channel_add)
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);

    client.on("stream-message", (uid, msg) => {
       
        
       
        const decoder = new TextDecoder();
        const message = decoder.decode(msg);

       console.log("Message décodé :", message);
              
       if (message === "start") {
        console.log("Message reçu")
        Array.from(document.getElementById('user-streams').children).forEach(child => {
            child.style.display = 'none';
        });
        console.log(`Partage d'écran démarré par l'utilisateur ${uid}`);
        }else if (message === "stop") {
            Array.from(document.getElementById('user-streams').children).forEach(child => {
                child.style.display = 'block';
            });
            console.log(`Partage d'écran arrêté par l'utilisateur ${uid}`);
        }
    });
    
    client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if (volume > 0) {
                document.getElementById(`volume-${speaker}`).classList.remove('fa-volume-mute');
                document.getElementById(`volume-${speaker}`).classList.add('fa-volume-up');
            } else {
                document.getElementById(`volume-${speaker}`).classList.remove('fa-volume-up');
                document.getElementById(`volume-${speaker}`).classList.add('fa-volume-mute');
            }
            
        
            
        }
    });
    const response = await fetch(`/generate_agora_token/${channel_add}`);
    const data = await response.json();
    token = data.token;
    
    //#6 - Set and get back tracks for local user
    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, channel_add, token, config.uid),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()

    ])
    
    //#7 - Create player and add it to player list
    let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid" ><i id="volume-${config.uid}" class="fas fa-volume-up"></i>${config.uid}</p>
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
                        <p class="user-uid "><i id="volume-${user.uid}" class="fas fa-volume-up"></i> ${user.uid}</p>
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

            const tokenResponse = await fetch(`/generate_agora_token/${channel_name}`);
            const tokenData = await tokenResponse.json();
            await screenClient.join(config.appid, config.channel, tokenData.token, "ShareScreen");

            localScreenTrack = await AgoraRTC.createScreenVideoTrack( {encoderConfig: "1080p_1", mirror: false});

           // Envoyer un message pour notifier les utilisateurs distants
            client.sendStreamMessage("start", JSON.stringify({ type: "screen-share", action: "start" }));
            await screenClient.publish(localScreenTrack);

             // Ajoute le partage d'écran à l'interface utilisateur
             const player = `<div class="video-containers" style="z-index: 100;" id="screen-share-wrapper">
             <p class="user-uid">Partage d'écran</p>
             <div class="video-player" id="screen-share-player"></div>
            </div>`;
            
           // document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);

             localScreenTrack.play("screen-share-player");
           
            // Réinitialiser les vidéos locales
                Array.from(document.getElementById('user-streams').children).forEach(child => {
                    if (!child.id.includes('screen-share-wrapper')) {
                        child.style.display = 'none';
                    }
                });
           
             
            // move the main user from the full-screen div
           
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
           
            await screenClient.unpublish(localScreenTrack);
            //localScreenTrack.stop();
            localScreenTrack.close();
            // Supprime l'élément d'interface utilisateur associé
            //document.getElementById('screen-share-wrapper').remove();
            await screenClient.leave();
    
            // Réinitialise la piste
            localTracks.screenTrack = null;
            localScreenTrack= null;
            // Change l'icône ou l'état du bouton si nécessaire
            document.getElementById('screenShareButton').style.backgroundColor = '';
            Array.from(document.getElementById('user-streams').children).forEach(child => {
                child.style.display = 'block';
            });
             // Envoyer un message pour notifier la fin du partage d'écran
           client.sendStreamMessage("stop", JSON.stringify({ type: "screen-share", action: "stop" }));
            
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



// Fonction pour envoyer un message
function sendhandMessage(text) {
    console.log("Begin send Message")
    const userInput = document.getElementById('user-input');
    //const message = userInput.value.trim();
    const message1 = document.getElementById('id_message_send_input');
    const messageInput= `${currentUsername} hand ${text}`;
    console.log("Message: ", messageInput, currentUsername)

    if (messageInput || messageInput.trim() !== "") {
        console.log("Message: ", messageInput, currentUsername);
        // Envoyer le message via WebSocket
        
        chatSocket.send(JSON.stringify({
            message: messageInput, 
            username: currentUsername,
            //numberOfDivs: numberOfDivs
         }));

    }
}


 document.addEventListener("DOMContentLoaded", () => {
            // Gestion du bouton de main et de l'icône
            const handButton = document.getElementById("handButton");
            const handIcon = document.getElementById("handIcon");
            const handPopup = document.getElementById("handpopup");
          
            handButton.addEventListener("click", () => {
              if (handIcon.classList.contains("fa-hand-sparkles")) {
                //handPopup.style.visibility = "visible";
                sendhandMessage("up")
                handIcon.classList.replace("fa-hand-sparkles", "fa-hand-peace");
                handButton.style.backgroundColor = 'rgb(207, 84, 84)';
              } else {
                //handPopup.style.visibility = "hidden";
                handIcon.classList.replace("fa-hand-peace", "fa-hand-sparkles");
                handButton.style.backgroundColor = 'transparent';
                sendhandMessage("down")
              }
            });
          
            // Gestion du compteur de temps écoulé
            const timeDisplay = document.getElementById("timecounter");
            const startTime = Date.now();
          
            function updateElapsedTime() {
              const currentTime = Date.now();
              const distance = currentTime - startTime;
              const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
              timeDisplay.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
            }
          
            setInterval(updateElapsedTime, 1000);
          });



//Chat 
 /* // Initialisation

const userID = currentUsername; // ID utilisateur unique
const channelName = config.channel; // Nom du canal

const clientMessage =""// AgoraRTM.createInstance(config.appid);
let channel = config.channel;
let currentMessageID = null; // Stocker l'ID du message sélectionné

// Connexion au client
async function initRTM() {
    try {
        await currentMessageID.login({ uid: userID });
        console.log('Logged in as:', userID);

        // Joindre le canal
        channel = currentMessageID.createChannel(channelName);
        await channel.join();
        console.log('Joined channel:', channelName);

        // Écoute des messages entrants
        channel.on('ChannelMessage', (message, senderId) => {
            displayReceivedMessage(message.text, senderId);
        });

    } catch (error) {
        console.error('RTM error:', error);
    }
}
initRTM();

// Envoyer un message
document.getElementById('id_message_send_button').addEventListener('click', () => {
    const messageInput = document.getElementById('id_message_send_input');
    const message = messageInput.value;

    if (message.trim()) {
        channel.sendMessage({ text: message }).then(() => {
            addMessageToChat(message, userID);
            messageInput.value = '';
        }).catch(console.error);
    }
});

// Afficher un message reçu
function displayReceivedMessage(message, sender) {
    const chatArea = document.getElementById('text_chat');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('received-message');
    messageDiv.textContent = `${sender}: ${message}`;
    chatArea.appendChild(messageDiv);
}

// Ajouter un message localement
function addMessageToChat(message, sender) {
    const chatArea = document.getElementById('text_chat');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('sent-message');
    messageDiv.textContent = `${sender}: ${message}`;
    chatArea.appendChild(messageDiv);

    const messageSelect = document.getElementById('messageSelect');
    const option = document.createElement('option');
    option.value = message; // Utiliser un ID unique réel dans une application
    option.textContent = `${sender}: ${message}`;
    messageSelect.appendChild(option);
}

// Modifier un message
document.getElementById('editMessageButton').addEventListener('click', () => {
    const selectedOption = document.getElementById('messageSelect').selectedOptions[0];
    if (selectedOption) {
        const newMessage = prompt('Modifier le message:', selectedOption.value);
        if (newMessage) {
            // Simule la modification en local, car RTM ne supporte pas directement la modification
            selectedOption.value = newMessage;
            selectedOption.textContent = `${userID}: ${newMessage}`;
            console.log('Message modifié:', newMessage);
        }
    }
});

// Supprimer un message
document.getElementById('deleteMessageButton').addEventListener('click', () => {
    const selectedOption = document.getElementById('messageSelect').selectedOptions[0];
    if (selectedOption) {
        // Supprime localement
        selectedOption.remove();
        console.log('Message supprimé:', selectedOption.value);
    }
});

*/
// End--Chat
function closeForm() {
    document.getElementById("myForm").style.display = "none";
    document.getElementById("notificationBadge").style.display ='none';
  }

  function openForm() {
    document.getElementById("myForm").style.display = "block";
    document.getElementById("notificationBadge").style.display ='none';
  }



document.getElementById("inputGroupSelect01").addEventListener(
"change", async ()=> {
    Array.from(document.getElementById('user-streams').children).forEach(child => {
        child.remove();
    });
    const inputGroupSelect01 = document.getElementById("inputGroupSelect01");
    const option = inputGroupSelect01.options[inputGroupSelect01.selectedIndex].value;
    console.log("Option:", option);
    //const response = await fetch(`/join_room/${channel_name}/${option}/`);
    //const data = await response.json();
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
    await joinStreams(option);
}
);

  
