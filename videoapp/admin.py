from django.contrib import admin
from .models import *
# Register your models here.

admin.site.register(Rooms)
admin.site.register(Meeting)
admin.site.register(Chatmessages)
admin.site.register(Discussion)
admin.site.register(Subscription)

