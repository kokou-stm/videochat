# videoapp/routing.py

from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
     re_path(r'ws/voice/$', consumers.VoiceConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<discuss_id>\w+)/$', consumers.DiscussionConsumer.as_asgi()),
]
