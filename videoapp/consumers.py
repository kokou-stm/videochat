# videoapp/consumers.py

import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async
from .models import *
from channels.db import  database_sync_to_async




class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        
        self.room_group_name = self.scope["url_route"]["kwargs"]["room_name"]
        print("Connexion établie",  self.room_group_name)
       
        meeting = await sync_to_async(Meeting.objects.get)(name = self.room_group_name)
        chat_message, created = await sync_to_async(Chatmessages.objects.get_or_create)(channel=meeting)
        #Chatmessages.objects.get_or_create(channel=meeting)
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        #print("receive, ", "=="*5, text_data)
        
        text_data_json = json.loads(text_data)
        #print("data: ", text_data_json)
        username = text_data_json.get('username')
        message = text_data_json.get('message')
        #numberOfDivs = text_data_json.get('numberOfDivs')
        #mesagechat, created = Messageschat.objects.get_or_create(identifiant=numberOfDivs, username=username, message= message)

        # Séparer la fonction de récupération ou création d'utilisateur
        user, created = await sync_to_async(User.objects.get_or_create)(username=username)
        meeting = await sync_to_async(Meeting.objects.get)(name = self.room_group_name)
        chat_message = await sync_to_async(Chatmessages.objects.get)(channel=meeting)
        
        if chat_message.messages_chat is None:
            chat_message.messages_chat = []
        if 'message' in text_data_json:
            
            message = text_data_json['message']
            
            chat_message.messages_chat.append({
                   'type': 'chat_message',
                    'message': message,
                    'username': username,
                })
            await sync_to_async(chat_message.save)()
            '''chat_message.messages_chat.append({
                   'type': 'chat_message',
                    'message': message,
                    'username': username,
                })
            chat_message.save()'''
            
           
        
            print("Message enregistré")
            print("Message reçu: ", message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': username,
                   # 'numberOfDivs' :numberOfDivs
                }
            )
        elif 'file' in text_data_json:
            print("Receive: ", 'file')
            file_data = text_data_json['file']
            file_name = text_data_json['file_name']
            file_type = text_data_json['file_type']

            # Decode Base64 and save to file
            file_data = base64.b64decode(file_data)
            file_path = await sync_to_async(default_storage.save)(f"uploads/{file_name}", ContentFile(file_data))
            file_url = f"{settings.MEDIA_URL}{file_path}"
            
            # Create ChatFile instance if you have such a model
            # await sync_to_async(ChatFile.objects.create)(user=user, file=file_path)
            print("File url: ", file_url)  
            chat_message.messages_chat.append({
                    'type': 'chat_file',
                    'file_url': file_url,
                    'file_name': file_name,
                    'username': username
                })
            chat_message.save()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_file',
                    'file_url': file_url,
                    'file_name': file_name,
                    'username': username
                }
            )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))

    async def chat_file(self, event):
        file_url = event['file_url']
        file_name = event['file_name']
        username = event['username']
        await self.send(text_data=json.dumps({
            'file_url': file_url,
            'file_name': file_name,
            'username': username
        }))



class VoiceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("Connection etablie voice")
        self.room_name = 'voice_room'
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        print("Message vocal reçu", text_data)
        text_data_json = json.loads(text_data)
        transcript = text_data_json.get('transcript')
        username = text_data_json.get('username')
        user, created = await sync_to_async(User.objects.get_or_create)(username=username)
        
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'voice_transcript',
                'transcript': transcript,
                'username': username,
            }
        )

    async def voice_transcript(self, event):
        transcript = event['transcript']
        username =  event['username']
        await self.send(text_data=json.dumps({
            'transcript': transcript,
           'username': username,
        }))

"""
class DiscussionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.discuss_id = self.scope['url_route']['kwargs']['discuss_id']
        self.user = self.scope["user"]
        print("self.room_name", self.discuss_id)
        
        # Ajouter l'utilisateur à la base de données s'il est authentifié
        if self.user.is_authenticated:
           
            discussion, created = await sync_to_async(Discussion.objects.get_or_create)(id=self.discuss_id)
            if discussion.users is None:
               discussion.users = []
            print("users: ", discussion.users)
            #discussion.users.add(self.user)
            # Si vous utilisez ManyToManyField, il faut utiliser remove() pour supprimer l'utilisateur
            await sync_to_async(discussion.users.add)(self.user)

           
        # Rejoindre la salle de chat
        self.room_group_name = f"chat_{self.discuss_id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Confirmer la connexion
        await self.accept()

        # Diffuser les utilisateurs actifs dans la salle
        await self.send_users()

    async def disconnect(self, close_code):
        # Retirer l'utilisateur de la base de données lorsqu'il quitte
        if self.user.is_authenticated:
            
            #await sync_to_async(ActiveUser.objects.filter)(user=self.user, discuss_id=self.discuss_id).delete()
            discussion = await sync_to_async(Discussion.objects.get)(id=self.discuss_id)
            # Si vous utilisez ManyToManyField, il faut utiliser remove() pour supprimer l'utilisateur
            await sync_to_async(discussion.users.remove)(self.user)
            


        # Quitter la salle de chat
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Diffuser les utilisateurs actifs dans la salle
        await self.send_users()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        
        username = text_data_json.get('username')
        message = text_data_json.get('message')
        if 'message' in text_data_json:
            
            message = text_data_json['message']
            
            '''chat_message.messages_chat.append({
                   'type': 'chat_message',
                    'message': message,
                    'username': username,
                })
            await sync_to_async(chat_message.save)()'''
            
            
           
        
            print("Message enregistré")
            print("Message reçu: ", message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': username,
                   # 'numberOfDivs' :numberOfDivs
                }
            )
        elif 'file' in text_data_json:
            print("Receive: ", 'file')
            file_data = text_data_json['file']
            file_name = text_data_json['file_name']
            file_type = text_data_json['file_type']

            # Decode Base64 and save to file
            file_data = base64.b64decode(file_data)
            file_path = await sync_to_async(default_storage.save)(f"uploads/{file_name}", ContentFile(file_data))
            file_url = f"{settings.MEDIA_URL}{file_path}"
            
            # Create ChatFile instance if you have such a model
            # await sync_to_async(ChatFile.objects.create)(user=user, file=file_path)
            print("File url: ", file_url)  
            '''chat_message.messages_chat.append({
                    'type': 'chat_file',
                    'file_url': file_url,
                    'file_name': file_name,
                    'username': username
                })
            chat_message.save()'''
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_file',
                    'file_url': file_url,
                    'file_name': file_name,
                    'username': username
                }
            )
        

        # Gérer les fichiers envoyés dans le chat
            async def chat_file(self, event):
                file_url = event["file_url"]
                file_name = event["file_name"]
                username = event["username"]

                # Envoyer le fichier au WebSocket
                await self.send(text_data=json.dumps({
                    "type": "chat_file",
                    "file_url": file_url,
                    "file_name": file_name,
                    "username": username
                }))



        
    # Envoi des utilisateurs actifs dans la salle
    async def send_users(self):
       
        discussion =  await sync_to_async(Discussion.objects.get)(id=self.discuss_id)
        #user_list = [user.user.username for user in liste_users.users.all()]
       
        usernames = await sync_to_async(list)(discussion.users.values_list('username', flat=True))
        print("Username: ", usernames) 
       
        # Envoyer la liste des utilisateurs actifs
        await self.send(text_data=json.dumps({
            'type': 'user_list',
            'users': usernames
        }))

    # Recevoir un message de la salle
    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        # Envoyer le message au WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))
"""



from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.conf import settings
from django.core.files.storage import default_storage
import base64
from asgiref.sync import sync_to_async
from .models import Discussion, DiscussionMessage

User = get_user_model()

class DiscussionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.discuss_id = self.scope['url_route']['kwargs']['discuss_id']
        self.user = self.scope["user"]

        print("self.room_name", self.discuss_id)

        if self.user.is_authenticated:
            discussion, created = await sync_to_async(Discussion.objects.get_or_create)(id=self.discuss_id)
            await sync_to_async(discussion.users.add)(self.user)

        self.room_group_name = f"chat_{self.discuss_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
        await self.send_users()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            discussion = await sync_to_async(Discussion.objects.get)(id=self.discuss_id)
            await sync_to_async(discussion.users.remove)(self.user)

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.send_users()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        username = text_data_json.get("username")

        user = await sync_to_async(User.objects.get)(username=username)
        discussion = await sync_to_async(Discussion.objects.get)(id=self.discuss_id)

        #  Si c'est un message texte
        if "message" in text_data_json:
            message = text_data_json["message"]

            # 📌 Sauvegarde dans la base de données
            chat_message = await sync_to_async(DiscussionMessage.objects.create)(
                discussion=discussion,
                user=user,
                content=message
            )

            # Envoi du message aux autres utilisateurs
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": chat_message.content,
                    "username": user.username,
                }
            )

        # 📁 Si c'est un fichier
        elif "file" in text_data_json:
            print("Réception d'un fichier")
            file_data = text_data_json["file"]
            file_name = text_data_json["file_name"]

            # 📌 Décodage et sauvegarde du fichier
            file_data = base64.b64decode(file_data)
            file_path = await sync_to_async(default_storage.save)(f"uploads/{file_name}", ContentFile(file_data))
            file_url = f"{settings.MEDIA_URL}{file_path}"

            # 📌 Sauvegarde du fichier en base de données
            chat_file = await sync_to_async(DiscussionMessage.objects.create)(
                discussion=discussion,
                user=user,
                file=file_path
            )

            # Envoi du fichier aux autres utilisateurs
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_file",
                    "file_url": file_url,
                    "file_name": file_name,
                    "username": username,
                }
            )

    async def chat_message(self, event):
        message = event["message"]
        username = event["username"]

        await self.send(text_data=json.dumps({
            "message": message,
            "username": username
        }))

    async def chat_file(self, event):
        file_url = event["file_url"]
        file_name = event["file_name"]
        username = event["username"]

        await self.send(text_data=json.dumps({
            "type": "chat_file",
            "file_url": file_url,
            "file_name": file_name,
            "username": username
        }))

    async def send_users(self):
        discussion = await sync_to_async(Discussion.objects.get)(id=self.discuss_id)
        usernames = await sync_to_async(list)(discussion.users.values_list("username", flat=True))

        print("Utilisateurs actifs :", usernames)

        await self.send(text_data=json.dumps({
            "type": "user_list",
            "users": usernames
        }))

