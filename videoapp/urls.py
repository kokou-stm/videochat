from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.contrib.auth.views import PasswordResetView
from .views import *
from django.urls import path


urlpatterns = [
    path('login/', connection, name='login'),
    path('logout/', deconnexion, name='logout'),
    path('code/', code, name='code'),
    path('boat/', boat, name='boat'),
    path('register/', register, name="register"),
    path('forgotpassword/', forgotpassword, name='forgotpassword'),
    path('updatepassword/<str:token>/<str:uid>/', updatepassword, name='updatepassword'),  
    path('generate_agora_token/<str:channel_name>/', generate_agora_token, name='generate_agora_token'),
    path('', index, name='index'),
    path('home', home, name='home'),
    path('home/<int:meeting_id>/', home, name='home'),
    path('ask_ia', ask_ia, name='ask_ia'),
    path('create_meeting/', create_meeting, name='create_meeting'),
    path('join_meeting/', join_meeting, name='join_meeting'),
    path('update_message/', update_message, name='update_message'),
    path('create_discussion/', create_discussion, name='create_discussion'),
    path('discussion/<int:id>/', joindre_discussion, name='discussion'),
    
      path('get_active_users/<int:discuss_id>/', get_active_users, name='get_active_users'),
    path('create_room/<str:channel_name>/', create_room, name='create_room'),
    path('join_room/<str:channel_name>/<str:room_name>/', join_room, name='join_room'),
     path('api/rooms/<str:channel_name>/', get_rooms, name='get_rooms'),
      path('co-admin/<int:id_user>/<int:meeting_id>/', co_admin, name='co_admin'),
    # URL pour retirer un co-hôte
    path('retirer-co-admin/<int:id_user>/<int:meeting_id>/', retirer_co_admin, name='retirer_co_admin'),
 path('check-if-host/<int:meeting_id>/', check_if_host, name='check_if_host'),
    #path('meeting/<int:meeting_id>/start/', views.start_meeting, name='start_meeting'),
    ]