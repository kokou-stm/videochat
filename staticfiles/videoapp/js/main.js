let remoteUsers = {}                // Container for the remote streams
let mainStreamUid = null            // Reference for video in the full screen view

const cameraVideoPreset = '360p_7'          // 480 x 360p - 15fps @ 320 Kps
const audioConfigPreset = 'music_standard'  // 48kHz mono @ 40 Kbps
const screenShareVideoPreset = '1080_3'     // 1920 x 1080 - 30fps @ 3150 Kps

const localTracks = {
    camera: {
      audio: null,
      video: null
    },
    screen: {
      audio: null,
      video: null   
    }
  }

  const localTrackActive = {
    audio: false,
    video: false,
    screen: false
  }

  const Loglevel = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    NONE: 4
  }
  
// helper function to quickly get dom elements
function getById(divID) {
    return document.getElementById(divID)
  }
// New remote users joins the channel
const handleRemotUserJoined = async (user) => {
    const uid = user.uid
    remoteUsers[uid] = user         // add the user to the remote users
    console.log(`User ${uid} joined the channel`)
  }


// Initialiser les variables globales
let subscriptionKey = "GAhhrZCYQlVVFPpcyRRR2B2GypAFI9w1oxaYPlqTXOJIRaDt1chCJQQJ99AKACYeBjFXJ3w3AAAYACOGSatX";
let serviceRegion = "eastus";

let audioConfig;
let recognizer;
let input_voice= 'fr-FR';
let targetLanguage = 'en-US';
let lastRecognizedText = '';
let mediaStream = null;

// Variables pour Agora
const CHANNEL_NAME = document.getElementById('channelname').value;
//const meetingPassword = this.getAttribute('data-password');
//const username = document.getElementById('username').value;
const APP_ID = "f2891190d713482dbed4c3fd804ec233";
console.log("Nom channel: ", CHANNEL_NAME)
//const CHANNEL_NAME = "channel1";
let agoraEngine;
let localAudioTrack;
let localVideoTrack;
let isJoined = false;
let  audioPlaying = false;

// Sélecteurs d'éléments HTML
let videoGrid = document.getElementById('video-grid');
let microphonebut = document.getElementById("microphonebut");
let microphoneicon = document.getElementById("microphoneicon");

// Définir une variable globale pour voiceSocket et currentUsername
//let voiceSocket = null; // Définissez votre socket ici
//const currentUsername = "votreNomUtilisateur"; // Remplacez-le par la bonne valeur


const mainIsEmpty = () => {
    return getById('full-screen-video').childNodes.length === 0
  }


// Gestion des sélecteurs de langue
document.getElementById('languageSelect').addEventListener('change', (event) => {
    input_voice = event.target.value;
    stopRecognition();
    startRecognition();
    console.log("Langue d'entrée:", input_voice);
});

document.getElementById('scroll-button').addEventListener('change', (event) => {
    targetLanguage = event.target.value;
    console.log(targetLanguage);
});

// Fonction de reconnaissance vocale
const startRecognition = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechRecognitionLanguage = input_voice;

    audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizing = (s, e) => {
        document.getElementById('output').innerText = `Recognizing: ${e.result.text}`;
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

                document.getElementById('output').innerText = `Me: ${recognizedText}`;
                lastRecognizedText = recognizedText;
            }
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
            document.getElementById('output').innerText = "No speech could be recognized.";
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

// Synthèse vocale
/*
function synthesizeSpeech(text) {
    let language = targetLanguage;
    if (language === 'original') {
        language = 'en-US';
    }

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let selectedVoice = voices.find(voice => voice.lang.startsWith(language));
            if (!selectedVoice) {
                selectedVoice = voices[0];
            }
            utterance.voice = selectedVoice;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        console.error("La synthèse vocale n'est pas supportée par ce navigateur.");
    }
} */

// Gestionnaire pour l'icône du microphone
document.addEventListener("DOMContentLoaded", () => {
    microphonebut.addEventListener("click", () => {
        if (microphoneicon.classList.contains("fa-microphone")) {
            if (isJoined) {
                localAudioTrack.setEnabled(false);
            }
            microphoneicon.classList.remove("fa-microphone");
            microphoneicon.classList.add("fa-microphone-slash");
            console.log("Microphone désactivé.");
            stopRecognition();
        } else {
            if (isJoined) {
                localAudioTrack.setEnabled(true);
            }
            microphoneicon.classList.remove("fa-microphone-slash");
            microphoneicon.classList.add("fa-microphone");
            console.log("Microphone activé.");
            startRecognition();
        }
    });
});














// WebSocket pour la reconnaissance vocale
const voiceSocket = new WebSocket("wss://" + window.location.host + "/ws/voice/");
console.log("Voice WebSocket: ", voiceSocket);

voiceSocket.onmessage = async function (e) {
    const data = JSON.parse(e.data);

    if (data.username !== currentUsername && data.transcript) {
        console.log("Received transcript1: ", data.transcript);
        if (!audioPlaying) {
            console.log("Received transcript: ", data.transcript);
            const translatedText = await translateText(data.transcript);
            console.log("Translated text: ", translatedText);
            document.getElementById("remote_transcript").innerText = `${translateText}`;
            synthesizeSpeech(translatedText);
        }
    }
};

// Récupérer le jeton Agora et initialiser
async function fetchToken() {
    try {
        const response = await fetch('/generate_agora_token/');
        const data = await response.json();
        token = data.token;
        initializeAgora();
        startRecognition();
    } catch (error) {
        console.error("Error fetching token: ", error);
    }
}

// Remote user leaves the channel
const handleRemotUserLeft = async (user, reason) => {
    const uid = user.uid
    delete remoteUsers[uid]
    console.log(`User ${uid} left the channel with reason:${reason}`)
  }

// Initialisation de Agora RTC
async function initializeAgora() {
    agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    agoraEngine.on('user-published', async (user, mediaType) => {
        handleRemotUserJoined(user);
        await agoraEngine.subscribe(user, mediaType);
       
        if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack;
           /* if (remoteVideoTrack.mediaStreamTrack.label.toLowerCase().includes("screen")){
                console.log("screen: ", remoteVideoTrack.mediaStreamTrack.label)
            }else{
                console.log("remote: ", remoteVideoTrack.mediaStreamTrack.label)
            }
            
            console.log("width, height: ", remoteVideoTrack.mediaStreamTrack._videoHeight, remoteVideoTrack.mediaStreamTrack._videoWidth )
            console.log("Mediatraque: ", remoteVideoTrack.mediaStreamTrack)
            
            const remotePlayerContainer = createPlayerContainer(user.uid.toString());*/
           
            //remotePlayerContainer.classList.add('screen-share-active');
            /*videoGrid.appendChild(remotePlayerContainer);
            remoteVideoTrack.play(remotePlayerContainer.querySelector('.video-container'));*/
            const uid = user.uid; //.toString()
            //await createRemoteUserDiv(uid) 
            remoteVideoTrack.play('full-screen-video')
             

        }

        if (mediaType === 'audio') {
            console.log('Audio stream received');
            const remoteAudioTrack = user.audioTrack;
            handleAudioPlayback(remoteAudioTrack);
        }
    });

    agoraEngine.on('user-unpublished', (user) => {
        const remotePlayerContainer = document.getElementById(user.uid.toString());
        if (remotePlayerContainer) remotePlayerContainer.remove();
        handleRemotUserLeft(user, "leave");
    });

    await agoraEngine.join(APP_ID, CHANNEL_NAME, token, null);
    
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack = await AgoraRTC.createCameraVideoTrack();

    const localPlayerContainer = createPlayerContainer('local-player');
    videoGrid.appendChild(localPlayerContainer);
    localVideoTrack.play(localPlayerContainer.querySelector('.video-container'));

    await agoraEngine.publish([localAudioTrack, localVideoTrack]);
}

// Gérer la lecture audio
function handleAudioPlayback(remoteAudioTrack) {
    const scrollButton = document.getElementById('scroll-button');
    scrollButton.addEventListener('change', (event) => {
        if (event.target.value === 'original' && !audioPlaying) {
            remoteAudioTrack.play();
            audioPlaying = true;
        } else if (event.target.value !== 'original' && audioPlaying) {
            remoteAudioTrack.stop();
            audioPlaying = false;
        }
    });
}

// Créer un conteneur de lecteur vidéo
function createPlayerContainer(id) {
    const container = document.createElement('div');
    container.id = id;
    container.className = 'player-container';

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    container.appendChild(videoContainer);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    container.appendChild(controlsContainer);

    return container;
}

// create the remote user container and video player div
const createRemoteUserDiv = async (uid) => {
    const containerDivId = getById(`remote-user-${uid}-container`)
    if (containerDivId) return
    console.log(`add remote user div for uid: ${uid}`)
    // create a container for the remote video stream
    const containerDiv = document.createElement('div')
    containerDiv.id = `remote-user-${uid}-container`
    // create a div to display the video track
    const remoteUserDiv = document.createElement('div')
    remoteUserDiv.id = `remote-user-${uid}-video`
    remoteUserDiv.classList.add('remote-video')
    containerDiv.appendChild(remoteUserDiv)
    // Add remote user to remote video container
    getById('remote-video-container').appendChild(containerDiv)
  
    // Listen for double click to swap container with main div
    containerDiv.addEventListener('dblclick', async (e) => {
      await swapMainVideo(uid)
    })
  }

// Gestion du bouton de participation
document.getElementById('join-leave-button').onclick = async () => {
    if (isJoined) {
        await agoraEngine.leave();
        localAudioTrack.stop();
        localAudioTrack.close();
        localVideoTrack.stop();
        localVideoTrack.close();

        document.querySelectorAll('.player-container').forEach(container => container.remove());
        document.getElementById('join-leave-button').className = 'btn btn-success';
        stopRecognition();
        isJoined = false;
    } else {
        await fetchToken();
        document.getElementById('join-leave-button').className = 'btn btn-danger';
        isJoined = true;
    }
};

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

// Gestion du bouton de chat
document.addEventListener("DOMContentLoaded", () => {
    let chatbutton = document.getElementById("chatbutton");
    let chaticon = document.getElementById("chaticon");
    let chatArea = document.getElementById("chatarea");
    let targetDiv = document.getElementById("videodiv");

    chatbutton.addEventListener("click", () => {
        if (chaticon.classList.contains("fa-comment")) {
            chaticon.classList.replace("fa-comment", "fa-comments");
            chatArea.style.display = 'block';
            targetDiv.classList.replace("col-md-12", "col-md-9");
        } else {
            chaticon.classList.replace("fa-comments", "fa-comment");
            chatArea.style.display = 'none';
            targetDiv.classList.replace("col-md-9", "col-md-12");
        }
    });
});

// Gestion du partage d'écran
document.addEventListener("DOMContentLoaded", () => {
    const screenShareButton = document.getElementById('screenShareButton');
    let localScreenTrack = null;
    let screenClient = null;
    let screenContainer = null;
    let mainClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    async function startScreenShare() {
        try {
            screenClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            const tokenResponse = await fetch('/generate_agora_token/');
            const tokenData = await tokenResponse.json();
            await screenClient.join(APP_ID, CHANNEL_NAME, tokenData.token, null);

            localScreenTrack = await AgoraRTC.createScreenVideoTrack();

            
            screenContainer = createPlayerContainer('screen-share-container');
            screenContainer.classList.add('screen-share-active');
            
            videoGrid.appendChild(screenContainer);
             
            // move the main user from the full-screen div
            

            localScreenTrack.play(screenContainer.querySelector('.video-container'));
            await screenClient.publish(localScreenTrack);

            localScreenTrack.on('track-ended', stopScreenShare);
        } catch (error) {
            console.error("Erreur de partage d'écran: ", error);
        }
    }

    async function stopScreenShare() {
        if (localScreenTrack) {
            await screenClient.unpublish(localScreenTrack);
            localScreenTrack.close();
            screenContainer.remove();
            await screenClient.leave();
        }
    }

    screenShareButton.addEventListener('click', () => {
        if (localScreenTrack) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    });

    mainClient.on('message', (msg) => {
        const message = JSON.parse(msg.text);
        if (message.type === 'screen-share') {
            // Interface management
        }
    });
});



      

           //let recognizer;
    
 
           document.addEventListener("DOMContentLoaded", () => {
            // Gestion du bouton de main et de l'icône
            const handButton = document.getElementById("handButton");
            const handIcon = document.getElementById("handIcon");
            const handPopup = document.getElementById("handpopup");
          
            handButton.addEventListener("click", () => {
              if (handPopup.style.visibility === "hidden" || !handPopup.style.visibility) {
                handPopup.style.visibility = "visible";
                handIcon.classList.replace("fa-hand-sparkles", "fa-hand-peace");
              } else {
                handPopup.style.visibility = "hidden";
                handIcon.classList.replace("fa-hand-peace", "fa-hand-sparkles");
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
          
          // Fonction pour obtenir les voix de Microsoft TTS pour une langue donnée
          async function getVoicesForLanguage() {
          
            const region = "eastus";
            const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
          
            try {
              const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                  "Ocp-Apim-Subscription-Key": subscriptionKey
                }
              });
          
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
          
              const voices = await response.json();
              const selectedLanguage = document.getElementById("languageSelect").value;
          
              // Filtrer les voix pour le genre "Male" et la langue sélectionnée
              const voiceNames = voices
                .filter(voice => voice.Locale.includes(selectedLanguage) && voice.Gender === "Male")
                .map(voice => voice.ShortName);
          
              console.log(voiceNames);
              return voiceNames;
            } catch (error) {
              console.error("Erreur lors de la récupération des voix :", error);
            }
          }
          
          // Gestion de la connexion WebSocket
          const chatSocket = new WebSocket("wss://" + window.location.host + "/");
          console.log("Host:", chatSocket);
          
          chatSocket.onopen = () => {
            console.log("The connection was setup successfully!");
          };
          
          chatSocket.onclose = () => {
            console.log("The connection was closed!");
          };
          
          // Gestion de la sélection de fichiers
          document.querySelector("#fileselect").onclick = () => {
            document.querySelector("#fileInput").click();
          };
          
          document.querySelector("#fileInput").onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              document.querySelector("#filePreview").textContent = `${file.name}`;
              document.querySelector("#sendFileButton").style.display = "inline";
              document.querySelector("#removeFileButton").style.display = "inline";
            }
          };
          
          document.querySelector("#sendFileButton").onclick = () => {
            const fileInput = document.querySelector("#fileInput");
            const file = fileInput.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const fileData = e.target.result.split(",")[1]; // Get base64 string
                chatSocket.send(
                  JSON.stringify({
                    file: fileData,
                    file_name: file.name,
                    file_type: file.type,
                    username: currentUsername // Remplacez par votre logique pour le nom d'utilisateur
                  })
                );
              };
              reader.readAsDataURL(file);
          
              // Réinitialiser l'input file et masquer les options
              fileInput.value = "";
              document.querySelector("#filePreview").textContent = "";
              document.querySelector("#sendFileButton").style.display = "none";
              document.querySelector("#removeFileButton").style.display = "none";
            }
          };
          
          document.querySelector("#removeFileButton").onclick = () => {
            const fileInput = document.querySelector("#fileInput");
            fileInput.value = "";
            document.querySelector("#filePreview").textContent = "Aucun fichier sélectionné.";
            document.querySelector("#sendFileButton").style.display = "none";
            document.querySelector("#removeFileButton").style.display = "none";
          };
          
          // Gestion de l'envoi de messages
          document.querySelector("#id_message_send_input").onkeyup = (e) => {
            if (e.keyCode === 13) {
              document.querySelector("#id_message_send_button").click();
            }
          };
          
          document.querySelector("#id_message_send_button").onclick = () => {
            const messageInput = document.querySelector("#id_message_send_input").value;
            if (messageInput.trim() !== "") {
              chatSocket.send(
                JSON.stringify({
                  message: messageInput,
                  username: currentUsername // Remplacez par votre logique pour le nom d'utilisateur
                })
              );
              document.querySelector("#id_message_send_input").value = "";
            }
          };
          
          // Réception des messages et fichiers
          chatSocket.onmessage = async (e) => {
            const data = JSON.parse(e.data);
          
            if (data.message) {
              const message_trans = await translateText(data.message); // Assurez-vous que translateText est définie
              const message_add = `
                <p class="bg-secondary text-light px-1" style="border-radius: 1em;">
                  ${data.username} : ${message_trans}
                </p><br>`;
              document.getElementById("text_chat").insertAdjacentHTML("beforeend", message_add);
            } else if (data.file_url) {
              const file_message = `
                ${data.username}: <a href="${data.file_url}" download="${data.file_name}" class="btn btn-primary" style="margin-top: 5px;">
                  ${data.file_name} <i class="fas fa-download"></i>
                </a><br>`;
              document.getElementById("text_chat").insertAdjacentHTML("beforeend", file_message);
            }
          
            document.getElementById("id_message_send_input").value = "";
          };
          







async function synthesizeSpeech1(text) {
            const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
            const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
            const speechSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
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
                });
        }





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
            
            